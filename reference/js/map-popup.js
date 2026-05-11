// ======================================================
// POPUP SYSTEM
// Popup Overlay, Lightbox und Popup-Rendering
// ======================================================

document.addEventListener("DOMContentLoaded", function () {
  const map = window.map;

  // ======================================================
  // POPUP & LIGHTBOX SYSTEM
  // ======================================================

  window.popup = new ol.Overlay({
    element: document.getElementById('popup'),
    positioning: 'bottom-center',
    stopEvent: true,
    offset: [0, -20]
  });

  map.addOverlay(window.popup);

  const lightbox = document.getElementById('lightbox-overlay');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxClose = document.getElementById('lightbox-close');
  const popupContent = document.getElementById('popup-content');

  function openLightbox(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();
      lightboxImage.src = e.target.src;
      lightbox.style.display = 'flex';

      setTimeout(() => map.updateSize(), 300);
    }
  }

  function closeLightbox() {
    lightbox.style.display = 'none';
    lightboxImage.src = '';
    setTimeout(() => map.updateSize(), 300);
  }

  // Nur für Desktop aktivieren
  if (window.innerWidth > 768) {
    if (popupContent) {
      popupContent.addEventListener('click', openLightbox);
    }

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightbox) {
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }
});

// ======================================================
// POPUP RENDERING
// ======================================================

function buildPopupContent(feature) {
  const lang = typeof getCurrentLang === "function" ? getCurrentLang() : 'de';

  const name = feature.get(`name_${lang}`) || feature.get('name') || 'Marker';
  const description = feature.get(`description_${lang}`) || feature.get('description') || '';
  const image = feature.get('image');
  const link = feature.get('link');

  const mapX = feature.get('map_x');
  const mapY = feature.get('map_y');
  const region = feature.get('region') || '';
  const mediaId = feature.get('media_id') || '';
  const notes = feature.get('notes') || '';
  const type = feature.get('type') || '';
  const source = feature.get('source') || '';

  let sourceLabel = source;

if (source === 'gtadb') sourceLabel = 'map.gtadb.org';
if (source === 'own') sourceLabel = 'GTAup';
if (source === 'community') sourceLabel = 'Community';
if (source === 'trailer') sourceLabel = 'Trailer Analysis';
if (source === 'leak') sourceLabel = 'Community Leak Mapping';

  const coordX = mapX != null ? Math.round(Number(mapX)) : '–';
  const coordY = mapY != null ? Math.round(Number(mapY)) : '–';

  let typeLabel = '';
  if (type === 'landscape') typeLabel = 'Landscape';
  if (type === 'trailer') typeLabel = 'Trailer';
  if (type === 'leak') typeLabel = 'Leak';
  if (type === 'screenshot') typeLabel = 'Screenshot';

  let content = `
  <div class="popup-card">
    <div class="popup-header">
      <div class="popup-title-wrap">
        <div class="popup-header">

  <div class="popup-title-wrap">
    <h3 class="popup-title">
      <span class="popup-title-text">${name}</span>
    </h3>
  </div>

  <span class="share-button" title="Koordinaten kopieren"></span>

</div>
        ${image ? `
        <div class="popup-image-wrap">
            <img src="${image}" alt="${name}" loading="lazy"
            onerror="this.style.display='none'">
        </div>
` : ''}
        ${region ? `<div class="popup-region">${region}</div>` : ''}
        <div class="popup-coords">X: ${coordX} | Y: ${coordY}</div>
        ${source ? `
          <div class="popup-source popup-source-${source}">
            <span>${sourceLabel}</span>
          </div>
        ` : ''}
      </div>
    </div>
`;

if (typeLabel || mediaId) {
  content += `<div class="popup-tags">`;

  if (typeLabel) {
    content += `<span class="popup-tag popup-tag-type popup-tag-type-${type}">${typeLabel}</span>`;
  }

  if (mediaId) {
    content += `<span class="popup-tag">${mediaId}</span>`;
  }

  content += `</div>`;
}

if (description) {
  content += `<div class="popup-description">${convertPlainTextToParagraphs(description)}</div>`;
}

if (notes) {
  content += `<div class="popup-notes">${notes}</div>`;
}

  const linkTitle = link?.[`title_${lang}`] || link?.title || '';
  if (link?.url && linkTitle) {
    content += `
      <div class="popup-actions">
        <a class="popup-action-btn" href="${link.url}" target="_blank" rel="noopener noreferrer">
          ➜ ${linkTitle}
        </a>
      </div>
    `;
  }

  content += `</div>`;

  const popupContent = document.getElementById('popup-content');
  if (popupContent) {
    popupContent.innerHTML = content;

    const shareButton = popupContent.querySelector('.share-button');
if (shareButton) {
  shareButton.addEventListener('click', () => copyMarkerCoords(feature));
}
  }

  if (window.popup) {
    window.popup.setPosition(feature.getGeometry().getCoordinates());
  }
}

// ======================================================
// POPUP HELPERS / UTILITIES
// ======================================================

document.addEventListener('languageChanged', () => {
  if (window.currentFeature) {
    if (typeof buildPopupContent === 'function') {
      buildPopupContent(window.currentFeature);
    }
  }
});

function convertPlainTextToParagraphs(text) {
  if (!text) return '';
  return text
    .split(/\n{2,}/)
    .map(para => `<p>${para.trim().replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function copyCurrentMarkerLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => {
      alert("Link kopiert!");
    })
    .catch(err => {
      console.error("❌ Kopieren fehlgeschlagen:", err);
    });
}

function copyMarkerCoords(feature) {
  const mapX = feature.get('map_x');
  const mapY = feature.get('map_y');

  const coordX = mapX != null ? Math.round(Number(mapX)) : null;
  const coordY = mapY != null ? Math.round(Number(mapY)) : null;

  if (coordX == null || coordY == null) {
    console.error("❌ Keine Koordinaten zum Kopieren vorhanden.");
    return;
  }

  const coordText = `X: ${coordX} | Y: ${coordY}`;

  navigator.clipboard.writeText(coordText)
    .then(() => {
      alert("Koordinaten kopiert!");
    })
    .catch(err => {
      console.error("❌ Koordinaten konnten nicht kopiert werden:", err);
    });
}