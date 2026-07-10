const canvas = document.querySelector("#xrCanvas");
const statusEl = document.querySelector("#xrStatus");
const scaleInput = document.querySelector("#xrScale");
const scaleValue = document.querySelector("#xrScaleValue");
const placeCenterButton = document.querySelector("#placeCenter");
const hotspotDot = document.querySelector("#xrHotspot");
const hotspotCard = document.querySelector("#xrHotspotCard");
const closeHotspot = document.querySelector("#closeXrHotspot");

const hotspotWorld = new THREE.Vector3(0, 0.42, -0.34);

let xrScene = null;
let car = null;
let modelRoot = null;
let baseScale = 1;
let placed = false;
let started = false;

function setStatus(text) {
  statusEl.textContent = text;
}

window.addEventListener("error", (event) => {
  setStatus(`Error: ${event.message}`);
});

window.addEventListener("unhandledrejection", (event) => {
  const message = event.reason?.message || String(event.reason);
  setStatus(`Error: ${message}`);
});

function applyScale() {
  const scale = Number(scaleInput.value);
  scaleValue.textContent = `${scale.toFixed(2)}x`;
  if (modelRoot) modelRoot.scale.setScalar(scale);
}

function frameModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const longestSide = Math.max(size.x, size.y, size.z) || 1;
  baseScale = 2.15 / longestSide;
  object.position.sub(center);
  object.position.y += size.y * 0.5;
  object.scale.setScalar(baseScale);
  object.rotation.y = Math.PI;
}

async function loadCar(scene) {
  const loader = new THREE.GLTFLoader();
  const gltf = await loader.loadAsync("./toyota_gr_supra.glb");
  car = gltf.scene;
  car.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.envMapIntensity = 0.9;
    }
  });
  frameModel(car);

  modelRoot = new THREE.Group();
  modelRoot.visible = false;
  modelRoot.add(car);
  scene.add(modelRoot);
  applyScale();
  setStatus("Scan the floor, then tap to place");
}

function placeAtCameraForward(distance = 2.2) {
  if (!xrScene || !modelRoot) return;

  const { camera } = xrScene;
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const position = camera.position.clone().add(direction.multiplyScalar(distance));
  position.y -= 0.65;

  modelRoot.position.copy(position);
  modelRoot.visible = true;
  placed = true;
  setStatus("Placed. Tap another spot to move it.");
}

function tryHitTestPlace(event) {
  if (!window.XR8?.XrController || !modelRoot) return placeAtCameraForward();

  try {
    const hits = window.XR8.XrController.hitTest(
      event.clientX,
      event.clientY,
      ["FEATURE_POINT", "ESTIMATED_SURFACE", "DETECTED_SURFACE"]
    );

    if (hits && hits.length) {
      const hit = hits[0];
      modelRoot.position.set(hit.position.x, hit.position.y, hit.position.z);
      modelRoot.visible = true;
      placed = true;
      setStatus("Placed. Tap another spot to move it.");
      return;
    }
  } catch (error) {
    console.warn(error);
  }

  placeAtCameraForward();
}

function updateHotspot() {
  if (!xrScene || !car || !placed) {
    hotspotDot.classList.remove("is-visible");
    return;
  }

  const point = hotspotWorld.clone();
  car.localToWorld(point);
  point.project(xrScene.camera);

  const visible = point.z > -1 && point.z < 1;
  hotspotDot.classList.toggle("is-visible", visible);
  hotspotDot.style.left = `${(point.x * 0.5 + 0.5) * window.innerWidth}px`;
  hotspotDot.style.top = `${(-point.y * 0.5 + 0.5) * window.innerHeight}px`;
}

function initScenePipelineModule() {
  return {
    name: "supra-scene",
    onStart: async () => {
      xrScene = window.XR8.Threejs.xrScene();
      const { scene, camera, renderer } = xrScene;

      if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = true;

      scene.add(new THREE.HemisphereLight(0xffffff, 0x95a3b8, 2.4));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3);
      keyLight.position.set(3, 5, 4);
      scene.add(keyLight);

      camera.near = 0.01;
      camera.far = 80;
      camera.updateProjectionMatrix();

      await loadCar(scene);
    },
    onUpdate: updateHotspot,
  };
}

function onxrloaded() {
  if (started) return;
  started = true;

  const { XR8 } = window;
  if (!window.THREE || !THREE.GLTFLoader) {
    setStatus("Three.js loader did not load");
    return;
  }

  setStatus("Starting camera");
  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.Threejs.pipelineModule(),
    XR8.XrController.pipelineModule(),
    initScenePipelineModule(),
  ]);

  XR8.XrController.configure({ disableWorldTracking: false });
  try {
    XR8.run({ canvas, allowedDevices: XR8.XrConfig.device().ANY });
  } catch (error) {
    started = false;
    setStatus(`8th Wall failed: ${error.message}`);
  }
}

canvas.addEventListener("pointerdown", tryHitTestPlace);
placeCenterButton.addEventListener("click", placeAtCameraForward);
scaleInput.addEventListener("input", applyScale);
hotspotDot.addEventListener("click", () => hotspotCard.classList.add("is-visible"));
closeHotspot.addEventListener("click", () => hotspotCard.classList.remove("is-visible"));

if (!window.isSecureContext) {
  setStatus("Open over HTTPS to use camera AR");
} else if (!window.THREE || !THREE.GLTFLoader) {
  setStatus("Three.js loader did not load");
} else if (window.XR8) {
  onxrloaded();
} else {
  window.addEventListener("xrloaded", onxrloaded);
  window.setTimeout(() => {
    if (!window.XR8) setStatus("8th Wall engine did not load");
    else if (!started) onxrloaded();
  }, 12000);
}
