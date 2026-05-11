// ui-controls.js

// UI-Leiste oben rechts
// Initial Map State
// GTA 6 ist standardmäßig aktiv, GTA Online optional
let gta6Enabled = true;
let gta6Style = "colour";
let gta5Enabled = false;

const gta6ToggleBtn = document.getElementById("gta6-toggle");
const gta5ToggleBtn = document.getElementById("gta5-toggle");

const gta5OpacitySlider = document.getElementById("gta5-opacity-slider");
const gta5OpacityValue = document.getElementById("gta5-opacity-value");

const gta6StyleColourBtn = document.getElementById("gta6-style-colour");
const gta6StyleBlackBtn = document.getElementById("gta6-style-black");

const gta6SidebarToggle = document.getElementById("gta6-toggle-sidebar");
const gta5SidebarToggle = document.getElementById("gta5-toggle-sidebar");

const gta6StyleColourSidebarBtn = document.getElementById("gta6-style-colour-sidebar");
const gta6StyleBlackSidebarBtn = document.getElementById("gta6-style-black-sidebar");

const mapViewStyleSection = document.getElementById("gta6-style-block");

function animateLayerOpacity(layer, targetOpacity, duration = 200) {

  const startOpacity = layer.getOpacity();
  const startTime = performance.now();

  function animate(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const value = startOpacity + (targetOpacity - startOpacity) * progress;

    layer.setOpacity(value);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function updateMapControls() {
  if (window.tileLayer) {
    window.tileLayer.setVisible(gta6Enabled);
  }

  if (window.gta5Layer) {

  if (gta5Enabled) {
    window.gta5Layer.setVisible(true);

    const opacity = gta5OpacitySlider
      ? gta5OpacitySlider.value / 100
      : 1;

    animateLayerOpacity(window.gta5Layer, opacity);

  } else {

    animateLayerOpacity(window.gta5Layer, 0);

    setTimeout(() => {
      if (!gta5Enabled) {
        window.gta5Layer.setVisible(false);
      }
    }, 200);

  }

}

if (gta5OpacitySlider && gta5OpacityValue) {
  gta5OpacityValue.textContent = gta5OpacitySlider.value + "%";
}

  if (typeof window.setMapStyle === "function") {
    window.setMapStyle(gta6Style);
  }

  // Rechte Leiste
  gta6ToggleBtn?.classList.toggle("is-on", gta6Enabled);
  gta6ToggleBtn?.classList.toggle("is-off", !gta6Enabled);
  gta6ToggleBtn?.setAttribute("aria-pressed", String(gta6Enabled));

  gta5ToggleBtn?.classList.toggle("is-on", gta5Enabled);
  gta5ToggleBtn?.classList.toggle("is-off", !gta5Enabled);
  gta5ToggleBtn?.setAttribute("aria-pressed", String(gta5Enabled));

  gta5OpacitySlider?.toggleAttribute("disabled", !gta5Enabled);

  const gta6Label = gta6ToggleBtn?.querySelector(".toggle-text");
  const gta5Label = gta5ToggleBtn?.querySelector(".toggle-text");

  if (gta6Label) gta6Label.textContent = gta6Enabled ? "ON" : "OFF";
  if (gta5Label) gta5Label.textContent = gta5Enabled ? "ON" : "OFF";

  gta6StyleColourBtn?.classList.toggle("active", gta6Style === "colour");
  gta6StyleBlackBtn?.classList.toggle("active", gta6Style === "black");

  // Sidebar
  if (gta6SidebarToggle) {
    gta6SidebarToggle.checked = gta6Enabled;
  }

  if (gta5SidebarToggle) {
    gta5SidebarToggle.checked = gta5Enabled;
  }

  gta6StyleColourSidebarBtn?.classList.toggle("active", gta6Style === "colour");
  gta6StyleBlackSidebarBtn?.classList.toggle("active", gta6Style === "black");

  mapViewStyleSection?.classList.toggle("is-disabled", !gta6Enabled);
}

// GTA6 Toggle (rechte UI, falls vorhanden)
gta6ToggleBtn?.addEventListener("click", () => {
  gta6Enabled = !gta6Enabled;
  updateMapControls();
});

// GTA5 Toggle (rechte UI, falls vorhanden)
gta5ToggleBtn?.addEventListener("click", () => {
  gta5Enabled = !gta5Enabled;
  updateMapControls();
});

// GTA6 Style: Colour (rechte UI, falls vorhanden)
gta6StyleColourBtn?.addEventListener("click", () => {
  gta6Style = "colour";
  if (!gta6Enabled) gta6Enabled = true;
  updateMapControls();
});

// GTA6 Style: Black (rechte UI, falls vorhanden)
gta6StyleBlackBtn?.addEventListener("click", () => {
  gta6Style = "black";
  if (!gta6Enabled) gta6Enabled = true;
  updateMapControls();
});

// GTA6 Sidebar Toggle
gta6SidebarToggle?.addEventListener("change", () => {
  gta6Enabled = gta6SidebarToggle.checked;
  updateMapControls();
});

// GTA5 Sidebar Toggle
gta5SidebarToggle?.addEventListener("change", () => {
  gta5Enabled = gta5SidebarToggle.checked;
  updateMapControls();
});

// GTA5 Opacity Slider
gta5OpacitySlider?.addEventListener("input", () => {

  const value = gta5OpacitySlider.value;
  const opacity = value / 100;

  if (window.gta5Layer) {
    window.gta5Layer.setOpacity(opacity);
  }

  gta5OpacityValue.textContent = value + "%";

});

// GTA6 Style Sidebar: Colour
gta6StyleColourSidebarBtn?.addEventListener("click", () => {
  gta6Style = "colour";
  if (!gta6Enabled) gta6Enabled = true;
  updateMapControls();
});

// GTA6 Style Sidebar: Black
gta6StyleBlackSidebarBtn?.addEventListener("click", () => {
  gta6Style = "black";
  if (!gta6Enabled) gta6Enabled = true;
  updateMapControls();
});

updateMapControls();

// Wartet, bis DOM komplett geladen ist
document.addEventListener("DOMContentLoaded", function () {
  console.log("🧪 ui-controls.js gestartet");

  console.log("🔎 DOM Content Loaded. Anzahl Checkboxen (vorerst):", document.querySelectorAll('#map-menu input[type="checkbox"]').length);

// Share Button
  document.getElementById("share-btn").addEventListener("click", () => {

  const url = window.location.href;

  navigator.clipboard.writeText(url);

});

  // Credits Modal
  const creditsBtn = document.getElementById("credits-btn");
const creditsModal = document.getElementById("credits-modal");
const creditsModalClose = document.getElementById("credits-modal-close");
const creditsModalBackdrop = document.querySelector(".credits-modal-backdrop");

function openCreditsModal() {
  if (!creditsModal) return;
  creditsModal.classList.add("is-open");
  creditsModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("credits-modal-open");
}

function closeCreditsModal() {
  if (!creditsModal) return;
  creditsModal.classList.remove("is-open");
  creditsModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("credits-modal-open");
}

if (creditsBtn) {
  creditsBtn.addEventListener("click", openCreditsModal);
}

if (creditsModalClose) {
  creditsModalClose.addEventListener("click", closeCreditsModal);
}

if (creditsModalBackdrop) {
  creditsModalBackdrop.addEventListener("click", closeCreditsModal);
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && creditsModal && creditsModal.classList.contains("is-open")) {
    closeCreditsModal();
  }
}); 

  // Button-Referenzen
  const filterBtn = document.querySelector('#filter-toggle');
  const menuBtn = document.querySelector('#menu-toggle');
  const mapMenu = document.getElementById('map-menu');
  const toggleBtnDesktop = document.getElementById('sidebar-toggle-desktop');
  const showAllBtn = document.getElementById('show-all-btn');
  const hideAllBtn = document.getElementById('hide-all-btn');
  const searchInput = document.getElementById('category-search');

  // Übersetzte Texte setzen
if (showAllBtn) showAllBtn.textContent = t("showAll");
if (hideAllBtn) hideAllBtn.textContent = t("hideAll");
if (searchInput) searchInput.placeholder = t("searchPlaceholder");
if (filterBtn) filterBtn.title = t("filter");

const globalSearchInput = document.getElementById("search-input");
if (globalSearchInput) {
  globalSearchInput.placeholder = t("searchPlaceholder");
}

document.addEventListener("languageChanged", () => {
  
  // Texte neu setzen
  if (showAllBtn) showAllBtn.textContent = t("showAll");
  if (hideAllBtn) hideAllBtn.textContent = t("hideAll");
  if (searchInput) searchInput.placeholder = t("searchPlaceholder");
  if (filterBtn) filterBtn.title = t("filter");

   // 🔁 NEU: globales Suchfeld-Placeholder aktualisieren
  const globalSearchInput = document.getElementById("search-input");
  if (globalSearchInput) {
    globalSearchInput.placeholder = t("searchPlaceholder");
  }
});

  mapMenu.classList.remove("active");
  let ignoreNextChange = false;

  // Sidebar Toggle (Mobile)
  function toggleSidebar() {
    const isActive = mapMenu.classList.contains("active");
    ignoreNextChange = true;
    mapMenu.classList.toggle("active");
    document.body.classList.toggle("sidebar-open", mapMenu.classList.contains("active"));
    console.log(`🚀 Sidebar ${isActive ? "geschlossen" : "geöffnet"}`);
  }

  if (menuBtn) menuBtn.addEventListener("click", toggleSidebar);
  if (filterBtn) filterBtn.addEventListener("click", toggleSidebar);

  // Sidebar Toggle (Desktop)
  if (toggleBtnDesktop && mapMenu) {
    toggleBtnDesktop.addEventListener("click", function () {
      mapMenu.classList.toggle("collapsed");
  
      // 🔁 Icon-Pfeil umschalten
      const icon = this.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-angle-left');
        icon.classList.toggle('fa-angle-right');
      }
  
      console.log("📦 Sidebar Toggle Button geklickt → Klasse:", mapMenu.className);
    });
  }

  // MutationObserver für Mobile Verhalten
  const observer = new MutationObserver(mutationsList => {
    for (const mutation of mutationsList) {
      if (
        mutation.attributeName === "class" &&
        !mapMenu.classList.contains("active") &&
        window.innerWidth <= 768
      ) {
        if (ignoreNextChange) {
          ignoreNextChange = false;
          return;
        }
        mapMenu.classList.add("active");
      }
    }
  });
  observer.observe(mapMenu, { attributes: true });

  // Icon-Zuweisung pro Typ
  const iconMap = {
    staedte: 'fa-city',
    naturgebiete: 'fa-tree',
    'trailer-spot': 'fa-film',
    'screenshot-spot': 'fa-image',
    gefaengnis: 'fa-lock',
    militaerbasen: 'fa-person-military-rifle',
    flughaefen: 'fa-plane',
    'erkannte-wahrzeichen': 'fa-landmark-flag',
    stadtteile: 'fa-location-dot',
    freizeit: 'fa-sun',
  };

  window.createCheckboxItem = function(type, name, defaultChecked = true) {
    const li = document.createElement("li");
    const label = document.createElement("label");
    label.className = "icon-checkbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.type = type;
    input.checked = defaultChecked;

    const icon = document.createElement("i");
    icon.className = `fas ${iconMap[type] || 'fa-question'}`;

    const text = document.createElement("span");
    text.className = "label-text";
    text.textContent = name;

    label.appendChild(input);
    label.appendChild(icon);
    label.appendChild(text);
    li.appendChild(label);

     // 🛠️ Klick auf Label manuell behandeln, um Scroll-Sprung zu vermeiden, aber Toggle zu behalten
     label.addEventListener('click', (e) => {
      e.preventDefault();
      input.checked = !input.checked;
      input.dispatchEvent(new Event("change"));
    });

    return li;
  }

  window.createCheckboxItem = createCheckboxItem;

  // Kategorien laden (aus Daten)
  function loadCategories(categories) {
    const wrapper = document.querySelector('.category-wrapper');
    wrapper.innerHTML = '';

    categories.forEach(parent => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'category';

      const heading = document.createElement('h3');
      heading.textContent = parent.name;
      categoryDiv.appendChild(heading);

      const ul = document.createElement('ul');

      if (parent.children && parent.children.length > 0) {
        parent.children.forEach(child => {
          ul.appendChild(createCheckboxItem(child.slug, child.name));
        });
      } else {
        ul.appendChild(createCheckboxItem(parent.slug, parent.name));
      }

      categoryDiv.appendChild(ul);
      wrapper.appendChild(categoryDiv);
    });

    bindCheckboxListeners();
    if (typeof updateVisibleMarkers === "function") {
      updateVisibleMarkers();
    }
  }

 // Event-Listener für Checkboxen neu setzen

function syncMasterMarkerToggle() {

  const masterToggle = document.getElementById("toggle-all-markers");
  if (!masterToggle) return;

  const allCheckboxes = document.querySelectorAll('#map-menu input[type="checkbox"][data-type]');
  const checkedCheckboxes = document.querySelectorAll('#map-menu input[type="checkbox"][data-type]:checked');

  masterToggle.checked = allCheckboxes.length === checkedCheckboxes.length;

}
 
 window.bindCheckboxListeners = function () {
  console.log("📦 bindCheckboxListeners wird ausgeführt");

  const checkboxes = document.querySelectorAll('#map-menu input[type="checkbox"][data-type]');

  checkboxes.forEach(cb => {
    const newCb = cb.cloneNode(true);
    cb.parentNode.replaceChild(newCb, cb);

    console.log("🔗 Checkbox verbunden:", newCb.dataset.type);

    newCb.addEventListener("change", () => {
  console.log("🎯 Checkbox geändert:", newCb.dataset.type, "=", newCb.checked);

  if (typeof window.updateVisibleMarkers === "function") {
    window.updateVisibleMarkers();
  }

    syncMasterMarkerToggle();
    updateMasterMarkerCount();
  });
});

    syncMasterMarkerToggle();
    updateMasterMarkerCount();
};

window.updateMasterMarkerCount = function () {
  const countElement = document.getElementById("all-marker-count");
  if (!countElement) return;

  if (!window.allFeatures || !Array.isArray(window.allFeatures)) {
    countElement.textContent = "";
    return;
  }

  const activeTypes = Array.from(
    document.querySelectorAll('#map-menu input[type="checkbox"][data-type]:checked')
  ).map(cb => cb.dataset.type);

  const visibleCount = window.allFeatures.filter(feature => {
    const type = feature.get("type");
    return activeTypes.includes(type);
  }).length;

  countElement.textContent = visibleCount;
};


  // "Alle Anzeigen" und "Alle Ausblenden"
  const toggleAllMarkers = document.getElementById("toggle-all-markers");

toggleAllMarkers?.addEventListener("change", () => {
  const isChecked = toggleAllMarkers.checked;

  document.querySelectorAll('#map-menu input[type="checkbox"][data-type]').forEach(cb => {
    cb.checked = isChecked;
    cb.dispatchEvent(new Event("change"));
  });
});

  // Global verfügbar machen
  window.loadCategories = loadCategories;
  const event = new Event('bindCheckboxListenersReady');
  document.dispatchEvent(event);

});

console.log("✅ bindCheckboxListeners ist jetzt verfügbar");
document.dispatchEvent(new Event('bindCheckboxListenersReady'));

// 📎 Kopiert den Deeplink zum aktuell ausgewählten Marker in die Zwischenablage
window.copyCurrentMarkerLink = function () {
  if (!window.currentFeature) return;

  // Marker-ID ermitteln und URL mit Parameter 'marker' aktualisieren
  const id = window.currentFeature.get('id');
  const url = new URL(window.location.href);
  url.searchParams.set('marker', id);

  // Sprache bestimmen
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'de';

  // Lokalisierte Rückmeldungen vorbereiten
  const successMsg = lang === 'en'
    ? '🔗 Link to this marker has been copied to clipboard.'
    : '🔗 Link zum Marker wurde in die Zwischenablage kopiert.';

  const errorMsg = lang === 'en'
    ? '❌ Could not copy the link.'
    : '❌ Link konnte nicht kopiert werden.';

  // Versuch, den Link in die Zwischenablage zu kopieren
  navigator.clipboard.writeText(url.toString())
    .then(() => {
      alert(successMsg);
    })
    .catch(err => {
      console.error("❌ Fehler beim Kopieren:", err);
      alert(errorMsg);
    });
};


// 🗺️ Kopiert die Kartenkoordinaten bei Rechtsklick in die Zwischenablage
window.handleRightClickCopyCoords = function (e) {
  e.preventDefault(); // Kontextmenü verhindern

  // Pixel → Kartenkoordinaten berechnen
  const pixel = map.getEventPixel(e);
  const coord = map.getCoordinateFromPixel(pixel);
  const coordRounded = coord.map(c => Math.round(c)).join(', ');

  // In Zwischenablage kopieren
  navigator.clipboard.writeText(coordRounded)
    .then(() => {
      const lang = typeof getCurrentLang === "function" ? getCurrentLang() : 'de';
      const message = lang === 'de'
        ? `Koordinaten kopiert: ${coordRounded}`
        : `Coordinates copied: ${coordRounded}`;
      
      console.log(message);
      alert(message);
    })
    .catch(err => {
      console.error('Fehler beim Kopieren:', err);
      alert(lang === 'de' ? 'Fehler beim Kopieren der Koordinaten' : 'Error copying coordinates');
    });
};


// Zoomm-Buttons
const zoomInBtn = document.getElementById("zoom-in-btn");
const zoomOutBtn = document.getElementById("zoom-out-btn");

if (zoomInBtn) {
  zoomInBtn.addEventListener("click", () => {
    const view = map.getView();
    view.animate({
      zoom: view.getZoom() + 1,
      duration: 200
    });
  });
}

if (zoomOutBtn) {
  zoomOutBtn.addEventListener("click", () => {
    const view = map.getView();
    view.animate({
      zoom: view.getZoom() - 1,
      duration: 200
    });
  });
}
