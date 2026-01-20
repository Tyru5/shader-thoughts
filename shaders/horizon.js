export const horizon = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;

  // dark background
  vec3 color = vec3(0.02, 0.03, 0.05);

  // curve parameters - large arc below center
  vec2 center = vec2(0.5, -0.8);
  float radius = 1.2;

  // distance from arc
  vec2 p = uv - center;
  p.x *= aspect;
  float dist = length(p) - radius;

  // angle along the arc (0 = right, PI = left)
  float angle = atan(p.y, p.x);

  // normalize to 0-1 range where 0 = left, 1 = right
  float arcProgress = 1.0 - (angle / 3.14159);

  // animation progress (0 to 1 over time, then stays at 1)
  float animTime = clamp(u_time * 0.4, 0.0, 1.0);

  // reveal mask - show everything that's been drawn so far (stays visible)
  float reveal = smoothstep(animTime + 0.01, animTime - 0.05, arcProgress);

  // only show upper part of circle (the arc)
  float arcMask = smoothstep(-0.1, 0.1, p.y + 0.3);

  // subtle thickness oscillation after animation completes
  float oscillation = 1.0 + sin(u_time * 2.0) * 0.15 * smoothstep(0.9, 1.0, animTime);

  // main glowing line
  float line = exp(-abs(dist) * 80.0 / oscillation);

  // soft inner glow
  float glow1 = exp(-abs(dist) * 20.0 / oscillation) * 0.5;

  // wider atmospheric glow
  float glow2 = exp(-abs(dist) * 6.0) * 0.2;

  // very soft ambient
  float glow3 = exp(-abs(dist) * 2.0) * 0.08;

  // only glow above the line (atmosphere effect)
  float aboveLine = smoothstep(0.0, 0.02, dist);

  // colors
  vec3 lineColor = vec3(0.3, 0.7, 1.0);
  vec3 glowColor = vec3(0.2, 0.5, 0.9);
  vec3 atmoColor = vec3(0.1, 0.3, 0.6);

  // combine with reveal animation
  color += lineColor * line * arcMask * reveal;
  color += glowColor * glow1 * arcMask * reveal;
  color += atmoColor * glow2 * arcMask * (0.7 + aboveLine * 0.5) * reveal;
  color += atmoColor * glow3 * arcMask * aboveLine * reveal;

  // bright leading edge during animation
  float edge = smoothstep(animTime - 0.1, animTime, arcProgress) *
               smoothstep(animTime + 0.1, animTime, arcProgress);
  edge *= step(animTime, 0.99); // hide edge when animation complete
  color += vec3(0.5, 0.8, 1.0) * edge * arcMask * exp(-abs(dist) * 40.0) * 2.0;

  // slight gradient on background
  color += vec3(0.01, 0.02, 0.04) * (1.0 - uv.y);

  fragColor = vec4(color, 1.0);
}`
};
