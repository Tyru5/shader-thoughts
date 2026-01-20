import './style.css'
import { shaders } from '../shaders/index.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl2');
const select = document.getElementById('shader-select') as HTMLSelectElement;

if (!gl) {
  alert('WebGL2 not supported');
  throw new Error('WebGL2 not supported');
}

// Fullscreen quad vertices
const vertices = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
   1,  1,
]);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Default vertex shader for fullscreen quad
const defaultVertexShader = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

let currentProgram: WebGLProgram | null = null;
let startTime = performance.now();
let uniforms: {
  u_time: WebGLUniformLocation | null;
  u_resolution: WebGLUniformLocation | null;
  u_mouse: WebGLUniformLocation | null;
} = {
  u_time: null,
  u_resolution: null,
  u_mouse: null,
};

function compileShader(type: number, source: string): WebGLShader | null {
  const shader = gl!.createShader(type);
  if (!shader) return null;
  
  gl!.shaderSource(shader, source);
  gl!.compileShader(shader);

  if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl!.getShaderInfoLog(shader));
    gl!.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
  const vertexShader = compileShader(gl!.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl!.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl!.createProgram();
  if (!program) return null;
  
  gl!.attachShader(program, vertexShader);
  gl!.attachShader(program, fragmentShader);
  gl!.linkProgram(program);

  if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) {
    console.error('Program link error:', gl!.getProgramInfoLog(program));
    return null;
  }

  gl!.deleteShader(vertexShader);
  gl!.deleteShader(fragmentShader);

  return program;
}

function loadShader(name: string) {
  const shader = shaders[name];
  if (!shader) return;

  if (currentProgram) {
    gl!.deleteProgram(currentProgram);
  }

  const vertexSource = shader.vertex || defaultVertexShader;
  currentProgram = createProgram(vertexSource, shader.fragment);

  if (!currentProgram) return;

  gl!.useProgram(currentProgram);

  // Setup vertex attribute
  const posLoc = gl!.getAttribLocation(currentProgram, 'a_position');
  gl!.enableVertexAttribArray(posLoc);
  gl!.vertexAttribPointer(posLoc, 2, gl!.FLOAT, false, 0, 0);

  // Cache uniform locations
  uniforms = {
    u_time: gl!.getUniformLocation(currentProgram, 'u_time'),
    u_resolution: gl!.getUniformLocation(currentProgram, 'u_resolution'),
    u_mouse: gl!.getUniformLocation(currentProgram, 'u_mouse'),
  };

  startTime = performance.now();
}

// Populate shader select
Object.keys(shaders).forEach((name) => {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  select.appendChild(option);
});

select.addEventListener('change', () => loadShader(select.value));

// Resize canvas to fill container
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Mouse tracking
let mouse: [number, number] = [0, 0];
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  mouse = [
    (e.clientX - rect.left) * dpr,
    canvas.height - (e.clientY - rect.top) * dpr
  ];
});

// Render loop - target 60fps
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;
let lastFrameTime = 0;

function render(currentTime: number) {
  requestAnimationFrame(render);

  const elapsed = currentTime - lastFrameTime;
  if (elapsed < frameInterval) return;

  lastFrameTime = currentTime - (elapsed % frameInterval);

  if (!currentProgram) return;

  gl!.viewport(0, 0, canvas.width, canvas.height);
  gl!.clearColor(0, 0, 0, 1);
  gl!.clear(gl!.COLOR_BUFFER_BIT);

  const time = (performance.now() - startTime) / 1000;

  if (uniforms.u_time) gl!.uniform1f(uniforms.u_time, time);
  if (uniforms.u_resolution) gl!.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
  if (uniforms.u_mouse) gl!.uniform2f(uniforms.u_mouse, mouse[0], mouse[1]);

  gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
}

// Load first shader
if (Object.keys(shaders).length > 0) {
  loadShader(Object.keys(shaders)[0]);
}

render(0);
