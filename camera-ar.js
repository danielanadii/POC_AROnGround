import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const video = document.querySelector("#cameraFeed");
const canvas = document.querySelector("#cameraScene");
const statusEl = document.querySelector("#markerStatus");
const scaleInput = document.querySelector("#markerScale");
const scaleValue = document.querySelector("#markerScaleValue");
const centerButton = document.querySelector("#centerCar");
const secureCard = document.querySelector("#secureCard");
const hotspotDot = document.querySelector("#hotspotDot");
const hotspotCard = document.querySelector("#hotspotCard");
const closeHotspot = document.querySelector("#closeHotspot");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.01, 80);
camera.position.set(0, 0.85, 5.2);

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

scene.add(new THREE.HemisphereLight(0xffffff, 0x95a3b8, 2.4));
const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(3, 5, 4);
scene.add(keyLight);

const modelRoot = new THREE.Group();
modelRoot.position.set(0, -0.35, 0);
modelRoot.visible = false;
scene.add(modelRoot);

const hotspotWorld = new THREE.Vector3(0, 0.42, -0.34);
let car = null;
let baseScale = 1;
let yaw = Math.PI;
let cameraReady = false;
let modelReady = false;
let carPlaced = false;

function showSecureMessage(text = "Open this page from your HTTPS GitHub Pages URL.") {
  secureCard.classList.add("is-visible");
  statusEl.textContent = "Camera unavailable";
  secureCard.querySelector("p").textContent = text;
}

async function startCamera() {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    showSecureMessage();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    cameraReady = true;
    statusEl.textContent = modelReady ? "Tap Place car or tap the camera" : "Camera ready. Loading car.";
  } catch (error) {
    console.error(error);
    showSecureMessage("Camera permission was blocked or no camera is available in this browser.");
  }
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
  object.rotation.y = yaw;
}

async function loadModel() {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync("./toyota_gr_supra.glb");
  car = gltf.scene;
  car.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.envMapIntensity = 0.9;
    }
  });
  frameModel(car);
  modelRoot.add(car);
  modelReady = true;
  applyScale();
  statusEl.textContent = cameraReady ? "Tap Place car or tap the camera" : "Car ready. Starting camera.";
}

function applyScale() {
  const scale = Number(scaleInput.value);
  modelRoot.scale.setScalar(scale);
  scaleValue.textContent = `${scale.toFixed(2)}x`;
}

function placeCar(x = window.innerWidth / 2, y = window.innerHeight * 0.54) {
  modelRoot.visible = true;
  carPlaced = true;
  modelRoot.position.x = (x / window.innerWidth - 0.5) * 2.4;
  modelRoot.position.y = -(y / window.innerHeight - 0.58) * 1.2;
  modelRoot.position.z = 0;
  centerButton.textContent = "Recenter car";
  statusEl.textContent = "Car placed. Tap screen to move it.";
}

function centerCar() {
  placeCar();
  yaw += Math.PI / 4;
  modelRoot.rotation.y = yaw - Math.PI;
}

function updateHotspot() {
  if (!car || !carPlaced) {
    hotspotDot.classList.remove("is-visible");
    return;
  }

  const point = hotspotWorld.clone();
  car.localToWorld(point);
  point.project(camera);

  const x = (point.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-point.y * 0.5 + 0.5) * window.innerHeight;
  const visible = point.z > -1 && point.z < 1;

  hotspotDot.classList.toggle("is-visible", visible);
  hotspotDot.style.left = `${x}px`;
  hotspotDot.style.top = `${y}px`;
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

canvas.addEventListener("pointerdown", (event) => {
  if (!modelReady) {
    statusEl.textContent = "Car is still loading.";
    return;
  }
  placeCar(event.clientX, event.clientY);
});

scaleInput.addEventListener("input", applyScale);
centerButton.addEventListener("click", centerCar);
hotspotDot.addEventListener("click", () => hotspotCard.classList.add("is-visible"));
closeHotspot.addEventListener("click", () => hotspotCard.classList.remove("is-visible"));

renderer.setAnimationLoop(() => {
  updateHotspot();
  renderer.render(scene, camera);
});

startCamera();
loadModel().catch((error) => {
  console.error(error);
  statusEl.textContent = "Could not load the Supra model";
});
