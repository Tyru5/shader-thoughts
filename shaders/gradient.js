export const gradient = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 uv = v_uv;

  vec3 col1 = vec3(0.1, 0.2, 0.4);
  vec3 col2 = vec3(0.9, 0.4, 0.3);

  float t = sin(u_time * 0.5) * 0.5 + 0.5;
  float gradient = uv.x * (1.0 - t) + uv.y * t;

  vec3 color = mix(col1, col2, gradient);

  fragColor = vec4(color, 1.0);
}`,
};
