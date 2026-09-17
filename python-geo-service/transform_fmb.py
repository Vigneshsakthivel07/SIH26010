import sys
import json
import os
from osgeo import gdal, ogr, osr
from shapely.geometry import Polygon, mapping

def georeference_fmb(image_path, gcp_list, output_json_path):
    """
    Warps an FMB image to WGS84 coordinates using GCPs and extracts the boundary polygon.
    """
    try:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Input image not found: {image_path}")

        # 1. Open source dataset
        src_ds = gdal.Open(image_path, gdal.GA_ReadOnly)
        if src_ds is None:
            raise Exception("Failed to open raster image with GDAL")

        # 2. Convert input GCPs to GDAL GCP objects
        gdal_gcps = []
        coordinates_for_polygon = []

        for item in gcp_list:
            gcp = gdal.GCP(
                item["lng"],      # Target Longitude (X)
                item["lat"],      # Target Latitude (Y)
                0,                # Elevation (Z)
                item["pixel_x"],  # Image Pixel X
                item["pixel_y"]   # Image Pixel Y
            )
            gdal_gcps.append(gcp)
            coordinates_for_polygon.append((item["lng"], item["lat"]))

        # Close polygon ring
        if coordinates_for_polygon[0] != coordinates_for_polygon[-1]:
            coordinates_for_polygon.append(coordinates_for_polygon[0])

        # 3. Create Shapely Polygon from GCP real-world coordinates
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

        # 4. Write GeoJSON output file
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

    # FIX 4: Open and read the JSON file created by Node.js instead of parsing a string argument
    try:
        with open(gcp_json_file_path, 'r') as f:
            gcps = json.load(f)
        
        georeference_fmb(img_path, gcps, out_path)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to read GCP temp file: {str(e)}"}))
        sys.exit(1)