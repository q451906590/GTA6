// Sprache aus Body-Class bestimmen
function getCurrentLang() {
  return document.body.classList.contains("lang-en") ? "en" : "de";
}

// Lokalisierter Titel für Taxonomie-Einträge
function getLocalizedTitle(term) {
  const lang = getCurrentLang();
  return (
    term[`title_${lang}`] ||
    term.title_de ||
    term.title_en ||
    term.name || // Fallback
    ""
  );
}

// UI-Übersetzungen für Buttons, Placeholder etc.
const UI_TRANSLATIONS = {
  showAll: {
    de: "Alle Anzeigen",
    en: "Show All"
  },
  hideAll: {
    de: "Alle Ausblenden",
    en: "Hide All"
  },
  searchPlaceholder: {
    de: "Ort, Typ oder Koordinaten suchen...",
    en: "Search location, type or coordinates..."
  },
searchHint: {
  de: "Tipp: Du kannst auch Koordinaten wie 1234,567 eingeben",
  en: "Tip: You can also search coordinates like 1234,567"
},
  filter: {
    de: "Filter öffnen",
    en: "Open Filter"
  },

  markerFilters: {
    de: "Marker-Filter",
    en: "Marker Filters"
  },
  showAllMarkers: {
    de: "Alle Marker",
    en: "Show all Markers"
  },
  landscape: {
    de: "Landschaft",
    en: "Landscape"
  },
  trailer: {
    de: "Trailer",
    en: "Trailer"
  },
  leaks: {
    de: "Leaks",
    en: "Leaks"
  },
  screenshots: {
    de: "Screenshots",
    en: "Screenshots"
  },
  mapLayer: {
    de: "Kartenebene",
    en: "Map Layer"
  },
  style: {
    de: "Stil",
    en: "Style"
  },
  colour: {
    de: "Farbe",
    en: "Colour"
  },
  black: {
    de: "Schwarz",
    en: "Black"
  },
  overlayStrength: {
    de: "Overlay-Stärke",
    en: "Overlay Strength"
  },

  creditsModalTitle: {
    de: "GTA 6 Interaktive Karte",
    en: "GTA 6 Interactive Map"
  },
  creditsCommunityLink: {
    de: "Mapping-Community auf Discord",
    en: "Mapping Community on Discord"
  },
  creditsEyebrow: {
    de: "Community-Projekt",
    en: "Community Driven Project"
  },
  creditsIntro: {
    de: "Diese interaktive Karte entsteht durch unabhängige Recherche, Trailer-Analysen, Community-Entdeckungen und die Arbeit engagierter Mapper und Mitwirkender. Vielen Dank an alle, die dabei helfen, Vice City und Leonida Stück für Stück zu erkunden.",
    en: "This interactive map is built through independent research, trailer analysis, community discoveries, and the work of dedicated mappers and contributors. Huge thanks to everyone helping explore Vice City and Leonida piece by piece."
  },
 creditsLandmarksTitle: {
  de: "Landmarken-Datenbank",
  en: "Landmarks Database"
},
creditsLandmarksTextBefore: {
  de: "Landmarken-Marker-Daten stammen aus der Community-Datenbank",
  en: "Landmark marker data sourced from the community-driven"
},
creditsLandmarksTextAfter: {
  de: "von rlx.",
  en: "database by rlx."
},
  creditsGtaupTitle: {
    de: "GTAup.de",
    en: "GTAup.de"
  },
  creditsGtaupText: {
    de: "Interaktive Kartenkonzeption, UI, technische Umsetzung und laufende Weiterentwicklung der Plattform.",
    en: "Interactive map design, UI, technical implementation, and ongoing platform development."
  },
  creditsCommunityTitle: {
    de: "Mapping-Community",
    en: "Mapping Community"
  },
  creditsCommunityText: {
    de: "Gemeinsame Entdeckungen, Ortsanalysen, Zusammenarbeit und community-getriebener Kartenfortschritt.",
    en: "Shared discoveries, location analysis, collaboration, and community-driven map progress."
  },
  creditsTrailerTitle: {
    de: "Trailer-Analyse",
    en: "Trailer Analysis"
  },
  creditsTrailerText: {
    de: "Visuelle Auswertungen, Umwelt-Referenzen und szenenbasierte Standortrecherche.",
    en: "Visual breakdowns, environmental references, and scene-based location research."
  },
  creditsResearchTitle: {
    de: "Community-Recherche",
    en: "Community Research"
  },
  creditsResearchText: {
    de: "Zusätzliche Funde, Hinweise, Abgleiche und Unterstützung aus der Szene.",
    en: "Additional findings, hints, cross-checks, and support from contributors across the scene."
  },
  contributors: {
    de: "Mitwirkende",
    en: "Contributors"
  },
  buildUiPhase: {
    de: "Build: UI-Phase 1",
    en: "Build: UI Phase 1"
  },
  buildFollowX: {
    de: "Folge für Karten-Updates auf X",
    en: "Follow map updates on X"
  },
   buildshareButton: {
    de: "Kopiere den Karten-Link",
    en: "Copy map link"
  }
};

function updateUIText() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (text) el.textContent = text;
  });

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.placeholder = t("searchPlaceholder");
  }

  const filterToggleBtn = document.getElementById("filter-toggle");
  if (filterToggleBtn) {
    filterToggleBtn.setAttribute("aria-label", t("filter"));
    filterToggleBtn.setAttribute("title", t("filter"));
  }
}

// Funktion zum Übersetzen einzelner Keys
function t(key) {
  const lang = getCurrentLang();
  return UI_TRANSLATIONS[key]?.[lang] || "";
}

// Sprache umschalten
function switchLang(lang) {
  document.body.classList.remove("lang-en", "lang-de");
  document.body.classList.add(`lang-${lang}`);
  localStorage.setItem("preferredLang", lang);

  // Events auslösen
  setTimeout(() => {
    document.dispatchEvent(new Event("languageChanged"));
    document.dispatchEvent(new Event("bindCheckboxListenersReady"));
    updateActiveLangButton();
    updateContentLinks(); // <-- Sprachabhängige Links aktualisieren
    updateUIText();
    refreshPopupContent();
  }, 10);
}

// Aktiven Sprach-Button visuell hervorheben
function updateActiveLangButton() {
  const currentLang = getCurrentLang();
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
  });
}

// Sprachabhängige Beschriftung der Content-Links (Sidebar: Waffen & Fahrzeuge)
function updateContentLinks() {
  const lang = getCurrentLang();

  const weaponsLabel = lang === "en" ? "GTA 6 Weapons" : "GTA 6 Waffen";
  const vehiclesLabel = lang === "en" ? "GTA 6 Vehicles" : "GTA 6 Fahrzeuge";

  const weaponsLink = document.getElementById("link-weapons");
  const vehiclesLink = document.getElementById("link-vehicles");

  if (weaponsLink) weaponsLink.innerHTML = `🔫 ${weaponsLabel}`;
  if (vehiclesLink) vehiclesLink.innerHTML = `🚗 ${vehiclesLabel}`;
}

// DOM fertig geladen
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("preferredLang");
  if (savedLang && !document.body.classList.contains(`lang-${savedLang}`)) {
    const waitForMap = setInterval(() => {
      if (window.map && window.allFeatures && window.allFeatures.length) {
        clearInterval(waitForMap);
        switchLang(savedLang);
      }
    }, 100);
  }

  const buttons = document.querySelectorAll(".lang-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      switchLang(lang);
    });
  });

  updateActiveLangButton();
  updateContentLinks();
  updateUIText();
});

// Popup-Inhalt aktualisieren (z. B. bei Sprachwechsel)
function refreshPopupContent() {
  const feature = window.currentFeature;
  if (!feature) return;

  const lang = getCurrentLang();
  const name = feature.get(`name_${lang}`) || feature.get('name') || 'Marker';
  const description = feature.get(`description_${lang}`) || feature.get('description') || '';
  const image = feature.get('image');
  const link = feature.get('link');
  const linkTitle = link?.[`title_${lang}`] || link?.title || '';

  let content = `<h3>${name}</h3>`;
  if (image) {
    content += `<img src="${image}" alt="" style="max-width:100%; margin-bottom:10px;">`;
  }
  if (description) {
    content += `<p>${description}</p>`;
  }
  if (link?.url && linkTitle) {
    content += `<p><a href="${link.url}" target="_blank" rel="noopener noreferrer">➡️ ${linkTitle}</a></p>`;
  }

  const popupContent = document.getElementById('popup-content');
  if (popupContent) {
    popupContent.innerHTML = content;
  }
}
