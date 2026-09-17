import sys
import json
import os
from shapely.geometry import Polygon, mapping

def georeference_fmb(image_path, gcp_list, output_json_path):
    """
    Constructs a spatial GeoJSON boundary polygon from the provided Ground Control Points.
    """
    try:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Input image not found: {image_path}")

        coordinates_for_polygon = []

        # Extract the real-world Latitude/Longitude pinned by the user
        for item in gcp_list:
            coordinates_for_polygon.append((item["lng"], item["lat"]))

        # A valid spatial polygon must be closed (first point == last point)
        if len(coordinates_for_polygon) > 0 and coordinates_for_polygon[0] != coordinates_for_polygon[-1]:
            coordinates_for_polygon.append(coordinates_for_polygon[0])

        # Create Shapely Geographic Polygon
        poly = Polygon(coordinates_for_polygon)
        geojson_geometry = mapping(poly)

        output_data = {
            "type": "Feature",
            "geometry": geojson_geometry,
            "properties": {
                "gcp_count": len(gcp_list),
                "status": "SUCCESS"
            }
        }

        # Write GeoJSON output file
        with open(output_json_path, 'w') as f:
            json.dump(output_data, f, indent=2)

        print(json.dumps({"success": True, "output": output_json_path}))
        return True

    except Exception as e:
        error_res = {"success": False, "error": str(e)}
        print(json.dumps(error_res))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Insufficient arguments"}))
        sys.exit(1)

    img_path = sys.argv[1]
    gcp_json_file_path = sys.argv[2]
    out_path = sys.argv[3]

    try:
        with open(gcp_json_file_path, 'r') as f:
            gcps = json.load(f)
        
        georeference_fmb(img_path, gcps, out_path)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to read GCP file: {str(e)}"}))
        sys.exit(1)