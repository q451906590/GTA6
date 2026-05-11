// ======================================================
// GTA 6 MAP CORE
// Basis-Konfiguration, Views, Tile Sources und Map Setup
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

  // ======================================================
  // 1. MAP KONFIGURATION
  // ======================================================

  // Tile-Größe der Karten
  const tileSize = 256;

  // Maximale Zoomstufe der GTA6 Karte
  const maxZoom = 10;

  // Gesamtes Koordinatensystem
  const worldExtent = [-17000, -17000, 17000, 17000];

  // Ausschnitt der GTA 6-Karte
  const gta6Extent = [-16500, -8000, 3500, 12000];

  // GTA 5-Vergleichskarte
  const gta5Extent = [-5000, -7500, 5000, 7500];

  const projection = new ol.proj.Projection({
    code: 'CUSTOM',
    units: 'pixels',
    extent: worldExtent
  });

  const gta5MapWidth = gta5Extent[2] - gta5Extent[0];
  const gta5TilesAtMaxZoomX = 64;
  const gta5MaxZoom = 7;

  const gta5MaxZoomResolution = gta5MapWidth / (gta5TilesAtMaxZoomX * tileSize);

  const gta5Resolutions = Array.from({ length: gta5MaxZoom + 1 }, (_, z) =>
    gta5MaxZoomResolution * Math.pow(2, gta5MaxZoom - z)
  );

  const gta5TileGrid = new ol.tilegrid.TileGrid({
    extent: gta5Extent,
    origin: [gta5Extent[0], gta5Extent[3]],
    tileSize: tileSize,
    resolutions: gta5Resolutions
  });

  // ======================================================
  // 2. TILE SOURCES (GTA6 + GTA5)
  // ======================================================

  const gta5Source = new ol.source.XYZ({
    url: '/map-assets/gta-6-karte/tiles-gta5/{z}/{x}/{y}.png',
    tileGrid: gta5TileGrid,
    projection: projection,
    crossOrigin: 'anonymous',
    wrapX: false,
    transition: 0
  });

  const gta5Layer = new ol.layer.Tile({
    source: gta5Source,
    preload: Infinity,
    visible: false
  });

  const gta5View = new ol.View({
    projection: projection,
    center: ol.extent.getCenter(gta5Extent),
    zoom: 2,
    minZoom: 0,
    maxZoom: gta5MaxZoom,
    resolutions: gta5Resolutions,
    extent: worldExtent,
    constrainResolution: true,
    constrainOnlyCenter: true,
    enableRotation: false
  });

  const gta6Width = gta6Extent[2] - gta6Extent[0];
  const tilesAtMaxZoom = 625;
  const maxZoomResolution = gta6Width / (tilesAtMaxZoom * tileSize);

  const resolutions = Array.from({ length: maxZoom + 1 }, (_, z) =>
    maxZoomResolution * Math.pow(2, maxZoom - z)
  );

  const tileGrid = new ol.tilegrid.TileGrid({
    extent: gta6Extent,
    origin: [gta6Extent[0], gta6Extent[3]],
    tileSize: tileSize,
    resolutions: resolutions
  });

  const colourSource = new ol.source.XYZ({
    url: '/map-assets/gta-6-karte/tiles-colour/{z}/{x}/{y}.png',
    tileGrid: tileGrid,
    projection: projection,
    crossOrigin: 'anonymous',
    wrapX: false,
    transition: 0
  });

  const blackSource = new ol.source.XYZ({
    url: '/map-assets/gta-6-karte/tiles-black/{z}/{x}/{y}.png',
    tileGrid: tileGrid,
    projection: projection,
    crossOrigin: 'anonymous',
    wrapX: false,
    transition: 0
  });

  const tileLayer = new ol.layer.Tile({
    source: colourSource,
    preload: Infinity
  });

  const isMobile = window.innerWidth <= 768;

  const isTouchDevice =
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;

  const markerRadius = isTouchDevice ? 8 : 5;
  const markerHoverRadius = isTouchDevice ? 8 : 7;
  const hitTolerance = isTouchDevice ? 14 : 3;

  // Startposition (auf GTA-6 Karte zentriert)
  const initialCenter = [
    (gta6Extent[0] + gta6Extent[2]) / 2,
    (gta6Extent[1] + gta6Extent[3]) / 2
  ];

  const initialZoom = isMobile ? 1 : 2;

  const gta6View = new ol.View({
    projection: projection,
    center: initialCenter,
    zoom: initialZoom,
    minZoom: 0,
    maxZoom: maxZoom,
    resolutions: resolutions,
    extent: worldExtent,
    constrainResolution: true,
    constrainOnlyCenter: true,
    enableRotation: false
  });

  // ======================================================
  // 3. MAP INITIALISIERUNG
  // ======================================================

  const map = new ol.Map({
    target: 'map',
    layers: [tileLayer, gta5Layer],
    view: gta6View,
    controls: ol.control.defaults.defaults({
      zoom: false,
      rotate: false,
      attribution: false
    })
  });

  function switchToGta6Map() {
    tileLayer.setVisible(true);
    gta5Layer.setVisible(false);

    if (window.minorGridLayer) window.minorGridLayer.setVisible(true);
    if (window.majorGridLayer) window.majorGridLayer.setVisible(true);

    map.setView(gta6View);
  }

  function switchToGta5Map() {
    tileLayer.setVisible(false);
    gta5Layer.setVisible(true);

    if (window.minorGridLayer) window.minorGridLayer.setVisible(true);
    if (window.majorGridLayer) window.majorGridLayer.setVisible(true);

    map.setView(gta5View);
  }

  // ======================================================
  // 4. BASE MAP STYLE SWITCHER
  // ======================================================

  window.baseMapSources = {
    colour: colourSource,
    black: blackSource
  };

  window.currentBaseMapStyle = 'colour';

  function setMapStyle(style) {
    if (!window.baseMapSources[style]) return;
    if (window.currentBaseMapStyle === style) return;

    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.classList.add('is-fading');
    }

    setTimeout(() => {
      tileLayer.setSource(window.baseMapSources[style]);
      window.currentBaseMapStyle = style;

      document.querySelectorAll('.map-style-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mapstyle === style);
      });

      try {
        localStorage.setItem('gta6MapStyle', style);
      } catch (e) {
        console.warn('Map-Style konnte nicht gespeichert werden:', e);
      }

      setTimeout(() => {
        if (mapElement) {
          mapElement.classList.remove('is-fading');
        }
      }, 120);
    }, 120);
  }

  function initMapStyleSwitcher() {
    const switcher = document.getElementById('map-style-switcher');
    if (!switcher) return;

    const buttons = switcher.querySelectorAll('.map-style-btn');

    buttons.forEach(btn => {
      btn.addEventListener('click', function () {
        const style = this.dataset.mapstyle;
        setMapStyle(style);
      });
    });

    let savedStyle = 'colour';

    try {
      savedStyle = localStorage.getItem('gta6MapStyle') || 'colour';
    } catch (e) {
      console.warn('Gespeicherter Map-Style konnte nicht gelesen werden:', e);
    }

    setMapStyle(savedStyle);
  }

  initMapStyleSwitcher();

  // ======================================================
  // 5. GLOBALE MAP CORE OBJEKTE
  // ======================================================

  window.map = map;
  window.tileLayer = tileLayer;
  window.gta5Layer = gta5Layer;
  window.gta6View = gta6View;
  window.gta5View = gta5View;
  window.setMapStyle = setMapStyle;
  window.switchToGta6Map = switchToGta6Map;
  window.switchToGta5Map = switchToGta5Map;

  window.projection = projection;
  window.worldExtent = worldExtent;
  window.gta6Extent = gta6Extent;
  window.gta5Extent = gta5Extent;

  window.tileGrid = tileGrid;
  window.gta5TileGrid = gta5TileGrid;
  window.resolutions = resolutions;
  window.gta5Resolutions = gta5Resolutions;
  window.maxZoom = maxZoom;
  window.gta5MaxZoom = gta5MaxZoom;

  window.isMobile = isMobile;
  window.isTouchDevice = isTouchDevice;
  window.markerRadius = markerRadius;
  window.markerHoverRadius = markerHoverRadius;
  window.hitTolerance = hitTolerance;
  window.initialCenter = initialCenter;
  window.initialZoom = initialZoom;
});