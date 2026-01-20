export const trail = {
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

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0;
  return mix(
    mix(hash(n), hash(n + 1.0), f.x),
    mix(hash(n + 57.0), hash(n + 58.0), f.x),
    f.y
  );
}

void main() {
  vec2 uv = v_uv;
  vec2 mouse = u_mouse / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;

  vec2 st = uv;
  st.x *= aspect;
  vec2 m = mouse;
  m.x *= aspect;

  vec3 color = vec3(0.02, 0.02, 0.04);

  // trailing orbs following mouse with delay
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float delay = fi * 0.12;
    float t = u_time - delay;

    // each orb has offset and unique movement
    float offsetX = sin(t * 1.5 + fi * 0.8) * 0.08 * (1.0 - fi * 0.06);
    float offsetY = cos(t * 1.2 + fi * 0.6) * 0.06 * (1.0 - fi * 0.06);

    vec2 orbPos = m + vec2(offsetX, offsetY);

    // trail stretches away from mouse
    float trailFactor = fi * 0.025;
    orbPos += normalize(vec2(0.5 * aspect, 0.5) - m) * trailFactor;

    float dist = length(st - orbPos);

    // size decreases along trail
    float size = 0.06 - fi * 0.004;
    float intensity = smoothstep(size, 0.0, dist);
    intensity *= 1.0 - fi * 0.07;

    // color shifts along trail
    vec3 orbColor = vec3(
      0.15 + fi * 0.02,
      0.25 + fi * 0.015,
      0.4 + fi * 0.01
    );

    color += orbColor * intensity * 0.6;
  }

  // soft glow around mouse
  float mouseDist = length(st - m);
  float glow = exp(-mouseDist * 4.0) * 0.3;
  color += vec3(0.1, 0.2, 0.35) * glow;

  // subtle particles
  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    float t = u_time * 0.3 + fi * 6.28 / 20.0;

    vec2 particlePos = m + vec2(
      cos(t + fi) * (0.15 + noise(vec2(fi, u_time * 0.2)) * 0.1),
      sin(t * 0.8 + fi * 1.3) * (0.12 + noise(vec2(fi + 50.0, u_time * 0.15)) * 0.08)
    );

    float dist = length(st - particlePos);
    float particle = smoothstep(0.012, 0.0, dist);
    particle *= 0.4 + 0.6 * sin(u_time * 2.0 + fi);

    color += vec3(0.2, 0.3, 0.5) * particle * 0.3;
  }

  // ripple effect from mouse
  float ripple = sin(mouseDist * 40.0 - u_time * 3.0) * 0.5 + 0.5;
  ripple *= smoothstep(0.5, 0.0, mouseDist);
  ripple *= 0.04;
  color += vec3(0.1, 0.15, 0.25) * ripple;

  fragColor = vec4(color, 1.0);
}`
};
