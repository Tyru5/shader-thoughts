import * as THREE from "three";
import type { PostProcessing } from "../PostProcessing";

export interface SnapshotOptions {
  renderer: THREE.WebGLRenderer;
  postProcessing: PostProcessing;
  resolution: { width: number; height: number };
  filename: string;
}

export const RESOLUTIONS = [
  { label: "Native", width: 0, height: 0 },
  { label: "1080p", width: 1920, height: 1080 },
  { label: "4K", width: 3840, height: 2160 },
];

export async function captureSnapshot(opts: SnapshotOptions): Promise<void> {
  const { renderer, postProcessing, resolution, filename } = opts;
  const canvas = renderer.domElement;

  const originalSize = renderer.getSize(new THREE.Vector2());
  const originalPixelRatio = renderer.getPixelRatio();

  const targetWidth = resolution.width || originalSize.x;
  const targetHeight = resolution.height || originalSize.y;

  renderer.setPixelRatio(1);
  renderer.setSize(targetWidth, targetHeight);
  postProcessing.resize(targetWidth, targetHeight);

  postProcessing.render();

  return new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      renderer.setPixelRatio(originalPixelRatio);
      renderer.setSize(originalSize.x, originalSize.y);
      postProcessing.resize(
        originalSize.x * originalPixelRatio,
        originalSize.y * originalPixelRatio
      );

      resolve();
    }, "image/png");
  });
}
