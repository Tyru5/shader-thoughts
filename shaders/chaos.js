export const chaos = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

mat2 rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

// fast hash
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// cheap noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

// 3 octave fbm
float fbm(vec2 p) {
  return noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125;
}

// kaleidoscopic fold
vec3 fold(vec3 p, float t) {
  p.xy *= rot(t * 0.3);
  p.xz *= rot(t * 0.2);

  for(int i = 0; i < 3; i++) {
    p = abs(p) - vec3(0.8, 1.0, 0.6);
    p.xy *= rot(0.78);
    p.xz *= rot(0.92);
  }
  return p;
}

// simple box sdf
float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdf(vec3 p) {
  vec3 fp = fold(p, u_time * 0.5);
  float box = sdBox(fp, vec3(0.4)) - 0.05;
  float sphere = length(fp) - 0.6;
  return min(box, sphere);
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(0.002, 0);
  return normalize(vec3(
    sdf(p + e.xyy) - sdf(p - e.xyy),
    sdf(p + e.yxy) - sdf(p - e.yxy),
    sdf(p + e.yyx) - sdf(p - e.yyx)
  ));
}

float raymarch(vec3 ro, vec3 rd) {
  float d = 0.0;
  for(int i = 0; i < 64; i++) {
    float ds = sdf(ro + rd * d);
    d += ds;
    if(ds < 0.001 || d > 20.0) break;
  }
  return d;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec2 mouse = u_mouse / u_resolution;
  float t = u_time;

  // camera
  vec3 ro = vec3(sin(t * 0.3) * 3.5, cos(t * 0.2) * 1.5, cos(t * 0.3) * 3.5);
  ro.xz *= rot((mouse.x - 0.5) * 6.28);

  vec3 fwd = normalize(-ro);
  vec3 right = normalize(cross(vec3(0, 1, 0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(uv.x * right + uv.y * up + fwd * 1.5);

  float d = raymarch(ro, rd);
  vec3 col = vec3(0);

  if(d < 20.0) {
    vec3 p = ro + rd * d;
    vec3 n = getNormal(p);

    // lighting
    vec3 light = normalize(vec3(sin(t), 1, cos(t)));
    float diff = max(dot(n, light), 0.0);
    float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 16.0);
    float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 2.0);

    // psychedelic colors
    vec3 baseCol = 0.5 + 0.5 * cos(t * 0.5 + p * 2.0 + vec3(0, 2, 4));
    vec3 rimCol = 0.5 + 0.5 * cos(t + n * 3.0 + vec3(4, 2, 0));

    col = baseCol * (diff * 0.6 + 0.4);
    col += spec * 0.5;
    col = mix(col, rimCol, fresnel * 0.5);
  }

  // background glow
  float bgGlow = fbm(uv * 3.0 + t * 0.2);
  vec3 bgCol = 0.5 + 0.5 * cos(t * 0.3 + vec3(0, 2, 4) + bgGlow * 2.0);
  col = mix(bgCol * 0.15, col, smoothstep(20.0, 5.0, d));

  // glow around geometry
  float glow = exp(-d * 0.3) * 0.4;
  col += glow * (0.5 + 0.5 * cos(t + vec3(0, 2, 4)));

  // vignette
  col *= 1.0 - length(v_uv - 0.5) * 0.6;

  // subtle grain
  col += (hash(uv + t) - 0.5) * 0.04;

  // tonemap + gamma
  col = col / (1.0 + col);
  col = pow(col, vec3(0.45));

  fragColor = vec4(col, 1.0);
}`
};
