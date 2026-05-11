document.addEventListener("DOMContentLoaded", function () {
  const map = window.map;

// ======================================================
// 7. COMMUNITY GRID
// ======================================================
//
// 34 x 34 Raster
// Schrittweite: 1000 Einheiten
//
// hilft beim Teilen von Koordinaten
// zwischen Community-Mitgliedern
//

const gridMin = -17000;
const gridMax = 17000;
const gridStep = 1000;

const minorGridFeatures = [];
const majorGridFeatures = [];

// Vertikale Linien
for (let x = gridMin; x <= gridMax; x += gridStep) {
  const feature = new ol.Feature({
    geometry: new ol.geom.LineString([
      [x, gridMin],
      [x, gridMax]
    ])
  });

  if (x === 0) {
    majorGridFeatures.push(feature);
  } else {
    minorGridFeatures.push(feature);
  }
}

// Horizontale Linien
for (let y = gridMin; y <= gridMax; y += gridStep) {
  const feature = new ol.Feature({
    geometry: new ol.geom.LineString([
      [gridMin, y],
      [gridMax, y]
    ])
  });

  if (y === 0) {
    majorGridFeatures.push(feature);
  } else {
    minorGridFeatures.push(feature);
  }
}

// Außenrahmen des Gesamtsystems -> dicke Hauptlinie
majorGridFeatures.push(
  new ol.Feature({
    geometry: new ol.geom.Polygon([[
      [gridMin, gridMin],
      [gridMax, gridMin],
      [gridMax, gridMax],
      [gridMin, gridMax],
      [gridMin, gridMin]
    ]])
  })
);

// Dünnes normales Raster
const minorGridLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: minorGridFeatures
  }),
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(255,255,255,0.18)',
      width: 1
    })
  })
});

// Dickere Hauptlinien: Außenrahmen + Zentrum
const majorGridLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: majorGridFeatures
  }),
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(255,255,255,0.38)',
      width: 2
    })
  })
});

map.addLayer(minorGridLayer);
map.addLayer(majorGridLayer);

window.minorGridLayer = minorGridLayer;
window.majorGridLayer = majorGridLayer;


// ------------------------------------------------------
// Mauskoordinaten im UI anzeigen
// ------------------------------------------------------
const mouseCoordsEl = document.getElementById('mouse-coords');

if (mouseCoordsEl) {
  mouseCoordsEl.textContent = 'X: 00000 Y: 00000';
}

function formatCoord(value) {
  return String(Math.round(value)).padStart(5, '0');
}


map.on('pointermove', function (evt) {
  if (!mouseCoordsEl) return;

  const x = evt.coordinate[0];
  const y = evt.coordinate[1];

  mouseCoordsEl.textContent = `X: ${formatCoord(x)} Y: ${formatCoord(y)}`;
});

// ------------------------------------------------------
// Koordinaten per Rechtsklick kopieren
// --
map.getViewport().addEventListener('contextmenu', handleRightClickCopyCoords);

});