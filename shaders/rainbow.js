export const rainbow = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

vec3 rainbow(float t) {
  t = clamp(t, 0.0, 1.0);
  // white -> yellow -> orange -> red -> magenta -> blue -> green
  vec3 colors[7];
  colors[0] = vec3(1.0, 1.0, 1.0);   // white
  colors[1] = vec3(1.0, 0.95, 0.4);  // yellow
  colors[2] = vec3(1.0, 0.55, 0.1);  // orange
  colors[3] = vec3(1.0, 0.15, 0.2);  // red
  colors[4] = vec3(0.9, 0.1, 0.6);   // magenta
  colors[5] = vec3(0.2, 0.3, 0.9);   // blue
  colors[6] = vec3(0.1, 0.6, 0.3);   // green

  float segment = t * 6.0;
  int idx = int(floor(segment));
  float frac = fract(segment);

  if (idx >= 6) return colors[6];
  return mix(colors[idx], colors[idx + 1], frac);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float aspect = u_resolution.x / u_resolution.y;

  float t = u_time * 0.15;

  // dramatic sweeping arc from bottom-left to top-right
  float x = p.x + aspect * 0.5;
  float curve = -0.9 + x * 0.3 + pow(x, 2.0) * 0.6;

  // subtle wave motion
  curve += sin(x * 2.0 + t * 2.0) * 0.03;
  curve += sin(x * 4.0 - t * 3.0) * 0.015;

  // distance to curve
  float d = p.y - curve;

  // ribbon thickness
  float thickness = 0.09;

  // position in ribbon (0 = top/white edge, 1 = bottom/green edge)
  float ribbonT = 1.0 - (d + thickness) / (thickness * 2.0);

  // soft ribbon mask
  float ribbonMask = smoothstep(thickness * 1.1, thickness * 0.8, abs(d));

  // rainbow color
  vec3 ribbonCol = rainbow(ribbonT);

  // bright white core on top edge
  float whiteLine = smoothstep(thickness, thickness * 0.6, d) *
                    smoothstep(-thickness * 0.5, thickness * 0.3, d);
  whiteLine = pow(whiteLine, 2.0);

  // glow falloff
  float glow = exp(-abs(d) * 8.0) * 0.6;
  vec3 glowCol = rainbow(clamp(ribbonT, 0.2, 0.8));

  // background
  vec3 col = vec3(0.01, 0.01, 0.015);

  // add glow
  col += glowCol * glow;

  // add ribbon
  col = mix(col, ribbonCol, ribbonMask);

  // add white highlight
  col += vec3(1.0) * whiteLine * 0.8;

  // bloom on white edge
  float bloom = exp(-max(d - thickness * 0.3, 0.0) * 15.0) * 0.4;
  bloom *= smoothstep(-thickness, thickness * 0.5, d);
  col += vec3(1.0, 0.98, 0.9) * bloom;

  // gamma
  col = pow(col, vec3(0.45));

  fragColor = vec4(col, 1.0);
}`,
};
