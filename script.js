
  const C = Cesium;
  const TERRAIN_URL = 'https://terrain.reearth.land/cesium-mesh/ellipsoid';
  const WMTS_BASE = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi';

  const LAYERS = [
    { key: 'modis',   layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',            tms: 'GoogleMapsCompatible_Level9',  max: 9,  time: true },
    { key: 'viirs',   layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',             tms: 'GoogleMapsCompatible_Level9',  max: 9,  time: true },
    { key: 'landsat', layer: 'Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual', tms: 'GoogleMapsCompatible_Level12', max: 12, time: false },
    { key: 'srtm',    layer: 'SRTM_Color_Index',                                       tms: 'GoogleMapsCompatible_Level12', max: 12, time: false }
  ];

  let viewer;
  const imageryRefs = {};

  function yesterdayUTC() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  function layerUrl(cfg) {
    const date = document.getElementById('dateInput').value;
    if (cfg.time && date) return WMTS_BASE + '?TIME=' + date;
    return WMTS_BASE;
  }

  function buildImageryLayer(cfg) {
    const provider = new C.WebMapTileServiceImageryProvider({
      url: layerUrl(cfg),
      layer: cfg.layer,
      style: '',
      format: 'image/jpeg',
      tileMatrixSetID: cfg.tms,
      maximumLevel: cfg.max,
      tileWidth: 256,
      tileHeight: 256,
      tilingScheme: new C.WebMercatorTilingScheme()
    });
    return new C.ImageryLayer(provider);
  }

  function rebuildImagery() {
    viewer.imageryLayers.removeAll();
    const order = LAYERS.map((c) => c.key).reverse();
    for (const key of order) {
      const cfg = LAYERS.find((c) => c.key === key);
      const imagery = buildImageryLayer(cfg);
      viewer.imageryLayers.add(imagery);
      imageryRefs[key] = imagery;
      const checked = document.getElementById('chk-' + key).checked;
      const alpha = document.getElementById('op-' + key).value / 100;
      imagery.show = checked;
      imagery.alpha = alpha;
    }
    document.getElementById('dateInput').title =
      'Layers error if a date has no data — pick another day.';
  }

  function flyTo(btn) {
    viewer.camera.flyTo({
      destination: C.Cartesian3.fromDegrees(
        parseFloat(btn.dataset.lon), parseFloat(btn.dataset.lat), parseFloat(btn.dataset.h)
      ),
      orientation: {
        heading: 0,
        pitch: C.Math.toRadians(parseFloat(btn.dataset.pitch)),
        roll: 0
      },
      duration: 3
    });
  }

  async function init() {
    document.getElementById('dateInput').value = yesterdayUTC();

    viewer = new C.Viewer('cesiumContainer', {
      animation: false,
      timeline: false,
      geocoder: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      homeButton: false,
      sceneModePicker: false,
      fullscreenButton: false,
      infoBox: false,
      baseLayer: false,
      shouldAnimate: false
    });
    viewer.scene.globe.baseColor = C.Color.fromCssColorString('#10151f');
    viewer.scene.globe.showGroundAtmosphere = false;

    const terrain = await C.CesiumTerrainProvider.fromUrl(TERRAIN_URL);
    viewer.terrainProvider = terrain;

    await rebuildImagery();

    const first = document.querySelector('.places button');
    if (first) flyTo(first);

    document.getElementById('dateInput').addEventListener('change', rebuildImagery);

    for (const cfg of LAYERS) {
      document.getElementById('chk-' + cfg.key).addEventListener('change', (e) => {
        imageryRefs[cfg.key].show = e.target.checked;
      });
      document.getElementById('op-' + cfg.key).addEventListener('input', (e) => {
        imageryRefs[cfg.key].alpha = e.target.value / 100;
      });
    }

    document.querySelectorAll('.places button').forEach((b) => b.addEventListener('click', () => flyTo(b)));
  }

  function showError(err) {
    const box = document.getElementById('err');
    box.style.display = 'block';
    box.textContent = 'Error: ' + (err && err.stack ? err.stack : err);
  }

  window.addEventListener('error', (e) => showError(e.error || e.message));
  init().catch(showError);
