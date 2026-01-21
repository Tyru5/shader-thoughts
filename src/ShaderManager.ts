import * as THREE from "three";

export interface ShaderDef {
  fragment: string;
  vertex?: string;
}

export type ShaderUniforms = {
  u_time: THREE.IUniform<number>;
  u_resolution: THREE.IUniform<THREE.Vector2>;
  u_mouse: THREE.IUniform<THREE.Vector2>;
  [key: string]: THREE.IUniform<unknown>;
};

const defaultVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function convertToThreeGLSL(source: string): string {
  return source
    .replace(/#version 300 es\s*/g, "")
    .replace(/\bin\s+vec2\s+v_uv\s*;/g, "varying vec2 vUv;")
    .replace(/\bout\s+vec4\s+fragColor\s*;/g, "")
    .replace(/fragColor\s*=/g, "gl_FragColor =")
    .replace(/\bv_uv\b/g, "vUv");
}

export class ShaderManager {
  private shaders: Record<string, ShaderDef>;
  private materials: Map<string, THREE.ShaderMaterial> = new Map();
  private mesh: THREE.Mesh;
  uniforms: ShaderUniforms;
  currentShader: string | null = null;

  constructor(shaders: Record<string, ShaderDef>) {
    this.shaders = shaders;

    this.uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2() },
      u_mouse: { value: new THREE.Vector2() },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.mesh = new THREE.Mesh(geometry, material);
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  getShaderNames(): string[] {
    return Object.keys(this.shaders);
  }

  getCurrentShaderName(): string | null {
    return this.currentShader;
  }

  loadShader(name: string): boolean {
    const shader = this.shaders[name];
    if (!shader) return false;

    let material = this.materials.get(name);
    if (!material) {
      const fragment = convertToThreeGLSL(shader.fragment);
      const vertex = shader.vertex ? convertToThreeGLSL(shader.vertex) : defaultVertexShader;

      material = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: vertex,
        fragmentShader: fragment,
      });
      this.materials.set(name, material);
    }

    this.mesh.material = material;
    this.currentShader = name;
    this.uniforms.u_time.value = 0;
    return true;
  }

  updateUniforms(time: number, resolution: THREE.Vector2, mouse: THREE.Vector2) {
    this.uniforms.u_time.value = time;
    this.uniforms.u_resolution.value.copy(resolution);
    this.uniforms.u_mouse.value.copy(mouse);
  }

  dispose() {
    this.materials.forEach((mat) => mat.dispose());
    this.materials.clear();
    (this.mesh.geometry as THREE.BufferGeometry).dispose();
  }
}
