// ======================================================
// MAP INTERACTIONS
// Marker-Klick, Tooltip und Deeplink
// ======================================================

document.addEventListener("DOMContentLoaded", function () {
  const map = window.map;
  const isTouchDevice = window.isTouchDevice;
  const hitTolerance = window.hitTolerance;

  // ======================================================
  // MARKER INTERAKTION
  // ======================================================

  map.on('click', function (evt) {
    const clickCoords = evt.coordinate;

    console.log(`📍 Community: X=${clickCoords[0].toFixed(2)} Y=${clickCoords[1].toFixed(2)}`);

    const xField = document.getElementById('coord-x');
    const yField = document.getElementById('coord-y');

    if (xField && yField) {
      xField.value = clickCoords[0].toFixed(2);
      yField.value = clickCoords[1].toFixed(2);
    }

    const clickedFeature = map.forEachFeatureAtPixel(
      evt.pixel,
      function (feature, layer) {
        if (layer === window.markerLayer) {
          return feature;
        }
        return null;
      },
      {
        hitTolerance: hitTolerance,
        layerFilter: function (layer) {
          return layer === window.markerLayer;
        }
      }
    );

    if (!clickedFeature) {
      if (window.popup) {
        window.popup.setPosition(undefined);
      }
      window.currentFeature = null;
      return;
    }

    const clusteredFeatures = clickedFeature.get('features');

    // Klick auf echten Cluster -> reinzoomen
    if (clusteredFeatures && clusteredFeatures.length > 1) {
      const extent = ol.extent.createEmpty();

      clusteredFeatures.forEach(f => {
        ol.extent.extend(extent, f.getGeometry().getExtent());
      });

      map.getView().fit(extent, {
        padding: [80, 80, 80, 80],
        duration: 300,
        maxZoom: 8
      });

      return;
    }

    // Einzelmarker aus Cluster-Feature holen
    const feature = clusteredFeatures ? clusteredFeatures[0] : clickedFeature;

    if (feature && typeof buildPopupContent === 'function') {
      window.currentFeature = feature;
      buildPopupContent(feature);

      const featureCoords = feature.getGeometry().getCoordinates();
      const isMobile = window.innerWidth <= 768;

      const popupEl = document.getElementById('popup');
      const popupHeight = popupEl ? popupEl.offsetHeight : 0;

      const padding = isMobile
        ? [popupHeight + 100, 150, 20, 40]
        : [310, 100, 100, 100];

      if (window.popup) {
        window.popup.setOffset([0, isMobile ? -40 : -20]);
      }

      map.getView().fit(
        new ol.geom.Point(featureCoords),
        {
          padding: padding,
          duration: 400,
          maxZoom: map.getView().getZoom(),
          nearest: true
        }
      );
    } else {
      if (window.popup) {
        window.popup.setPosition(undefined);
      }
      window.currentFeature = null;
    }
  });

  // ======================================================
  // MARKER TOOLTIP
  // ======================================================

  let hoveredFeature = null;

  const tooltipElement = document.getElementById('marker-tooltip');

  const tooltipOverlay = new ol.Overlay({
    element: tooltipElement,
    offset: [0, -10],
    positioning: 'bottom-center',
    stopEvent: false
  });

  map.addOverlay(tooltipOverlay);

  // Hover und Tooltip nur auf Nicht-Touch-Geräten
  if (!isTouchDevice) {
    map.on('pointermove', function (evt) {
      if (evt.dragging) {
        tooltipOverlay.setPosition(undefined);

        if (tooltipElement) {
          tooltipElement.style.display = 'none';
        }

        if (hoveredFeature) {
          hoveredFeature.setStyle(hoveredFeature.get('customStyle'));
          hoveredFeature = null;
        }

        map.getTargetElement().style.cursor =
          'url(/wp-content/themes/jannah-child/gta-6-map/icons/cursor.cur), auto';
        return;
      }

      const feature = map.forEachFeatureAtPixel(
        evt.pixel,
        function (f) {
          return f && f.getStyle() ? f : null;
        },
        {
          hitTolerance: hitTolerance
        }
      );

      if (hoveredFeature && hoveredFeature !== feature) {
        hoveredFeature.setStyle(hoveredFeature.get('customStyle'));
        hoveredFeature = null;
      }

      if (feature) {
        if (hoveredFeature !== feature) {
          feature.setStyle(feature.get('hoverStyle') || feature.get('customStyle'));
          hoveredFeature = feature;
        }

        const lang = getCurrentLang();
        const name =
          feature.get(`name${lang === 'de' ? '' : '_en'}`) ||
          feature.get('name') ||
          'Unnamed';

        if (tooltipElement) {
          tooltipElement.innerHTML = name;
          tooltipElement.style.display = 'block';
        }

        tooltipOverlay.setPosition(evt.coordinate);

        map.getTargetElement().style.cursor =
          'url(/wp-content/themes/jannah-child/gta-6-map/icons/cursor_hover.cur), pointer';
      } else {
        tooltipOverlay.setPosition(undefined);

        if (tooltipElement) {
          tooltipElement.style.display = 'none';
        }

        if (hoveredFeature) {
          hoveredFeature.setStyle(hoveredFeature.get('customStyle'));
          hoveredFeature = null;
        }

        map.getTargetElement().style.cursor =
          'url(/wp-content/themes/jannah-child/gta-6-map/icons/cursor.cur), auto';
      }
    });
  } else {
    if (tooltipElement) {
      tooltipElement.style.display = 'none';
    }
  }

  // ======================================================
  // DEEPLINK SYSTEM
  // ======================================================

  function highlightMarkerById(markerId) {
    const feature = window.allFeatures.find(f => f.get('id') === markerId);
    if (!feature) return;

    window.currentFeature = feature;

    // Wenn Marker aktuell nicht sichtbar ist -> temporär hinzufügen
    if (!window.vectorSource.getFeatures().includes(feature)) {
      console.log("🔍 Deeplink-Marker war nicht sichtbar – wird temporär hinzugefügt:", markerId);
      window.vectorSource.addFeature(feature);
      window.markerLayer.changed();
    }

    const coords = feature.getGeometry().getCoordinates();

    if (typeof buildPopupContent === 'function') {
      buildPopupContent(feature);
    }

    map.getView().fit(
      new ol.geom.Point(coords),
      {
        padding: [100, 100, 100, 100],
        duration: 400,
        maxZoom: map.getView().getZoom(),
        nearest: true
      }
    );
  }

  window.highlightMarkerById = highlightMarkerById;

  function waitForFeatureById(id, attempts = 10) {
    const feature = window.allFeatures.find(f => f.get('id') === id);
    if (feature || attempts <= 0) {
      highlightMarkerById(id);
    } else {
      setTimeout(() => waitForFeatureById(id, attempts - 1), 200);
    }
  }

  function getUrlParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  window.waitForFeatureById = waitForFeatureById;
  window.getUrlParam = getUrlParam;
});