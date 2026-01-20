export const godrays = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time;

  float col = 0.0;

  // flowing silk rays from top-right
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float offset = fi * 0.25 + hash(fi) * 0.1;
    float speed = 0.05 + hash(fi + 10.0) * 0.05;
    float width = 0.15 + hash(fi + 20.0) * 0.15;

    float wave = sin(uv.y * 2.0 + t * speed + fi) * 0.1;
    float ray = uv.x - uv.y * 0.7 + offset + wave;
    float intensity = 0.08 + hash(fi + 30.0) * 0.06;
    intensity *= 0.8 + 0.2 * sin(t * (0.1 + fi * 0.03) + fi * 2.0);

    col += intensity * exp(-ray * ray / (width * width));
  }

  // flowing silk rays from top-left
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float offset = fi * 0.22 + hash(fi + 50.0) * 0.12;
    float speed = 0.04 + hash(fi + 60.0) * 0.06;
    float width = 0.12 + hash(fi + 70.0) * 0.18;

    float wave = sin(uv.y * 2.5 + t * speed + fi * 1.5) * 0.08;
    float ray = (1.0 - uv.x) - uv.y * 0.6 + offset + wave;
    float intensity = 0.06 + hash(fi + 80.0) * 0.05;
    intensity *= 0.8 + 0.2 * sin(t * (0.08 + fi * 0.025) + fi * 3.0 + 1.0);

    col += intensity * exp(-ray * ray / (width * width));
  }

  // slight brightness toward top
  col += 0.02 * (1.0 - uv.y);

  // gamma for softer look
  col = pow(col, 0.7);

  fragColor = vec4(vec3(col), 1.0);
}`
};
