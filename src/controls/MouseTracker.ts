import * as THREE from "three";

export class MouseTracker {
  position: THREE.Vector2;
  normalized: THREE.Vector2;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.position = new THREE.Vector2(0, 0);
    this.normalized = new THREE.Vector2(0, 0);

    canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    canvas.addEventListener("touchmove", this.onTouchMove.bind(this), {
      passive: true,
    });
  }

  private onMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.position.set((e.clientX - rect.left) * dpr, (rect.height - (e.clientY - rect.top)) * dpr);
    this.normalized.set(
      (e.clientX - rect.left) / rect.width,
      1 - (e.clientY - rect.top) / rect.height
    );
  }

  private onTouchMove(e: TouchEvent) {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.position.set(
      (touch.clientX - rect.left) * dpr,
      (rect.height - (touch.clientY - rect.top)) * dpr
    );
    this.normalized.set(
      (touch.clientX - rect.left) / rect.width,
      1 - (touch.clientY - rect.top) / rect.height
    );
  }
}
