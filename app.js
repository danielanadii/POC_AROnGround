import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#scene");
const statusEl = document.querySelector("#status");
const toastEl = document.querySelector("#toast");
const arButton = document.querySelector("#arButton");
const resetViewButton = document.querySelector("#resetView");
const rotateButton = document.querySelector("#rotateCar");
const scaleInput = document.querySelector("#scale");
const scaleValue = document.querySelector("#scaleValue");
const nativeArViewer = document.querySelector("#nativeArViewer");

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.01, 80);
camera.position.set(3.2, 1.7, 4.8);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  premultipliedAlpha: false
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.55, 0);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 2.5;
controls.maxDistance = 8;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd6dde5, 2.6);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(4, 6, 3);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(5.5, 96),
  new THREE.ShadowMaterial({ color: 0x2f3a48, opacity: 0.18 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(10, 20, 0x0f9f7a, 0xaab6c5);
grid.material.opacity = 0.34;
grid.material.transparent = true;
scene.add(grid);

const modelRoot = new THREE.Group();
scene.add(modelRoot);

const reticle = makeReticle();
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

const xrController = renderer.xr.getController(0);
scene.add(xrController);

let car = null;
let baseScale = 1;
let rotationStep = 0;
let hitTestSource = null;
let hitTestSourceRequested = false;
let currentSession = null;
let placedInAR = false;
let arLaunchMode = "none";

function setStatus(text) {
  statusEl.textContent = text;
}

let toastTimer = 0;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("is-visible"), 3600);
}

function makeReticle() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.24, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x0f9f7a })
  );
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.035, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  group.add(ring, dot);
  return group;
}

function frameModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const longestSide = Math.max(size.x, size.y, size.z) || 1;

  baseScale = 2.25 / longestSide;
  object.position.sub(center);
  object.position.y += size.y * 0.5;
  object.scale.setScalar(baseScale);
  object.rotation.y = Math.PI;
  modelRoot.position.set(0, 0, 0);
  modelRoot.rotation.set(0, 0, 0);
}

function setPreviewCamera() {
  const isPortrait = window.innerWidth < window.innerHeight;
  camera.position.copy(isPortrait ? new THREE.Vector3(3.6, 1.65, 6.4) : new THREE.Vector3(3.2, 1.7, 4.8));
  controls.target.set(0, 0.55, 0);
  controls.update();
}

function applyScale() {
  const scale = Number(scaleInput.value);
  modelRoot.scale.setScalar(scale);
  scaleValue.textContent = `${scale.toFixed(2)}x`;
  if (nativeArViewer) {
    nativeArViewer.scale = `${scale} ${scale} ${scale}`;
  }
}

function resetView() {
  modelRoot.position.set(0, 0, 0);
  modelRoot.rotation.y = 0;
  setPreviewCamera();
  showToast("Preview reset");
}

function rotateCar() {
  rotationStep += Math.PI / 4;
  modelRoot.rotation.y = rotationStep;
}

function enterARRenderMode() {
  document.documentElement.classList.add("is-ar");
  document.body.classList.add("is-ar");
  canvas.style.background = "transparent";
  renderer.setClearColor(0x000000, 0);
}

function exitARRenderMode() {
  document.documentElement.classList.remove("is-ar");
  document.body.classList.remove("is-ar");
  canvas.style.background = "";
  renderer.setClearColor(0x000000, 0);
}

async function loadModel() {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync("./toyota_gr_supra.glb");
  car = gltf.scene;
  car.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.envMapIntensity = 0.9;
      }
    }
  });
  frameModel(car);
  modelRoot.add(car);
  setPreviewCamera();
  applyScale();
  setStatus("Preview ready");
  showToast("Drag to orbit. Pinch to zoom.");
}

async function checkARSupport() {
  arLaunchMode = "none";

  if ("xr" in navigator) {
    try {
      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (supported) {
        arLaunchMode = "webxr";
        arButton.disabled = false;
        arButton.textContent = "Place on ground";
        setStatus("AR ready");
        return;
      }
    } catch {
      arLaunchMode = "none";
    }
  }

  await customElements.whenDefined("model-viewer").catch(() => {});
  if (nativeArViewer && typeof nativeArViewer.activateAR === "function") {
    arLaunchMode = "native";
    arButton.disabled = false;
    arButton.textContent = "Open AR";
    setStatus("Native AR");
    return;
  }

  arButton.disabled = true;
  arButton.textContent = "3D only";
  setStatus("3D preview");
}

async function startAR() {
  if (!car) {
    showToast("The model is still loading.");
    return;
  }

  if (!navigator.xr) {
    showToast("This browser does not expose WebXR AR.");
    return;
  }

  try {
    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "local-floor"],
      domOverlay: { root: document.body }
    });

    currentSession = session;
    enterARRenderMode();
    await renderer.xr.setSession(session);
    controls.enabled = false;
    ground.visible = false;
    grid.visible = false;
    reticle.visible = false;
    placedInAR = false;
    setStatus("Scan floor");
    arButton.textContent = "Exit AR";
    arButton.disabled = false;
    showToast("Move your phone until the ring locks onto the floor, then tap.");

    session.addEventListener("end", () => {
      currentSession = null;
      hitTestSource = null;
      hitTestSourceRequested = false;
      controls.enabled = true;
      ground.visible = true;
      grid.visible = true;
      reticle.visible = false;
      exitARRenderMode();
      setStatus("AR ready");
      arButton.textContent = "Place on ground";
    });
  } catch (error) {
    exitARRenderMode();
    console.error(error);
    showToast("AR could not start on this device/browser.");
  }
}

async function endAR() {
  if (currentSession) await currentSession.end();
}

async function openNativeAR() {
  if (!nativeArViewer || typeof nativeArViewer.activateAR !== "function") {
    showToast("This browser can show 3D, but not native AR.");
    return;
  }

  try {
    await nativeArViewer.activateAR();
  } catch (error) {
    console.error(error);
    showToast("Native AR is not available in this browser.");
  }
}

function placeCarAtReticle() {
  if (!reticle.visible || !renderer.xr.isPresenting) return;
  modelRoot.position.setFromMatrixPosition(reticle.matrix);
  const cameraWorld = new THREE.Vector3();
  camera.getWorldPosition(cameraWorld);
  const heading = Math.atan2(
    cameraWorld.x - modelRoot.position.x,
    cameraWorld.z - modelRoot.position.z
  );
  modelRoot.rotation.set(0, heading + Math.PI, 0);
  placedInAR = true;
  setStatus("Placed");
  showToast("Placed. Tap another spot to move it.");
}

async function updateHitTest(frame) {
  const session = renderer.xr.getSession();
  if (!session) return;

  if (!hitTestSourceRequested) {
    hitTestSourceRequested = true;
    const referenceSpace = await session.requestReferenceSpace("viewer");
    hitTestSource = await session.requestHitTestSource({ space: referenceSpace });
    session.addEventListener("end", () => {
      hitTestSourceRequested = false;
      hitTestSource = null;
    });
  }

  if (hitTestSource) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const hits = frame.getHitTestResults(hitTestSource);
    if (hits.length) {
      const pose = hits[0].getPose(referenceSpace);
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);
      if (!placedInAR) setStatus("Tap to place");
    } else {
      reticle.visible = false;
      setStatus("Scan floor");
    }
  }
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (!renderer.xr.isPresenting) setPreviewCamera();
});

canvas.addEventListener("click", placeCarAtReticle);
canvas.addEventListener("touchend", placeCarAtReticle);
xrController.addEventListener("select", placeCarAtReticle);
scaleInput.addEventListener("input", applyScale);
resetViewButton.addEventListener("click", resetView);
rotateButton.addEventListener("click", rotateCar);
arButton.addEventListener("click", () => {
  if (currentSession) {
    endAR();
  } else if (arLaunchMode === "webxr") {
    startAR();
  } else if (arLaunchMode === "native") {
    openNativeAR();
  } else {
    showToast("This browser supports 3D preview only.");
  }
});

renderer.setAnimationLoop((time, frame) => {
  if (frame) updateHitTest(frame);
  if (!renderer.xr.isPresenting) {
    controls.update();
  }
  renderer.render(scene, camera);
});

loadModel()
  .then(checkARSupport)
  .catch((error) => {
    console.error(error);
    setStatus("Load failed");
    showToast("Could not load the GLB model.");
  });
