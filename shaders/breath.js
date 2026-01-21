export const breath = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));

  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  float t = u_time * 0.08;

  // breath rhythm - slow inhale/exhale
  float breathCycle = sin(t * 3.14159) * 0.5 + 0.5;
  breathCycle = smoothstep(0.0, 1.0, breathCycle);

  // flowing layers
  float n1 = fbm(uv * 1.5 + vec2(t * 0.3, t * 0.2));
  float n2 = fbm(uv * 2.0 - vec2(t * 0.2, -t * 0.15) + 50.0);
  float n3 = fbm(uv * 0.8 + vec2(-t * 0.1, t * 0.25) + 100.0);

  // soft wave distortion
  float wave = sin(uv.y * 3.0 + t + n1 * 2.0) * 0.15;
  wave += sin(uv.x * 2.5 - t * 0.7 + n2 * 1.5) * 0.1;

  // color palette - calming teals, soft blues, muted lavender
  vec3 col1 = vec3(0.04, 0.08, 0.12);  // deep navy
  vec3 col2 = vec3(0.08, 0.18, 0.22);  // dark teal
  vec3 col3 = vec3(0.12, 0.25, 0.30);  // soft teal
  vec3 col4 = vec3(0.18, 0.22, 0.32);  // muted lavender

  // blend colors based on noise and position
  float blend1 = smoothstep(0.2, 0.6, n1 + wave + breathCycle * 0.2);
  float blend2 = smoothstep(0.3, 0.7, n2 - wave * 0.5);
  float blend3 = smoothstep(0.25, 0.65, n3 + uv.y * 0.3);

  vec3 color = col1;
  color = mix(color, col2, blend1);
  color = mix(color, col3, blend2 * 0.7);
  color = mix(color, col4, blend3 * 0.5);

  // subtle glow in center
  float centerDist = length(uv - vec2(aspect * 0.5, 0.5));
  float glow = 1.0 - smoothstep(0.0, 0.8, centerDist);
  glow *= 0.15 * (0.8 + breathCycle * 0.4);

  color += vec3(0.05, 0.08, 0.12) * glow;

  // very subtle vignette
  float vignette = 1.0 - smoothstep(0.4, 1.2, centerDist);
  color *= 0.85 + vignette * 0.15;

  fragColor = vec4(color, 1.0);
}`,
};
