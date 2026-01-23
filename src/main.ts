import "./style.css";
import * as THREE from "three";
import { shaders } from "../shaders/index.js";
import { ShaderManager } from "./ShaderManager";
import { PostProcessing } from "./PostProcessing";
import { MouseTracker } from "./controls/MouseTracker";
import { ShaderGallery } from "./ui/ShaderGallery";
import { captureSnapshot } from "./utils/snapshot";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const shaderManager = new ShaderManager(shaders);
scene.add(shaderManager.getMesh());

const postProcessing = new PostProcessing(renderer, scene, camera);
const mouseTracker = new MouseTracker(canvas);
const clock = new THREE.Clock();
const resolution = new THREE.Vector2();

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = shaderManager.getResolutionScale();
  const dpr = window.devicePixelRatio * scale;
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  postProcessing.resize(w * dpr, h * dpr);
  resolution.set(w * dpr, h * dpr);
}

resize();
window.addEventListener("resize", resize);

const gallery = new ShaderGallery({
  shaderNames: shaderManager.getShaderNames(),
  onShaderSelect: (name) => {
    shaderManager.loadShader(name);
    resize();
    clock.start();
  },
  onBloomToggle: (enabled) => postProcessing.setBloomEnabled(enabled),
  onBloomStrengthChange: (strength) => postProcessing.setBloomStrength(strength),
  onFullscreen: () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  },
  onSnapshot: async (resolution) => {
    gallery.toggleUI();
    const name = shaderManager.getCurrentShaderName() || "shader";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    await captureSnapshot({
      renderer,
      postProcessing,
      resolution,
      filename: `${name}_${timestamp}.png`,
    });
    gallery.toggleUI();
  },
});

const shaderNames = shaderManager.getShaderNames();
if (shaderNames.length > 0) {
  shaderManager.loadShader(shaderNames[0]);
}

function animate() {
  requestAnimationFrame(animate);
  shaderManager.updateUniforms(clock.getElapsedTime(), resolution, mouseTracker.position);
  postProcessing.render();
}

animate();
