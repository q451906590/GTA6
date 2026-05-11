// 🔍 Globale Marker-Suche (sprachsensitiv, mit eigenem Zoom)

window.setupGlobalMarkerSearch = function () {
  console.log("📦 map-search.js geladen");
  console.log("🔍 Suche aktiviert mit", window.allFeatures?.length, "Features");

  const input = document.getElementById("search-input");
  const resultsContainer = document.getElementById("search-results");

  if (!input || !resultsContainer || !window.allFeatures) return;

  // 🔠 Hilfsfunktion zum Dekodieren von HTML-Entities wie &#8211;
  function decodeHtmlEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }

  input.addEventListener("input", function () {
    const query = this.value.toLowerCase().trim();
    resultsContainer.innerHTML = "";

    if (query.length === 0) {
      resultsContainer.style.display = "none";
      return;
    }

    const lang = typeof getCurrentLang === "function" ? getCurrentLang() : 'de';

    const normalizedQuery = query
  .replace(/x\s*:/g, '')
  .replace(/y\s*:/g, '')
  .replace(/\|/g, ' ')
  .replace(/,/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const queryParts = normalizedQuery.split(' ').filter(Boolean);

const matches = window.allFeatures.filter(f => {
  const name = (f.get(lang === 'de' ? "name" : "name_en") || "").toLowerCase();
  const desc = (f.get(lang === 'de' ? "description" : "description_en") || "").toLowerCase();

  const mapX = f.get('map_x');
  const mapY = f.get('map_y');

  const coordX = mapX != null ? String(Math.round(Number(mapX))) : '';
  const coordY = mapY != null ? String(Math.round(Number(mapY))) : '';

  const coordVariants = [
    `${coordX} ${coordY}`,
    `${coordX}, ${coordY}`,
    `x: ${coordX} y: ${coordY}`,
    `x: ${coordX} | y: ${coordY}`
  ];

  const textMatch =
    name.includes(query) ||
    desc.includes(query);

  const coordMatch =
    coordVariants.some(v => v.includes(query)) ||
    (queryParts.length >= 2 &&
      coordX.includes(queryParts[0]) &&
      coordY.includes(queryParts[1]));

  return textMatch || coordMatch;
});

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<li class="no-result">Keine Treffer</li>`;
      resultsContainer.style.display = "block";
      return;
    }

    matches.slice(0, 30).forEach(feature => {
      const rawName = feature.get(lang === 'de' ? "name" : "name_en") || feature.get("name") || "Unbenannt";
      const name = decodeHtmlEntities(rawName);

      const li = document.createElement("li");
      li.textContent = name;
      li.classList.add("search-result-item");

      li.addEventListener("click", () => {
  // Falls Marker nicht sichtbar ist, temporär einblenden
  if (!window.vectorSource.getFeatures().includes(feature)) {
    window.vectorSource.addFeature(feature);
    window.markerLayer.changed();
  }

  window.currentFeature = feature;

  if (typeof buildPopupContent === "function") {
    buildPopupContent(feature);
  }

  const coords = feature.getGeometry().getCoordinates();

  if (window.popup) {
    window.popup.setPosition(coords);
  }

  window.map.getView().animate({
    center: coords,
    zoom: 5,
    duration: 500
  });

  input.value = "";
  resultsContainer.style.display = "none";

  const sidebar = document.getElementById("map-menu");
  if (window.innerWidth <= 768 && sidebar) {
    sidebar.classList.remove("active");
  }
});

      resultsContainer.appendChild(li);
    });

    resultsContainer.style.display = "block";
  });
};
