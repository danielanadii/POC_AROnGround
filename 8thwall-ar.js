const canvas = document.querySelector("#xrCanvas");
const statusEl = document.querySelector("#xrStatus");
const scaleInput = document.querySelector("#xrScale");
const scaleValue = document.querySelector("#xrScaleValue");
const cameraModeButton = document.querySelector("#cameraMode");
const placeCenterButton = document.querySelector("#placeCenter");
const placementReticle = document.querySelector("#placementReticle");
const hotspotDot = document.querySelector("#xrHotspot");
const hotspotCard = document.querySelector("#xrHotspotCard");
const closeHotspot = document.querySelector("#closeXrHotspot");

const hotspotWorld = new THREE.Vector3(0, 0.42, -0.34);

let xrScene = null;
let car = null;
let modelRoot = null;
let reticleMesh = null;
let reticleHitPosition = null;
let baseScale = 1;
let placed = false;
let started = false;
let lastCanvasWidth = 0;
let lastCanvasHeight = 0;
let cameraMode = localStorage.getItem("supra-camera-mode") === "fill" ? "fill" : "fit";
let framesWithoutHit = 0;
let targetLocked = false;

function setStatus(text) {
  statusEl.textContent = text;
}

function getViewportSize() {
  const visualViewport = window.visualViewport;
  return {
    width: Math.round(visualViewport?.width || window.innerWidth),
    height: Math.round(visualViewport?.height || window.innerHeight),
  };
}

function getCanvasDisplaySize() {
  const viewport = getViewportSize();
  if (cameraMode === "fill") {
    return {
      width: viewport.width,
      height: viewport.height,
      left: 0,
      top: 0,
    };
  }

  const cameraAspect = 16 / 9;
  let width = viewport.width;
  let height = Math.round(width / cameraAspect);

  if (height > viewport.height) {
    height = viewport.height;
    width = Math.round(height * cameraAspect);
  }

  return {
    width,
    height,
    left: Math.round((viewport.width - width) / 2),
    top: Math.round((viewport.height - height) / 2),
  };
}

function fitCanvasToScreen() {
  const { width, height, left, top } = getCanvasDisplaySize();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const bufferWidth = Math.round(width * pixelRatio);
  const bufferHeight = Math.round(height * pixelRatio);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.left = `${left}px`;
  canvas.style.top = `${top}px`;

  if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
    canvas.width = bufferWidth;
    canvas.height = bufferHeight;
  }

  if (xrScene && (lastCanvasWidth !== bufferWidth || lastCanvasHeight !== bufferHeight)) {
    const { renderer, camera } = xrScene;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    lastCanvasWidth = bufferWidth;
    lastCanvasHeight = bufferHeight;
  }
}

function updateCameraModeButton() {
  cameraModeButton.textContent = cameraMode === "fit" ? "Fit" : "Fill";
  cameraModeButton.setAttribute(
    "aria-label",
    cameraMode === "fit" ? "Switch camera to full screen fill" : "Switch camera to uncropped fit"
  );
}

function toggleCameraMode() {
  cameraMode = cameraMode === "fit" ? "fill" : "fit";
  localStorage.setItem("supra-camera-mode", cameraMode);
  lastCanvasWidth = 0;
  lastCanvasHeight = 0;
  updateCameraModeButton();
  fitCanvasToScreen();
  setStatus(cameraMode === "fit" ? "Fit camera: less zoom, sharper." : "Fill camera: full screen crop.");
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

function placeModelAt(position) {
  if (!modelRoot) return;

  modelRoot.position.copy(position);
  modelRoot.visible = true;
  placed = true;
  setStatus("Placed. Move phone to find another target.");
}

function getReticleCenter() {
  const rect = placementReticle.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.5,
    y: rect.top + rect.height * 0.5,
  };
}

function createTrackedReticle(scene) {
  const ring = new THREE.RingGeometry(0.34, 0.42, 64);
  const material = new THREE.MeshBasicMaterial({
    color: 0x16b891,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    depthTest: false,
  });

  reticleMesh = new THREE.Mesh(ring, material);
  reticleMesh.rotation.x = -Math.PI / 2;
  reticleMesh.renderOrder = 10;
  reticleMesh.visible = false;
  scene.add(reticleMesh);
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
  setStatus("Move phone slowly until the target locks on.");
}

function placeAtReticle() {
  if (!modelRoot) return;

  if (reticleHitPosition) {
    placeModelAt(reticleHitPosition);
    return;
  }

  setStatus("No floor target yet. Move phone slowly at the floor.");
}

function getHitPosition(hit) {
  if (!hit) return null;

  if (hit.position) {
    if (Array.isArray(hit.position)) return new THREE.Vector3(hit.position[0], hit.position[1], hit.position[2]);
    return new THREE.Vector3(hit.position.x, hit.position.y, hit.position.z);
  }

  if (typeof hit.x === "number" && typeof hit.y === "number" && typeof hit.z === "number") {
    return new THREE.Vector3(hit.x, hit.y, hit.z);
  }

  if (hit.worldPosition) {
    if (Array.isArray(hit.worldPosition)) {
      return new THREE.Vector3(hit.worldPosition[0], hit.worldPosition[1], hit.worldPosition[2]);
    }
    return new THREE.Vector3(hit.worldPosition.x, hit.worldPosition.y, hit.worldPosition.z);
  }

  if (hit.transform?.position) {
    const { position } = hit.transform;
    return new THREE.Vector3(position.x, position.y, position.z);
  }

  if (Array.isArray(hit.transform) && hit.transform.length >= 16) {
    const matrix = new THREE.Matrix4().fromArray(hit.transform);
    const position = new THREE.Vector3();
    position.setFromMatrixPosition(matrix);
    return position;
  }

  return null;
}

function hitTestAt(clientX, clientY) {
  if (!window.XR8?.XrController) return null;

  const rect = canvas.getBoundingClientRect();
  const relativeX = clientX - rect.left;
  const relativeY = clientY - rect.top;
  const attempts = [
    [clientX, clientY],
    [relativeX, relativeY],
    [relativeX / rect.width, relativeY / rect.height],
  ];

  for (const [x, y] of attempts) {
    try {
      const hits = window.XR8.XrController.hitTest(x, y, [
        "FEATURE_POINT",
        "ESTIMATED_SURFACE",
        "DETECTED_SURFACE",
      ]);
      const position = getHitPosition(hits?.[0]);
      if (position) return position;
    } catch (error) {
      console.warn(error);
    }
  }

  return null;
}

function tryHitTestPlace(event) {
  if (!modelRoot) return;

  placementReticle.style.left = `${event.clientX}px`;
  placementReticle.style.top = `${event.clientY}px`;

  placeAtReticle();
}

function updateTrackedReticle() {
  if (!reticleMesh || !modelRoot) return;

  const target = getReticleCenter();
  const hitPosition = hitTestAt(target.x, target.y);
  if (hitPosition) {
    reticleHitPosition = hitPosition;
    reticleMesh.position.copy(hitPosition);
    reticleMesh.visible = true;
    placementReticle.style.opacity = "0";
    placeCenterButton.disabled = false;
    framesWithoutHit = 0;
    if (!targetLocked && !placed) setStatus("Target locked. Place the car.");
    targetLocked = true;
    return;
  }

  framesWithoutHit += 1;
  reticleHitPosition = null;
  reticleMesh.visible = false;
  placementReticle.style.opacity = "0.25";
  placeCenterButton.disabled = true;
  targetLocked = false;
  if (!placed && framesWithoutHit === 90) {
    setStatus("Still scanning. Point at textured floor and move slowly.");
  }
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
  const rect = canvas.getBoundingClientRect();
  hotspotDot.classList.toggle("is-visible", visible);
  hotspotDot.style.left = `${rect.left + (point.x * 0.5 + 0.5) * rect.width}px`;
  hotspotDot.style.top = `${rect.top + (-point.y * 0.5 + 0.5) * rect.height}px`;
}

function initScenePipelineModule() {
  return {
    name: "supra-scene",
    onStart: async () => {
      fitCanvasToScreen();
      xrScene = window.XR8.Threejs.xrScene();
      const { scene, camera, renderer } = xrScene;

      if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = true;
      fitCanvasToScreen();

      scene.add(new THREE.HemisphereLight(0xffffff, 0x95a3b8, 2.4));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3);
      keyLight.position.set(3, 5, 4);
      scene.add(keyLight);
      createTrackedReticle(scene);

      camera.near = 0.01;
      camera.far = 80;
      camera.updateProjectionMatrix();

      await loadCar(scene);
    },
    onUpdate: () => {
      fitCanvasToScreen();
      updateTrackedReticle();
      updateHotspot();
    },
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
  fitCanvasToScreen();
  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.Threejs.pipelineModule(),
    XR8.XrController.pipelineModule(),
    initScenePipelineModule(),
  ]);

  XR8.XrController.configure({ disableWorldTracking: false });
  try {
    XR8.run({
      canvas,
      allowedDevices: XR8.XrConfig.device().ANY,
      cameraConfig: {
        direction: XR8.XrConfig.camera().BACK,
      },
    });
    window.setTimeout(fitCanvasToScreen, 250);
    window.setTimeout(fitCanvasToScreen, 1000);
  } catch (error) {
    started = false;
    setStatus(`8th Wall failed: ${error.message}`);
  }
}

canvas.addEventListener("pointerdown", tryHitTestPlace);
placeCenterButton.addEventListener("click", placeAtReticle);
cameraModeButton.addEventListener("click", toggleCameraMode);
scaleInput.addEventListener("input", applyScale);
hotspotDot.addEventListener("click", () => hotspotCard.classList.add("is-visible"));
closeHotspot.addEventListener("click", () => hotspotCard.classList.remove("is-visible"));
window.addEventListener("resize", fitCanvasToScreen);
window.visualViewport?.addEventListener("resize", fitCanvasToScreen);
window.addEventListener("orientationchange", () => window.setTimeout(fitCanvasToScreen, 250));

updateCameraModeButton();
fitCanvasToScreen();
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
