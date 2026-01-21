export const abyss = {
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
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// caustic pattern
float caustic(vec2 p, float t) {
  float c = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 q = p * (1.0 + fi * 0.5);
    q += vec2(t * 0.1 * (fi + 1.0), t * 0.08);
    float n = noise(q * 8.0);
    n = sin(n * 6.28 + t) * 0.5 + 0.5;
    c += n / (1.0 + fi);
  }
  return c / 2.0;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 st = (uv - 0.5) * vec2(aspect, 1.0);

  float t = u_time * 0.3;

  // water current distortion
  vec2 current = vec2(
    fbm(st * 2.0 + t * 0.2) - 0.5,
    fbm(st * 2.0 + vec2(50.0) + t * 0.15) - 0.5
  ) * 0.03;
  st += current;

  // base deep water color - dark abyss blue
  vec3 deepColor = vec3(0.0, 0.02, 0.05);
  vec3 midColor = vec3(0.0, 0.05, 0.12);
  vec3 shallowColor = vec3(0.02, 0.12, 0.2);

  // depth gradient - darker at bottom
  float depth = uv.y;
  vec3 color = mix(deepColor, midColor, smoothstep(0.0, 0.5, depth));
  color = mix(color, shallowColor, smoothstep(0.5, 1.0, depth));

  // caustics from far above surface
  float causticsIntensity = caustic(st, t);
  causticsIntensity *= smoothstep(0.0, 0.8, depth); // stronger near "top"
  causticsIntensity *= 0.15;
  vec3 causticColor = vec3(0.1, 0.3, 0.4);
  color += causticColor * causticsIntensity;

  // god rays from surface
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float rayX = (fi / 8.0 - 0.5) * aspect * 1.5;
    rayX += sin(t * 0.2 + fi) * 0.1;

    vec2 rayDir = normalize(vec2(rayX, 1.0) - st);
    float rayDist = abs(st.x - rayX - (1.0 - st.y) * rayX * 0.5);

    float ray = exp(-rayDist * 15.0);
    ray *= smoothstep(0.3, 1.0, uv.y); // fade toward bottom
    ray *= 0.5 + fbm(vec2(st.y * 5.0 - t, fi)) * 0.5; // shimmer

    color += vec3(0.05, 0.15, 0.2) * ray * 0.2;
  }

  // murk and particles
  float murk = fbm(st * 3.0 + t * 0.1);
  color = mix(color, midColor, murk * 0.3);

  // floating particles - marine snow
  for (int i = 0; i < 60; i++) {
    float fi = float(i);

    // particle position - slow drift upward
    vec2 particlePos = vec2(
      hash(vec2(fi, 0.0)) - 0.5,
      mod(hash(vec2(fi, 1.0)) + t * 0.02 * (0.5 + hash(vec2(fi, 2.0))), 1.0) - 0.5
    ) * vec2(aspect, 1.0) * 1.2;

    // drift with current
    particlePos.x += sin(t * 0.5 + fi * 0.3) * 0.02;
    particlePos.y += cos(t * 0.3 + fi * 0.5) * 0.01;

    float dist = length(st - particlePos);

    // vary size
    float size = 0.002 + hash(vec2(fi, 3.0)) * 0.004;
    float particle = smoothstep(size, size * 0.3, dist);

    // depth fade - particles in "front" are brighter
    float pDepth = hash(vec2(fi, 4.0));
    float brightness = 0.3 + pDepth * 0.7;

    color += vec3(0.15, 0.25, 0.3) * particle * brightness * 0.5;
  }

  // larger debris drifting
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 debrisPos = vec2(
      mod(hash(vec2(fi, 10.0)) + t * 0.01 * (hash(vec2(fi, 11.0)) - 0.5), 1.0) - 0.5,
      mod(hash(vec2(fi, 12.0)) + t * 0.015, 1.0) - 0.5
    ) * vec2(aspect, 1.0);

    debrisPos += vec2(
      sin(t * 0.4 + fi) * 0.03,
      cos(t * 0.3 + fi * 1.3) * 0.02
    );

    float dist = length(st - debrisPos);
    float debris = smoothstep(0.015, 0.005, dist);

    // elongated shape
    vec2 diff = st - debrisPos;
    float angle = t * 0.2 + fi;
    diff = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * diff;
    float elongated = smoothstep(0.02, 0.005, abs(diff.x)) * smoothstep(0.008, 0.002, abs(diff.y));

    color += vec3(0.05, 0.1, 0.12) * max(debris, elongated) * 0.4;
  }

  // bubbles - rare, rising
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float bubbleX = (hash(vec2(fi, 20.0)) - 0.5) * aspect;
    float bubbleY = mod(t * 0.08 * (0.8 + hash(vec2(fi, 21.0)) * 0.4) + hash(vec2(fi, 22.0)), 1.5) - 0.7;

    bubbleX += sin(bubbleY * 8.0 + fi) * 0.02; // wobble

    vec2 bubblePos = vec2(bubbleX, bubbleY);
    float dist = length(st - bubblePos);

    float size = 0.008 + hash(vec2(fi, 23.0)) * 0.012;
    float bubble = smoothstep(size, size * 0.7, dist);
    float highlight = smoothstep(size * 0.5, size * 0.2, length(st - bubblePos - vec2(0.003, 0.003)));

    color += vec3(0.1, 0.2, 0.25) * bubble * 0.3;
    color += vec3(0.2, 0.35, 0.4) * highlight * bubble * 0.4;
  }

  // depth pressure vignette - darkness closing in
  float vig = 1.0 - length(st) * 0.9;
  vig = pow(max(vig, 0.0), 1.5);
  color *= vig;

  // blue color grade
  color = pow(color, vec3(1.1, 1.0, 0.95));

  // subtle noise
  float grain = (hash(uv * 500.0 + t * 50.0) - 0.5) * 0.02;
  color += grain;

  fragColor = vec4(color, 1.0);
}`,
};
