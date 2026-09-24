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
