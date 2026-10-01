# Satellite imagery on topographic terrain (NASA GIBS + Cesium)

A zero-API-key web demo that drapes live NASA satellite imagery and a
Digital Elevation Model (DEM) over real 3D terrain.

## Run it

```bash
npm start        # serves on http://localhost:8000
npm test         # smoke test: serves the app and checks all 4 layers are configured
```

Or, without npm: `python3 -m http.server 8000`.

Open http://localhost:8000 — you should see the Grand Canyon with
satellite imagery + elevation tints. Use the place buttons and the date /
opacity controls.

No build step, no API keys, no dependencies to install. The page loads
CesiumJS, NASA GIBS tiles, and global terrain straight from their CDNs.

## What you're looking at

| Layer | Source | What it is |
|---|---|---|
| MODIS Terra / VIIRS true color | NASA GIBS WMTS | Satellite imagery (250–375 m), date-dependent |
| Landsat WELD annual mosaic | NASA GIBS WMTS | Satellite imagery, 30 m |
| SRTM color index | NASA GIBS WMTS | Elevation tints from the SRTM digital elevation model — the "topographic map" layer |
| 3D surface | Re:Earth Mapterhorn (quantized-mesh) | Real terrain built from a global DEM, drapes everything above |

Everything is live — no imagery is downloaded or stored.

## Tech stack

- **Data**: NASA [Earthdata](https://www.earthdata.nasa.gov) / [GIBS](https://earthdata.nasa.gov/gibs) — WMTS tiled satellite imagery, no login needed. Digital elevation models: NASA SRTM, Copernicus (via OpenTopography / AWS).
- **Processing**: Python + `rasterio`/GDAL for GeoTIFF handling; Microsoft Planetary Computer / AWS Open Data for full-resolution Landsat & Sentinel-2 scenes (not served by GIBS).
- **Display**: [CesiumJS](https://cesium.com/cesiumjs/) (3D globe + terrain), alternatives: MapLibre GL / Leaflet for 2D web maps, QGIS for desktop.

## How the satellite → map pipeline works here

1. Global terrain (quantized-mesh) is requested by Cesium as elevation
   tiles and rendered as the 3D surface.
2. GIBS WMTS tile requests are made per level: `.../wmts/epsg3857/best/wmts.cgi?TIME=2026-09-23&LAYER=MODIS_Terra_CorrectedReflectance_TrueColor&...`.
3. Each layer is added as a Cesium `ImageryLayer`; opacity and visibility are adjustable at runtime.

Layer configuration lives in the `LAYERS` array in `script.js`. To swap
in any of the ~1,000+ GIBS products, drop in the product's `layer` id,
its `TileMatrixSet` (e.g. `GoogleMapsCompatible_Level12`), max zoom, and
advertised `format` — find them in the GIBS [Visualization Product Catalog](https://gibs.earthdata.nasa.gov).
`time: true` products take a `TIME=YYYY-MM-DD` query param (set via the
date picker).

## Glossary

Acronyms and jargon used in this project, in rough order of appearance.

| Term | Stands for | What it means here |
|---|---|---|
| **GEOINT** | Geospatial Intelligence | Information gathered from imagery and geographic data. The project's name. |
| **Earthdata** | — | NASA's portal for Earth science data. |
| **GIBS** | Global Imagery Browse Services | NASA's service that turns satellite data into ready-to-display map tiles. Free, no API key. |
| **WMTS** | Web Map Tile Service | A standard (from the OGC) for requesting a map as small square images ("tiles") by zoom level, row and column. |
| **OGC** | Open Geospatial Consortium | The standards body behind WMTS, GeoTIFF and other geo formats. |
| **TileMatrixSet** | — | WMTS term for the grid of tiles a layer uses, i.e. its tile size and zoom levels (e.g. `GoogleMapsCompatible_Level9` = up to zoom 9). |
| **EPSG:3857** | European Petroleum Survey Group code 3857 | The "Web Mercator" map projection used by Google Maps, OpenStreetMap and the GIBS endpoint here. |
| **MODIS** | Moderate Resolution Imaging Spectroradiometer | Camera-like instrument on NASA's **Terra** and **Aqua** satellites; photographs the whole Earth about daily at 250 m. |
| **VIIRS** | Visible Infrared Imaging Radiometer Suite | MODIS's successor instrument, at 375 m. |
| **SNPP** | Suomi National Polar-orbiting Partnership | The satellite that carries the VIIRS used here. |
| **Corrected Reflectance / True Color** | — | Imagery processed so it looks like a natural-color photo (red, green and blue bands). |
| **Landsat** | Land + satellite (not an acronym) | NASA/USGS satellite series imaging Earth at 30 m since 1972. |
| **WELD** | Web-Enabled Landsat Data | Project that combined many Landsat scenes into cloud-free mosaics. Static archive. |
| **SRTM** | Shuttle Radar Topography Mission | Space Shuttle radar mission (Feb 2000) that measured the height of nearly all land on Earth. |
| **DEM** | Digital Elevation Model | A grid of ground heights. It's what turns the flat imagery into 3D mountains and valleys. |
| **Color index** | — | A DEM rendered as colors (e.g. green low, brown/white high) so elevation is visible on a 2D map. |
| **Quantized-mesh** | — | Compact terrain-tile format Cesium uses to stream 3D ground shape. |
| **CesiumJS** | — | Open-source JavaScript library for 3D globes and maps in the browser. |
| **CDN** | Content Delivery Network | Servers that host files (like Cesium) close to users; the page loads them from there instead of from `node_modules`. |
| **GDAL** | Geospatial Data Abstraction Library | The standard toolkit for reading and converting raster and vector geo files. |
| **rasterio** | — | Python library built on GDAL for working with raster files. |
| **GeoTIFF** | Geographic TIFF | A TIFF image with embedded coordinates, so software knows where on Earth each pixel is. |
| **Sentinel-2** | — | European (Copernicus) satellites imaging land at 10 m. |
| **Copernicus** | — | The European Union's Earth observation program; also publishes a global DEM. |
| **GIS** | Geographic Information System | Software for viewing and analyzing map data. |
| **QGIS** | Quantum GIS | Free desktop GIS application. |
| **MapLibre GL / Leaflet** | — | JavaScript libraries for 2D web maps, alternatives to Cesium. |
