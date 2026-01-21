export const chromawave = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

#define NUM_RIBBONS 7

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float t = u_time * 0.5;

  vec3 colors[7];
  colors[0] = vec3(1.0, 1.0, 1.0);   // white
  colors[1] = vec3(1.0, 0.9, 0.2);   // yellow
  colors[2] = vec3(1.0, 0.5, 0.1);   // orange
  colors[3] = vec3(1.0, 0.15, 0.2);  // red
  colors[4] = vec3(0.85, 0.1, 0.55); // magenta
  colors[5] = vec3(0.2, 0.35, 0.95); // blue
  colors[6] = vec3(0.15, 0.55, 0.3); // green

  vec3 col = vec3(0.01, 0.01, 0.015);

  for (int i = NUM_RIBBONS - 1; i >= 0; i--) {
    float fi = float(i);

    // each ribbon offset slightly in phase and position
    float phase = fi * 0.15;
    float yOffset = (fi - 3.0) * 0.045;

    // sine wave curve
    float curve = sin(p.x * 2.5 + t + phase) * 0.25;
    curve += sin(p.x * 1.2 - t * 0.7 + phase) * 0.1;
    curve += yOffset;

    // distance to this ribbon's center
    float d = p.y - curve;

    // ribbon thickness
    float thickness = 0.022;

    // ribbon mask with soft edges
    float ribbon = smoothstep(thickness, thickness * 0.3, abs(d));

    // glow
    float glow = exp(-abs(d) * 25.0) * 0.4;

    // add glow
    col += colors[i] * glow;

    // draw ribbon on top
    col = mix(col, colors[i], ribbon);

    // bright edge on top side of each ribbon
    float edge = smoothstep(thickness * 0.8, 0.0, d) *
                 smoothstep(-thickness * 0.5, 0.0, d);
    col += colors[i] * edge * 0.3;
  }

  // overall bloom
  col += col * col * 0.2;

  // gamma
  col = pow(col, vec3(0.45));

  fragColor = vec4(col, 1.0);
}`,
};
