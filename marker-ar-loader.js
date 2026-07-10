const secureCard = document.querySelector("#secureCard");
const statusEl = document.querySelector("#markerStatus");
const sceneEl = document.querySelector("a-scene");

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

function showSecureContextMessage() {
  secureCard.classList.add("is-visible");
  statusEl.textContent = "Open the HTTPS GitHub Pages URL";
  if (sceneEl) {
    sceneEl.style.display = "none";
  }
}

async function bootMarkerAR() {
  const canUseCamera = window.isSecureContext && navigator.mediaDevices?.getUserMedia;
  if (!canUseCamera) {
    showSecureContextMessage();
    return;
  }

  await loadScript("https://aframe.io/releases/1.2.0/aframe.min.js");
  await loadScript("https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js");
  await loadScript("./marker-ar.js");
}

bootMarkerAR().catch((error) => {
  console.error(error);
  statusEl.textContent = "Could not start Website AR";
});
