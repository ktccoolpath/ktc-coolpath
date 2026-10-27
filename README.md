# KTC CoolPath – Smart Heat-Safe Campus Walking Guide

**Group 104 · Kuwait Technical College · IST Final Project 2026–2027**
Supervisors: Ms. Annet Noel, Ms. Tina Daniel

CoolPath is a mobile-friendly website that helps students move around the KTC campus on hot days. It shows the campus floor plans, gates, water points and (from Week 3) a **shortest route vs. a cooler, shaded/indoor route**, plus a live **heat alert** from weather data. Students open it by scanning a QR code – no app install.

> CoolPath is a planning guide, not a safety guarantee.

## Team
| Member | ID | Main role |
|---|---|---|
| Alhailam H A Almotalqem | 240100504 | Project manager · planning · survey · QR plan |
| Mohammed S M Kh Almutalqem | 240100529 | Front-end developer · wireframes · routing |
| Fares Kh Almutalqem | 240100485 | Campus data · walk-throughs · map data |
| Mohammad A M Kh Almutalqem | 240100565 | Weather / heat alert · testing · walking times |

## Live site
`https://<your-github-username>.github.io/ktc-coolpath/` (GitHub Pages)

## Tech stack
HTML5 · CSS3 · JavaScript (no framework) · **Leaflet.js 1.9.4** (floor plans with `CRS.Simple`, outdoor view with **OpenStreetMap** data, CARTO tiles) · **Open-Meteo** weather API (no key) · GeoJSON for campus data · GitHub Pages hosting.

## Project structure
```
index.html                 Campus map (floors, search, filters, ?dev=1 coordinate picker)
heat-test.html             Heat alert prototype + logic tests
css/style.css              Styles (mobile first)
js/config.js               Settings: floor images, campus location, colours
js/app.js                  Map logic
js/heat.js                 Heat alert logic (Open-Meteo)
maps/                      Ground / 1st / 2nd floor plans (official KTC floor map)
data/campus.geojson        Campus points: gates, places, rooms, lifts, stairs, water points
data/campus.js             Same data as a script, so the map also opens by double-click
tools/survey-analyzer.html Survey CSV -> charts
docs/wireframes.html       Wireframes of the main screens
```
Project documents (plan, requirements, survey, data sheets) are kept in the team Google Drive.

## Run it locally
Double-click `index.html`, or open the folder in VS Code → right-click `index.html` → **Open with Live Server**.

Add `?dev=1` to the address to turn on the coordinate picker.

## References
- OpenStreetMap contributors. (n.d.). *OpenStreetMap*. https://www.openstreetmap.org/
- Open-Meteo. (n.d.). *Weather forecast API documentation*. https://open-meteo.com/en/docs
- Leaflet. (n.d.). *Leaflet – an open-source JavaScript library for interactive maps*. https://leafletjs.com/
- National Weather Service. (n.d.). *Heat index*. https://www.weather.gov/safety/heat-index
