// GTA 6 interactive map implementation aligned with https://gtadb.net/gta-6-map/interactive/

document.addEventListener('DOMContentLoaded', function () {
  const tileSize = 256;
  const maxZoom = 10;
  const gta5MaxZoom = 7;
  const worldExtent = [-17000, -17000, 17000, 17000];
  const gta6Extent = [-16500, -8000, 3500, 12000];
  const gta5Extent = [-5000, -7500, 5000, 7500];
  const tileBaseUrl = 'https://gtadb.net/map-assets/gta-6-karte';

  const projection = new ol.proj.Projection({
    code: 'CUSTOM',
    units: 'pixels',
    extent: worldExtent
  });

  function buildResolutions(extent, zoomCount, tilesAtMaxZoomX) {
    const mapWidth = extent[2] - extent[0];
    const maxZoomResolution = mapWidth / (tilesAtMaxZoomX * tileSize);
    return Array.from({ length: zoomCount + 1 }, (_, z) =>
      maxZoomResolution * Math.pow(2, zoomCount - z)
    );
  }

  const resolutions = buildResolutions(gta6Extent, maxZoom, 625);
  const gta5Resolutions = buildResolutions(gta5Extent, gta5MaxZoom, 64);

  const tileGrid = new ol.tilegrid.TileGrid({
    extent: gta6Extent,
    origin: [gta6Extent[0], gta6Extent[3]],
    tileSize,
    resolutions
  });

  const gta5TileGrid = new ol.tilegrid.TileGrid({
    extent: gta5Extent,
    origin: [gta5Extent[0], gta5Extent[3]],
    tileSize,
    resolutions: gta5Resolutions
  });

  function createTileSource(folder, grid) {
    return new ol.source.XYZ({
      url: `${tileBaseUrl}/${folder}/{z}/{x}/{y}.png`,
      tileGrid: grid,
      projection,
      wrapX: false,
      transition: 0
    });
  }

  const colourSource = createTileSource('tiles-colour', tileGrid);
  const blackSource = createTileSource('tiles-black', tileGrid);
  const gta5Source = createTileSource('tiles-gta5', gta5TileGrid);

  const tileLayer = new ol.layer.Tile({
    source: colourSource,
    preload: Infinity,
    visible: true
  });

  const gta5Layer = new ol.layer.Tile({
    source: gta5Source,
    preload: Infinity,
    visible: false,
    opacity: 1
  });

  const isMobile = window.innerWidth <= 768;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const markerRadius = isTouchDevice ? 8 : 5;
  const markerHoverRadius = isTouchDevice ? 8 : 7;
  const hitTolerance = isTouchDevice ? 14 : 3;

  const initialCenter = [
    (gta6Extent[0] + gta6Extent[2]) / 2,
    (gta6Extent[1] + gta6Extent[3]) / 2
  ];

  const gta6View = new ol.View({
    projection,
    center: initialCenter,
    zoom: isMobile ? 1 : 2,
    minZoom: 0,
    maxZoom,
    resolutions,
    extent: worldExtent,
    constrainResolution: true,
    constrainOnlyCenter: true,
    enableRotation: false
  });

  const map = new ol.Map({
    target: 'map',
    layers: [tileLayer, gta5Layer],
    view: gta6View,
    controls: ol.control.defaults.defaults({ zoom: false, rotate: false, attribution: false })
  });

  // Grid and coordinates
  const gridMin = -17000, gridMax = 17000, gridStep = 1000;
  const minorGridFeatures = [], majorGridFeatures = [];

  for (let gx = gridMin; gx <= gridMax; gx += gridStep) {
    const f = new ol.Feature({ geometry: new ol.geom.LineString([[gx, gridMin], [gx, gridMax]]) });
    (gx === 0 ? majorGridFeatures : minorGridFeatures).push(f);
  }

  for (let gy = gridMin; gy <= gridMax; gy += gridStep) {
    const f = new ol.Feature({ geometry: new ol.geom.LineString([[gridMin, gy], [gridMax, gy]]) });
    (gy === 0 ? majorGridFeatures : minorGridFeatures).push(f);
  }

  majorGridFeatures.push(new ol.Feature({
    geometry: new ol.geom.Polygon([[[gridMin, gridMin], [gridMax, gridMin], [gridMax, gridMax], [gridMin, gridMax], [gridMin, gridMin]]])
  }));

  const minorGridLayer = new ol.layer.Vector({
    source: new ol.source.Vector({ features: minorGridFeatures }),
    style: new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'rgba(255,255,255,0.18)', width: 1 }) })
  });

  const majorGridLayer = new ol.layer.Vector({
    source: new ol.source.Vector({ features: majorGridFeatures }),
    style: new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'rgba(255,255,255,0.38)', width: 2 }) })
  });

  map.addLayer(minorGridLayer);
  map.addLayer(majorGridLayer);

  const mouseCoordsEl = document.getElementById('mouse-coords');
  function formatCoord(value) { return String(Math.round(value)).padStart(5, '0'); }

  if (mouseCoordsEl) mouseCoordsEl.textContent = 'X: 00000 Y: 00000';
  map.on('pointermove', function (evt) {
    if (!mouseCoordsEl) return;
    mouseCoordsEl.textContent = `X: ${formatCoord(evt.coordinate[0])} Y: ${formatCoord(evt.coordinate[1])}`;
  });

  // Markers
  const TYPE_COLORS = {
    landscape: { normal: 'rgba(255,60,60,0.85)', hover: 'rgba(255,60,60,1)', cluster: 'rgba(255,60,60,0.9)', label: 'Landscape' },
    trailer: { normal: 'rgba(181,56,183,0.85)', hover: 'rgba(181,56,183,1)', cluster: 'rgba(181,56,183,0.9)', label: 'Trailer' },
    leak: { normal: 'rgba(0,180,255,0.85)', hover: 'rgba(0,180,255,1)', cluster: 'rgba(0,180,255,0.9)', label: 'Leak' },
    screenshot: { normal: 'rgba(255,200,0,0.85)', hover: 'rgba(255,200,0,1)', cluster: 'rgba(255,210,0,0.85)', label: 'Screenshot' }
  };

  let allFeatures = [];
  const vectorSource = new ol.source.Vector({ features: [] });
  const clusterSource = new ol.source.Cluster({ distance: 30, minDistance: 12, source: vectorSource });
  const clusterStyleCache = {};

  function createClusterStyle(size, kind) {
    const color = (TYPE_COLORS[kind] || TYPE_COLORS.landscape).cluster;
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: size < 10 ? 14 : size < 50 ? 18 : 22,
        fill: new ol.style.Fill({ color }),
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 })
      }),
      text: new ol.style.Text({
        text: String(size),
        fill: new ol.style.Fill({ color: '#ffffff' }),
        stroke: new ol.style.Stroke({ color: 'rgba(0,0,0,0.35)', width: 2 })
      })
    });
  }

  const markerLayer = new ol.layer.Vector({
    source: clusterSource,
    style: function (feature) {
      const features = feature.get('features');
      const size = features.length;
      if (size === 1) return features[0].getStyle() || features[0].get('customStyle');

      let kind = 'landscape';
      if (features.every(f => f.get('type') === 'trailer')) kind = 'trailer';
      else if (features.every(f => f.get('type') === 'leak')) kind = 'leak';
      else if (features.every(f => f.get('type') === 'screenshot')) kind = 'screenshot';

      const key = `${kind}_${size}`;
      if (!clusterStyleCache[key]) clusterStyleCache[key] = createClusterStyle(size, kind);
      return clusterStyleCache[key];
    }
  });

  map.addLayer(markerLayer);

  function normalizeMarkerType(marker) {
    let markerType = typeof marker.type === 'string' && marker.type.trim() ? marker.type.trim().toLowerCase() : 'landscape';

    if (Array.isArray(marker.categories)) {
      const categories = marker.categories.map(cat => {
        if (typeof cat === 'string') return cat.trim().toLowerCase();
        if (cat?.slug) return cat.slug.trim().toLowerCase();
        if (cat?.name) return cat.name.trim().toLowerCase();
        return '';
      });
      if (categories.includes('trailer')) markerType = 'trailer';
      else if (categories.includes('leak')) markerType = 'leak';
      else if (categories.includes('screenshot')) markerType = 'screenshot';
    }

    return TYPE_COLORS[markerType] ? markerType : 'landscape';
  }

  function createFeatureFromDb(marker) {
    if (!marker || marker.map_x == null || marker.map_y == null) return null;

    const markerType = normalizeMarkerType(marker);
    const tc = TYPE_COLORS[markerType];

    const normalStyle = new ol.style.Style({
      image: new ol.style.Circle({
        radius: markerRadius,
        fill: new ol.style.Fill({ color: tc.normal }),
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 })
      })
    });

    const hoverStyle = new ol.style.Style({
      image: new ol.style.Circle({
        radius: markerHoverRadius,
        fill: new ol.style.Fill({ color: tc.hover }),
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 })
      })
    });

    const feature = new ol.Feature({
      geometry: new ol.geom.Point([parseFloat(marker.map_x), parseFloat(marker.map_y)]),
      id: marker.id || null,
      name: marker.title || '',
      description: marker.description || '',
      type: markerType,
      map_x: marker.map_x,
      map_y: marker.map_y,
      region: marker.region || '',
      image: marker.image || null,
      source: marker.source || '',
      source_key: marker.source_key || ''
    });

    feature.set('customStyle', normalStyle);
    feature.set('hoverStyle', hoverStyle);
    feature.setStyle(normalStyle);
    return feature;
  }

  fetch('data/markers.json')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      const markers = Array.isArray(data.markers) ? data.markers : [];
      allFeatures = markers.map(createFeatureFromDb).filter(Boolean);
      vectorSource.clear(true);
      vectorSource.addFeatures(allFeatures);
      markerLayer.changed();

      const countEl = document.getElementById('total-marker-count');
      if (countEl) countEl.textContent = allFeatures.length;
      updateFilterCounts();
      bindCheckboxListeners();
      updateMasterCount();
    })
    .catch(err => console.error('Failed to load markers:', err));

  function updateVisibleMarkers() {
    const activeTypes = Array.from(document.querySelectorAll('#map-menu input[type="checkbox"][data-type]:checked')).map(cb => cb.dataset.type);
    const visible = allFeatures.filter(f => activeTypes.includes(f.get('type')));
    vectorSource.clear(true);
    if (visible.length > 0) vectorSource.addFeatures(visible);
    markerLayer.changed();
  }

  function updateFilterCounts() {
    const counts = {};
    allFeatures.forEach(f => {
      const type = f.get('type');
      counts[type] = (counts[type] || 0) + 1;
    });

    document.querySelectorAll('.filter-count[data-type]').forEach(el => {
      el.textContent = counts[el.dataset.type] || 0;
    });
  }

  function syncMasterToggle() {
    const master = document.getElementById('toggle-all-markers');
    if (!master) return;
    const all = document.querySelectorAll('#map-menu input[type="checkbox"][data-type]');
    const checked = document.querySelectorAll('#map-menu input[type="checkbox"][data-type]:checked');
    master.checked = all.length === checked.length;
  }

  function updateMasterCount() {
    const el = document.getElementById('all-marker-count');
    if (!el) return;
    const activeTypes = Array.from(document.querySelectorAll('#map-menu input[type="checkbox"][data-type]:checked')).map(cb => cb.dataset.type);
    el.textContent = allFeatures.filter(f => activeTypes.includes(f.get('type'))).length;
  }

  function bindCheckboxListeners() {
    document.querySelectorAll('#map-menu input[type="checkbox"][data-type]').forEach(cb => {
      cb.addEventListener('change', () => {
        updateVisibleMarkers();
        syncMasterToggle();
        updateMasterCount();
      });
    });
    syncMasterToggle();
  }

  document.getElementById('toggle-all-markers')?.addEventListener('change', function () {
    document.querySelectorAll('#map-menu input[type="checkbox"][data-type]').forEach(cb => {
      cb.checked = this.checked;
      cb.dispatchEvent(new Event('change'));
    });
  });

  // Search
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', function () {
      const query = this.value.toLowerCase().trim();
      searchResults.innerHTML = '';
      if (!query) { searchResults.style.display = 'none'; return; }

      const normalizedQuery = query.replace(/x\s*:/g, '').replace(/y\s*:/g, '').replace(/\|/g, ' ').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
      const queryParts = normalizedQuery.split(' ').filter(Boolean);

      const matches = allFeatures.filter(f => {
        const name = (f.get('name') || '').toLowerCase();
        const desc = (f.get('description') || '').toLowerCase();
        const cx = String(Math.round(Number(f.get('map_x'))));
        const cy = String(Math.round(Number(f.get('map_y'))));
        return name.includes(query) || desc.includes(query) || (queryParts.length >= 2 && cx.includes(queryParts[0]) && cy.includes(queryParts[1]));
      });

      if (matches.length === 0) {
        searchResults.innerHTML = '<li style="justify-content:center;color:rgba(255,255,255,0.4);">No results</li>';
        searchResults.style.display = 'block';
        return;
      }

      matches.slice(0, 30).forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature.get('name') || 'Unnamed';
        li.addEventListener('click', () => {
          if (!vectorSource.getFeatures().includes(feature)) vectorSource.addFeature(feature);
          buildPopupContent(feature);
          const coords = feature.getGeometry().getCoordinates();
          popup.setPosition(coords);
          gta6View.animate({ center: coords, zoom: 5, duration: 500 });
          searchInput.value = '';
          searchResults.style.display = 'none';
          if (isMobile) document.getElementById('map-menu')?.classList.remove('active');
        });
        searchResults.appendChild(li);
      });

      searchResults.style.display = 'block';
    });
  }

  // Popup
  const popup = new ol.Overlay({
    element: document.getElementById('popup'),
    positioning: 'bottom-center',
    stopEvent: true,
    offset: [0, -20]
  });
  map.addOverlay(popup);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[ch]);
  }

  function buildPopupContent(feature) {
    const name = feature.get('name') || 'Marker';
    const description = feature.get('description') || '';
    const image = feature.get('image');
    const mapX = feature.get('map_x');
    const mapY = feature.get('map_y');
    const region = feature.get('region') || '';
    const type = feature.get('type') || '';
    const typeLabel = TYPE_COLORS[type]?.label || '';
    const coordX = mapX != null ? Math.round(Number(mapX)) : '-';
    const coordY = mapY != null ? Math.round(Number(mapY)) : '-';

    let content = `
      <div class="popup-card">
        <div class="popup-header">
          <div class="popup-title-wrap">
            <h3 class="popup-title"><span class="popup-title-text">${escapeHtml(name)}</span></h3>
            ${region ? `<div class="popup-region">${escapeHtml(region)}</div>` : ''}
            <div class="popup-coords">X: ${coordX} | Y: ${coordY}</div>
          </div>
          <span class="share-button" title="Copy coordinates"></span>
        </div>`;

    if (image) content += `<div class="popup-image-wrap"><img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.style.display='none'"></div>`;
    if (typeLabel) content += `<div class="popup-tags"><span class="popup-tag popup-tag-type popup-tag-type-${type}">${typeLabel}</span></div>`;
    if (description) content += `<div class="popup-description"><p>${escapeHtml(description)}</p></div>`;
    content += '</div>';

    const popupContent = document.getElementById('popup-content');
    if (popupContent) {
      popupContent.innerHTML = content;
      popupContent.querySelector('.share-button')?.addEventListener('click', () => {
        navigator.clipboard?.writeText(`X: ${coordX} | Y: ${coordY}`);
      });
    }

    popup.setPosition(feature.getGeometry().getCoordinates());
    const popupEl = document.getElementById('popup');
    if (popupEl) popupEl.style.display = 'block';
  }

  const lightbox = document.getElementById('lightbox-overlay');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxClose = document.getElementById('lightbox-close');

  if (lightbox && lightboxClose) {
    document.getElementById('popup-content')?.addEventListener('click', function (e) {
      if (e.target.tagName === 'IMG' && !isMobile) {
        lightboxImage.src = e.target.src;
        lightbox.style.display = 'flex';
      }
    });
    lightboxClose.addEventListener('click', () => { lightbox.style.display = 'none'; });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.style.display = 'none'; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox.style.display = 'none'; });
  }

  // Interactions
  map.on('click', function (evt) {
    const clickedFeature = map.forEachFeatureAtPixel(
      evt.pixel,
      (feature, layer) => layer === markerLayer ? feature : null,
      { hitTolerance, layerFilter: layer => layer === markerLayer }
    );

    if (!clickedFeature) {
      popup.setPosition(undefined);
      const popupEl = document.getElementById('popup');
      if (popupEl) popupEl.style.display = 'none';
      return;
    }

    const clusteredFeatures = clickedFeature.get('features');
    if (clusteredFeatures && clusteredFeatures.length > 1) {
      const extent = ol.extent.createEmpty();
      clusteredFeatures.forEach(f => ol.extent.extend(extent, f.getGeometry().getExtent()));
      map.getView().fit(extent, { padding: [80, 80, 80, 80], duration: 300, maxZoom: 8 });
      return;
    }

    const feature = clusteredFeatures ? clusteredFeatures[0] : clickedFeature;
    if (feature) buildPopupContent(feature);
  });

  let hoveredFeature = null;
  const tooltipEl = document.getElementById('marker-tooltip');
  const tooltipOverlay = new ol.Overlay({ element: tooltipEl, offset: [0, -10], positioning: 'bottom-center', stopEvent: false });
  map.addOverlay(tooltipOverlay);

  if (!isTouchDevice) {
    map.on('pointermove', function (evt) {
      if (evt.dragging) {
        tooltipOverlay.setPosition(undefined);
        if (tooltipEl) tooltipEl.style.display = 'none';
        if (hoveredFeature) hoveredFeature.setStyle(hoveredFeature.get('customStyle'));
        hoveredFeature = null;
        return;
      }

      const clusterFeature = map.forEachFeatureAtPixel(evt.pixel, f => f?.get('features') ? f : null, { hitTolerance });
      const clusterMembers = clusterFeature?.get('features') || [];
      const feature = clusterMembers.length === 1 ? clusterMembers[0] : null;

      if (hoveredFeature && hoveredFeature !== feature) hoveredFeature.setStyle(hoveredFeature.get('customStyle'));

      if (feature) {
        if (hoveredFeature !== feature) feature.setStyle(feature.get('hoverStyle') || feature.get('customStyle'));
        hoveredFeature = feature;
        if (tooltipEl) {
          tooltipEl.innerHTML = escapeHtml(feature.get('name') || 'Unnamed');
          tooltipEl.style.display = 'block';
        }
        tooltipOverlay.setPosition(evt.coordinate);
        map.getTargetElement().style.cursor = 'pointer';
      } else {
        tooltipOverlay.setPosition(undefined);
        if (tooltipEl) tooltipEl.style.display = 'none';
        hoveredFeature = null;
        map.getTargetElement().style.cursor = '';
      }
    });
  }

  // UI controls
  let gta6Enabled = true;
  let gta5Enabled = false;
  let currentStyle = 'colour';

  const gta6Toggle = document.getElementById('gta6-toggle-sidebar');
  const gta5Toggle = document.getElementById('gta5-toggle-sidebar');
  const opacitySlider = document.getElementById('gta5-opacity-slider');
  const opacityValue = document.getElementById('gta5-opacity-value');
  const styleColourBtn = document.getElementById('gta6-style-colour-sidebar') || document.getElementById('style-colour');
  const styleBlackBtn = document.getElementById('gta6-style-black-sidebar') || document.getElementById('style-dark');
  const styleBlock = document.getElementById('gta6-style-block');

  function setMapStyle(style) {
    if (currentStyle === style) return;
    currentStyle = style;
    const mapEl = document.getElementById('map');
    mapEl?.classList.add('is-fading');
    setTimeout(() => {
      tileLayer.setSource(style === 'black' ? blackSource : colourSource);
      styleColourBtn?.classList.toggle('active', style === 'colour');
      styleBlackBtn?.classList.toggle('active', style === 'black');
      setTimeout(() => mapEl?.classList.remove('is-fading'), 120);
    }, 120);
  }

  function updateLayerControls() {
    tileLayer.setVisible(gta6Enabled);
    gta5Layer.setVisible(gta5Enabled);
    if (opacitySlider && opacityValue) {
      const opacity = Number(opacitySlider.value) / 100;
      gta5Layer.setOpacity(opacity);
      opacityValue.textContent = `${opacitySlider.value}%`;
      opacitySlider.disabled = !gta5Enabled;
    }
    if (gta6Toggle) gta6Toggle.checked = gta6Enabled;
    if (gta5Toggle) gta5Toggle.checked = gta5Enabled;
    styleBlock?.classList.toggle('is-disabled', !gta6Enabled);
  }

  gta6Toggle?.addEventListener('change', () => {
    gta6Enabled = gta6Toggle.checked;
    updateLayerControls();
  });

  gta5Toggle?.addEventListener('change', () => {
    gta5Enabled = gta5Toggle.checked;
    updateLayerControls();
  });

  opacitySlider?.addEventListener('input', updateLayerControls);

  styleColourBtn?.addEventListener('click', () => {
    gta6Enabled = true;
    setMapStyle('colour');
    updateLayerControls();
  });

  styleBlackBtn?.addEventListener('click', () => {
    gta6Enabled = true;
    setMapStyle('black');
    updateLayerControls();
  });

  document.getElementById('zoom-in-btn')?.addEventListener('click', () => gta6View.animate({ zoom: gta6View.getZoom() + 1, duration: 200 }));
  document.getElementById('zoom-out-btn')?.addEventListener('click', () => gta6View.animate({ zoom: gta6View.getZoom() - 1, duration: 200 }));

  document.getElementById('share-btn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      const btn = document.getElementById('share-btn');
      if (!btn) return;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-link"></i>'; }, 1500);
    });
  });

  const sidebar = document.getElementById('map-menu');
  const toggleDesktop = document.getElementById('sidebar-toggle-desktop');
  const filterToggle = document.getElementById('filter-toggle');

  toggleDesktop?.addEventListener('click', function () {
    sidebar?.classList.toggle('collapsed');
    const icon = this.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-angle-left');
      icon.classList.toggle('fa-angle-right');
    }
    setTimeout(() => map.updateSize(), 350);
  });

  filterToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('active');
    setTimeout(() => map.updateSize(), 350);
  });

  window.addEventListener('resize', () => map.updateSize());
  updateLayerControls();
});
