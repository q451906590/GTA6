// ======================================================
// MARKER SYSTEM
// Laden, Erstellen und Filtern der Map-Marker
// ======================================================

document.addEventListener("DOMContentLoaded", function () {
  const map = window.map;
  const markerRadius = window.markerRadius;
  const markerHoverRadius = window.markerHoverRadius;

  // ======================================================
  // MARKER STORAGE
  // ======================================================

  window.allFeatures = [];

  const vectorSource = new ol.source.Vector({ features: [] });
  window.vectorSource = vectorSource;

  const clusterSource = new ol.source.Cluster({
    distance: 30,
    minDistance: 12,
    source: vectorSource
  });

  window.clusterSource = clusterSource;

  // ======================================================
  // CLUSTER STYLE
  // ======================================================

  function createClusterStyle(size, clusterKind = 'landscape') {
  let clusterColor = 'rgba(255,60,60,0.9)'; // landscape

  if (clusterKind === 'trailer') {
  clusterColor = 'rgba(181,56,183,0.9)';
} else if (clusterKind === 'leak') {
  clusterColor = 'rgba(0,180,255,0.9)';
} else if (clusterKind === 'screenshot') {
  clusterColor = 'rgba(255,210,0,0.85)';
}

    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: size < 10 ? 14 : size < 50 ? 18 : 22,
        fill: new ol.style.Fill({
          color: clusterColor
        }),
        stroke: new ol.style.Stroke({
          color: '#ffffff',
          width: 3
        })
      }),
      text: new ol.style.Text({
        text: String(size),
        fill: new ol.style.Fill({
          color: '#ffffff'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0,0,0,0.35)',
          width: 2
        })
      })
    });
  }

  const clusterStyleCache = {};

  // ======================================================
  // MARKER LAYER
  // ======================================================

  window.markerLayer = new ol.layer.Vector({
    source: clusterSource,
    style: function (feature) {
      const features = feature.get('features');
      const size = features.length;

      if (size === 1) {
        const originalFeature = features[0];
        return originalFeature.getStyle() || originalFeature.get('customStyle');
      }

const allTrailer = features.every(f => f.get('type') === 'trailer');
const allLeak = features.every(f => f.get('type') === 'leak');
const allScreenshot = features.every(f => f.get('type') === 'screenshot');

let clusterKind = 'landscape';

if (allTrailer) {
  clusterKind = 'trailer';
} else if (allLeak) {
  clusterKind = 'leak';
} else if (allScreenshot) {
  clusterKind = 'screenshot';
}
      const cacheKey = `${clusterKind}_${size}`;

      if (!clusterStyleCache[cacheKey]) {
        clusterStyleCache[cacheKey] = createClusterStyle(size, clusterKind);
      }

      return clusterStyleCache[cacheKey];
    }
  });

  map.addLayer(window.markerLayer);

  // ======================================================
  // FEATURE ERSTELLEN
  // ======================================================

  function createFeatureFromDb(marker) {
    if (!marker || marker.map_x == null || marker.map_y == null) {
      return null;
    }

 let markerType = 'landscape';

 

// 1. Direkt aus marker.type lesen
if (typeof marker.type === 'string' && marker.type.trim() !== '') {
  markerType = marker.type.trim().toLowerCase();
}

// 2. Fallback über Kategorien robuster prüfen
if (Array.isArray(marker.categories)) {
  const normalizedCategories = marker.categories.map(cat => {
    if (typeof cat === 'string') return cat.trim().toLowerCase();
    if (cat && typeof cat.slug === 'string') return cat.slug.trim().toLowerCase();
    if (cat && typeof cat.name === 'string') return cat.name.trim().toLowerCase();
    return '';
  });

  if (normalizedCategories.includes('trailer')) {
  markerType = 'trailer';
} else if (normalizedCategories.includes('leak')) {
  markerType = 'leak';
} else if (normalizedCategories.includes('screenshot')) {
  markerType = 'screenshot';
}
}

// 3. Nur erlaubte Typen
if (!['landscape', 'trailer', 'leak', 'screenshot'].includes(markerType)) {
  markerType = 'landscape';
}

    let normalColor = 'rgba(255,60,60,0.85)'; // landscape
let hoverColor = 'rgba(255,60,60,1)';

if (markerType === 'trailer') {
  normalColor = 'rgba(181,56,183,0.85)';
  hoverColor = 'rgba(181,56,183,1)';
} else if (markerType === 'leak') {
  normalColor = 'rgba(0,180,255,0.85)';
  hoverColor = 'rgba(0,180,255,1)';
} else if (markerType === 'screenshot') {
  normalColor = 'rgba(255,200,0,0.85)';
  hoverColor = 'rgba(255,200,0,1)';
}

    const normalStyle = new ol.style.Style({
      image: new ol.style.Circle({
        radius: markerRadius,
        fill: new ol.style.Fill({
          color: normalColor
        }),
        stroke: new ol.style.Stroke({
          color: '#ffffff',
          width: 2
        })
      })
    });

    const hoverStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: markerHoverRadius,
    fill: new ol.style.Fill({
      color: hoverColor
    }),
    stroke: new ol.style.Stroke({
      color: '#ffffff',
      width: 3
    })
  })
});

let markerImage = marker.image || null;

// Trailer-Bilder automatisch erzeugen
if (!markerImage && markerType === 'trailer' && marker.source_key) {
  markerImage = `/wp-content/uploads/gta6-map/trailer/${marker.source_key}.jpg`;
}

if (!markerImage && markerType === 'screenshot' && marker.source_key) {
  markerImage = `/wp-content/uploads/gta6-map/screenshots/${marker.source_key}.jpg`;
}

    const feature = new ol.Feature({
  id: marker.id || null,
  geometry: new ol.geom.Point([
    parseFloat(marker.map_x),
    parseFloat(marker.map_y)
  ]),
  name: marker.title || '',
  name_en: marker.title || '',
  description: marker.description || '',
  description_de: marker.description || '',
  description_en: marker.description || '',
  type: markerType,
  categories: Array.isArray(marker.categories) ? marker.categories : [],
  source: marker.source || '',
  source_key: marker.source_key || '',

  // NEU für Popup
  map_x: marker.map_x ?? null,
  map_y: marker.map_y ?? null,
  region: marker.region || '',
  media_id: marker.media_id || '',
  notes: marker.notes || '',
  image: markerImage,
  link: null
});

    feature.set('customStyle', normalStyle);
    feature.set('hoverStyle', hoverStyle);
    feature.setStyle(normalStyle);

    return feature;
  }

  // ======================================================
  // MARKER LADEN
  // ======================================================

  fetch('/gta-6-map/data/markers.json')
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} beim Laden der markers.json`);
      }
      return res.json();
    })
    .then(data => {
      const markers = Array.isArray(data.markers) ? data.markers : [];

      console.log("📦 Geladene Marker aus markers.json:", markers.length);

      window.allFeatures = markers.map(createFeatureFromDb).filter(Boolean);

      window.vectorSource.clear(true);
      window.vectorSource.addFeatures(window.allFeatures);
      window.markerLayer.changed();

if (typeof updateFilterCounts === "function") {
  updateFilterCounts();
}

if (typeof updateMasterMarkerCount === "function") {
  updateMasterMarkerCount();
}

if (typeof bindCheckboxListeners === "function") {
  bindCheckboxListeners();
}

if (typeof setupGlobalMarkerSearch === "function") {
  setupGlobalMarkerSearch();
}

      const deeplinkId =
        typeof window.getUrlParam === 'function'
          ? window.getUrlParam('marker')
          : null;

      if (deeplinkId && typeof window.waitForFeatureById === 'function') {
        setTimeout(() => {
          window.waitForFeatureById(parseInt(deeplinkId, 10));
        }, 300);
      }
    })
    .catch(err => console.error("❌ Fehler beim Laden der markers.json:", err));

  // ======================================================
  // FILTER SYSTEM
  // ======================================================

  window.updateVisibleMarkers = function () {
  console.log("📋 updateVisibleMarkers gestartet");

  const landscapeChecked =
    document.querySelector('#map-menu input[data-type="landscape"]')?.checked ?? false;

  const trailerChecked =
    document.querySelector('#map-menu input[data-type="trailer"]')?.checked ?? false;

  const leakChecked =
    document.querySelector('#map-menu input[data-type="leak"]')?.checked ?? false;

    const screenshotChecked =
  document.querySelector('#map-menu input[data-type="screenshot"]')?.checked ?? false;

  console.log("🧩 Filterstatus:", {
    landscape: landscapeChecked,
    trailer: trailerChecked,
    leak: leakChecked,
    screenshot: screenshotChecked
  });

  const visibleFeatures = window.allFeatures.filter(feature => {
    const featureType = feature.get('type');

    if (featureType === 'trailer') {
      return trailerChecked;
    }

    if (featureType === 'screenshot') {
  return screenshotChecked;
    }

    if (featureType === 'leak') {
      return leakChecked;
    }

    return landscapeChecked;
  });

  console.log("🎯 Sichtbare Features nach Filterung:", visibleFeatures.length);

  window.vectorSource.clear(true);

  if (visibleFeatures.length > 0) {
    window.vectorSource.addFeatures(visibleFeatures);
  }

  window.markerLayer.changed();
};
});

// ======================================
// FILTER COUNTER (Landscape / Trailer)
// ======================================

function updateFilterCounts() {

  const counts = {};

  // Marker durchgehen
  window.allFeatures.forEach(feature => {

    const type = feature.get('type');
    if (!type) return;

    if (!counts[type]) {
      counts[type] = 0;
    }

    counts[type]++;
  });

  // Counter in Sidebar schreiben
  document.querySelectorAll('.filter-count').forEach(el => {

    const type = el.dataset.type;

    if (!type) return;

    const count = counts[type] || 0;

    el.textContent = count;
  });
}