import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export interface BloomSettings {
  enabled: boolean;
  strength: number;
  radius: number;
  threshold: number;
}

export class PostProcessing {
  composer: EffectComposer;
  bloomPass: UnrealBloomPass;
  private renderPass: RenderPass;
  bloomSettings: BloomSettings;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    this.bloomSettings = {
      enabled: true,
      strength: 0.5,
      radius: 0.4,
      threshold: 0.8,
    };

    const size = renderer.getSize(new THREE.Vector2());
    this.bloomPass = new UnrealBloomPass(
      size,
      this.bloomSettings.strength,
      this.bloomSettings.radius,
      this.bloomSettings.threshold
    );
    this.composer.addPass(this.bloomPass);
  }

  setBloomEnabled(enabled: boolean) {
    this.bloomSettings.enabled = enabled;
    this.bloomPass.enabled = enabled;
  }

  setBloomStrength(strength: number) {
    this.bloomSettings.strength = strength;
    this.bloomPass.strength = strength;
  }

  setBloomRadius(radius: number) {
    this.bloomSettings.radius = radius;
    this.bloomPass.radius = radius;
  }

  setBloomThreshold(threshold: number) {
    this.bloomSettings.threshold = threshold;
    this.bloomPass.threshold = threshold;
  }

  resize(width: number, height: number) {
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }

  render() {
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
  }
}
