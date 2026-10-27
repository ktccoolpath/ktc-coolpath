// =============================================================
// KTC CoolPath – configuration
// Change values here, not inside app.js
// =============================================================
window.COOLPATH_CONFIG = {

  // The three floor plan images (cropped from the official KTC floor map).
  // All images are 688 x 445 pixels. If you replace an image with a bigger
  // one, update width/height AND re-pick the coordinates in data/campus.geojson.
  floors: {
    0: { name: "Ground floor", image: "maps/ground-floor.jpg", width: 688, height: 445 },
    1: { name: "1st floor",    image: "maps/first-floor.jpg",  width: 688, height: 445 },
    2: { name: "2nd floor",    image: "maps/second-floor.jpg", width: 688, height: 445 }
  },

  // Campus data (points of interest, later: walking paths)
  dataUrl: "data/campus.geojson",

  // Real GPS location of the campus – used for the "Outside" tab (OpenStreetMap)
  // and for the weather / heat alert (Open-Meteo).
  // KTC campus, Abu Halifa, Kuwait (29.1343 N, 48.1170 E – from the KTC Wikipedia page).
  campusLocation: { lat: 29.1343, lng: 48.1170, zoom: 16 },

  // Colours for each point type
  colors: {
    gate:     "#f08a24",
    water:    "#1e88e5",
    facility: "#2e9e6a",
    room:     "#1f2a6b",
    elevator: "#8a6d3b",
    stairs:   "#8a6d3b",
    restroom: "#c9a227",
    shade:    "#00897b"
  }
};
