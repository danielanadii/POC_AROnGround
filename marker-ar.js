const marker = document.querySelector("#hiroMarker");
const modelRoot = document.querySelector("#markerModelRoot");
const scaleInput = document.querySelector("#markerScale");
const scaleValue = document.querySelector("#markerScaleValue");
const statusEl = document.querySelector("#markerStatus");
const hotspot = document.querySelector("#specHotspot");
const hotspotCard = document.querySelector("#hotspotCard");
const closeHotspot = document.querySelector("#closeHotspot");

function setMarkerScale() {
  const scale = Number(scaleInput.value);
  modelRoot.setAttribute("scale", `${scale} ${scale} ${scale}`);
  scaleValue.textContent = `${scale.toFixed(2)}x`;
  hotspot.setAttribute("radius", 0.06 / Math.max(scale, 0.5));
}

marker.addEventListener("markerFound", () => {
  statusEl.textContent = "Marker locked. Tap the green hotspot.";
});

marker.addEventListener("markerLost", () => {
  statusEl.textContent = "Point camera at the Hiro marker";
});

hotspot.addEventListener("click", () => {
  hotspotCard.classList.add("is-visible");
});

closeHotspot.addEventListener("click", () => {
  hotspotCard.classList.remove("is-visible");
});

scaleInput.addEventListener("input", setMarkerScale);
setMarkerScale();
