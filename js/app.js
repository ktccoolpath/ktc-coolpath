// =============================================================
// KTC CoolPath – main map script
// Shows the three KTC floor plans with Leaflet.js and the campus
// points of interest from data/campus.geojson.
//
// How coordinates work:
//   Floor plans are pictures, not real-world maps, so we use
//   Leaflet's "CRS.Simple" (flat pixel coordinates).
//   In campus.geojson every point is [x, y] in pixels on the image,
//   x measured from the LEFT edge, y measured from the TOP edge.
//   Leaflet counts y from the BOTTOM, so we convert with toLatLng().
// =============================================================

(function () {
  "use strict";

  const CFG = window.COOLPATH_CONFIG;
  const params = new URLSearchParams(window.location.search);
  const DEV_MODE = params.get("dev") === "1";

  let currentFloor = 0;
  let allFeatures = [];
  const markersByFloor = { 0: [], 1: [], 2: [] };
  let imageLayer = null;
  let outdoorMap = null;

  // ---------- 1. Create the floor-plan map ----------
  const map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 3,
    zoomSnap: 0.25,
    attributionControl: false
  });

  // Convert [x, y] pixels (y from top) to Leaflet [lat, lng]
  function toLatLng(x, y, floor) {
    const h = CFG.floors[floor].height;
    return L.latLng(h - y, x);
  }

  // Convert Leaflet [lat, lng] back to [x, y] pixels (y from top)
  function toPixels(latlng, floor) {
    const h = CFG.floors[floor].height;
    return { x: Math.round(latlng.lng), y: Math.round(h - latlng.lat) };
  }

  function floorBounds(floor) {
    const f = CFG.floors[floor];
    return [[0, 0], [f.height, f.width]];
  }

  // ---------- 2. Show one floor ----------
  function showFloor(floor) {
    currentFloor = floor;
    const f = CFG.floors[floor];

    if (imageLayer) map.removeLayer(imageLayer);
    imageLayer = L.imageOverlay(f.image, floorBounds(floor)).addTo(map);
    map.setMaxBounds(L.latLngBounds(floorBounds(floor)).pad(0.25));
    map.fitBounds(floorBounds(floor));

    // Hide markers of other floors, show this floor's markers
    [0, 1, 2].forEach(fl => markersByFloor[fl].forEach(m => map.removeLayer(m)));
    refreshMarkers();
  }

  // ---------- 3. Draw markers ----------
  function filterKey(type) {
    return type === "stairs" ? "elevator" : type;   // stairs share the Lifts/Stairs filter
  }

  function isTypeVisible(type) {
    const box = document.querySelector(`#filters input[data-type="${filterKey(type)}"]`);
    return box ? box.checked : true;
  }

  function refreshMarkers() {
    markersByFloor[currentFloor].forEach(m => {
      if (isTypeVisible(m.feature.properties.type)) m.addTo(map);
      else map.removeLayer(m);
    });
    // keep water points on top so they are easy to see
    markersByFloor[currentFloor].forEach(m => {
      if (m.feature.properties.type === "water" && map.hasLayer(m)) m.bringToFront();
    });
  }

  function popupHtml(p) {
    const status = p.verified
      ? `<span class="badge verified">✔ confirmed</span>`
      : `<span class="badge unverified">assumed from map</span>`;
    const checked = p.checked_by ? `<br><small>Checked by ${escapeHtml(p.checked_by)} ${escapeHtml(p.checked_date || "")}</small>` : "";
    const notes = p.notes ? `<br><small>${escapeHtml(p.notes)}</small>` : "";
    return `<strong>${escapeHtml(p.name)}</strong><br>
            <small>${escapeHtml(CFG.floors[p.floor].name)} · ${escapeHtml(p.type)}</small><br>
            ${status}${checked}${notes}`;
  }

  function makeMarker(feature) {
    const p = feature.properties;
    const [x, y] = feature.geometry.coordinates;
    const color = CFG.colors[p.type] || "#555";
    const big = p.type === "gate" || p.type === "water";

    const marker = L.circleMarker(toLatLng(x, y, p.floor), {
      radius: p.type === "water" ? 11 : (big ? 9 : 6),
      color: "#ffffff",
      weight: 2,
      fillColor: color,
      fillOpacity: p.verified || p.type === "water" ? 0.95 : 0.55,
      dashArray: p.verified ? null : "3,3"
    }).bindPopup(popupHtml(p));

    if (p.type === "water") {
      marker.bindTooltip("💧", { permanent: true, direction: "center", className: "icon-tip" });
    }
    marker.feature = feature;
    return marker;
  }

  // ---------- 4. Load campus data ----------
  function loadData() {
    // data/campus.js sets window.CAMPUS_DATA, so the map also works when
    // index.html is opened by double-clicking (file://). Otherwise fetch the GeoJSON.
    const source = window.CAMPUS_DATA
      ? Promise.resolve(window.CAMPUS_DATA)
      : fetch(CFG.dataUrl).then(r => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        });

    return source
      .then(geojson => {
        allFeatures = geojson.features.filter(f => f.geometry && f.geometry.type === "Point");
        allFeatures.forEach(f => {
          const fl = f.properties.floor;
          if (markersByFloor[fl]) markersByFloor[fl].push(makeMarker(f));
        });
      })
      .catch(err => {
        console.error(err);
        showMessage("Could not load the campus data (data/campus.js). Check that the data folder was uploaded.");
      });
  }

  function showMessage(text) {
    const div = document.createElement("div");
    div.className = "alert";
    div.textContent = text;
    document.querySelector("main").prepend(div);
  }

  // ---------- 5. Outdoor (OpenStreetMap) view ----------
  function showOutdoor() {
    document.getElementById("map").hidden = true;
    const el = document.getElementById("outdoor-map");
    el.hidden = false;
    if (!outdoorMap) {
      const c = CFG.campusLocation;
      outdoorMap = L.map("outdoor-map").setView([c.lat, c.lng], c.zoom);
      // OpenStreetMap data, map tiles served by CARTO (free, works from any page)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
      }).addTo(outdoorMap);
      L.marker([c.lat, c.lng]).addTo(outdoorMap).bindPopup("KTC campus (pilot)").openPopup();
    }
    setTimeout(() => outdoorMap.invalidateSize(), 50);
  }

  function showIndoor(floor) {
    document.getElementById("outdoor-map").hidden = true;
    document.getElementById("map").hidden = false;
    setTimeout(() => { map.invalidateSize(); showFloor(floor); }, 0);
  }

  // ---------- 6. Floor tabs ----------
  document.querySelectorAll("#floor-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#floor-tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.floor;
      if (f === "outdoor") showOutdoor();
      else showIndoor(Number(f));
    });
  });

  function activateTab(floor) {
    document.querySelectorAll("#floor-tabs button").forEach(b => {
      b.classList.toggle("active", b.dataset.floor === String(floor));
    });
  }

  // ---------- 7. Filters ----------
  document.querySelectorAll("#filters input").forEach(box => box.addEventListener("change", refreshMarkers));

  // ---------- 8. Search ----------
  const searchInput = document.getElementById("search");
  const resultsList = document.getElementById("search-results");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    resultsList.innerHTML = "";
    if (q.length < 1) { resultsList.hidden = true; return; }

    const hits = allFeatures
      .filter(f => f.properties.name.toLowerCase().includes(q) || f.properties.id.toLowerCase() === q)
      .slice(0, 8);

    hits.forEach(f => {
      const li = document.createElement("li");
      li.textContent = `${f.properties.name} — ${CFG.floors[f.properties.floor].name}`;
      li.addEventListener("click", () => goTo(f));
      resultsList.appendChild(li);
    });
    if (!hits.length) {
      const li = document.createElement("li");
      li.textContent = "No match";
      li.className = "muted";
      resultsList.appendChild(li);
    }
    resultsList.hidden = false;
  });

  function goTo(feature) {
    const p = feature.properties;
    resultsList.hidden = true;
    searchInput.value = p.name;
    activateTab(p.floor);
    showIndoor(p.floor);

    // make sure its filter is on
    const box = document.querySelector(`#filters input[data-type="${filterKey(p.type)}"]`);
    if (box && !box.checked) { box.checked = true; }

    setTimeout(() => {
      refreshMarkers();
      const [x, y] = feature.geometry.coordinates;
      map.setView(toLatLng(x, y, p.floor), 0.75);
      const m = markersByFloor[p.floor].find(mk => mk.feature === feature);
      if (m) m.openPopup();
    }, 60);
  }

  // ---------- 9. Developer coordinate picker (?dev=1) ----------
  if (DEV_MODE) {
    const panel = document.getElementById("dev-panel");
    const out = document.getElementById("dev-output");
    panel.hidden = false;

    map.on("click", e => {
      const { x, y } = toPixels(e.latlng, currentFloor);
      // Same column order as templates/campus-data-sheet.csv
      out.textContent = `NEW-ID,Name here,water,${currentFloor},${x},${y},false,,,,,,,`;
      L.popup().setLatLng(e.latlng).setContent(`x: ${x}, y: ${y}`).openOn(map);
    });

    document.getElementById("dev-copy").addEventListener("click", () => {
      navigator.clipboard.writeText(out.textContent).then(
        () => { document.getElementById("dev-copy").textContent = "Copied ✔"; },
        () => { alert("Copy failed – select the text and copy it manually."); }
      );
    });
  }

  // ---------- helpers ----------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- start ----------
  showFloor(0);
  loadData().then(() => showFloor(currentFloor));
})();
