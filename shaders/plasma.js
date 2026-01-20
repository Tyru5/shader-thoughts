export const plasma = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 uv = v_uv * 4.0;
  float t = u_time * 0.5;

  float v = 0.0;
  v += sin(uv.x + t);
  v += sin((uv.y + t) * 0.5);
  v += sin((uv.x + uv.y + t) * 0.5);
  v += sin(sqrt(uv.x * uv.x + uv.y * uv.y) + t);

  v = v * 0.5;

  vec3 color = vec3(
    sin(v * 3.14159) * 0.5 + 0.5,
    sin(v * 3.14159 + 2.094) * 0.5 + 0.5,
    sin(v * 3.14159 + 4.188) * 0.5 + 0.5
  );

  fragColor = vec4(color, 1.0);
}`
};
