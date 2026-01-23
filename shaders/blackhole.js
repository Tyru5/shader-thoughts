export const blackhole = {
  resolutionScale: 0.5,
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265

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

void main() {
  vec2 uv = v_uv - 0.5;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  float t = u_time * 0.4;

  // distance and angle from center
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  // gravitational pull - warp increases near center
  float warp = 1.0 / (dist * 8.0 + 0.3);
  float spiral = angle + warp * 2.0 + t * 0.5;

  // event horizon
  float horizon = smoothstep(0.08, 0.12, dist);

  // accretion disk
  vec2 diskUV = vec2(spiral * 3.0, dist * 10.0 - t * 2.0);
  float disk = fbm(diskUV * 2.0);
  disk *= smoothstep(0.08, 0.15, dist);
  disk *= smoothstep(0.6, 0.2, dist);

  // disk color - hot inner, cooler outer
  vec3 innerColor = vec3(1.0, 0.6, 0.2);
  vec3 midColor = vec3(0.8, 0.3, 0.1);
  vec3 outerColor = vec3(0.3, 0.1, 0.4);

  float colorMix = smoothstep(0.1, 0.5, dist);
  vec3 diskColor = mix(innerColor, midColor, colorMix);
  diskColor = mix(diskColor, outerColor, smoothstep(0.3, 0.55, dist));

  // swirling streams in disk
  float streams = sin(spiral * 8.0 + dist * 20.0 - t * 3.0) * 0.5 + 0.5;
  streams *= smoothstep(0.5, 0.15, dist) * smoothstep(0.08, 0.12, dist);

  // stars being pulled in
  vec3 starColor = vec3(0.0);
  for (int i = 0; i < 80; i++) {
    float fi = float(i);
    float starAngle = hash(vec2(fi, 0.0)) * PI * 2.0;
    float starSpeed = 0.1 + hash(vec2(fi, 1.0)) * 0.3;
    float starDist = mod(hash(vec2(fi, 2.0)) + t * starSpeed, 1.0);
    starDist = pow(starDist, 0.5) * 0.8;

    // spiral inward
    float inwardSpiral = starAngle + (1.0 - starDist) * 4.0 + t * 0.2;

    vec2 starPos = vec2(cos(inwardSpiral), sin(inwardSpiral)) * starDist;
    float starSize = 0.003 + (1.0 - starDist) * 0.004;
    float star = smoothstep(starSize, 0.0, length(uv - starPos));

    // stretch stars as they fall in
    float stretch = 1.0 + (1.0 - starDist) * 3.0;
    vec2 stretchDir = normalize(starPos);
    vec2 stretchedUV = uv - starPos;
    stretchedUV = vec2(
      dot(stretchedUV, stretchDir) / stretch,
      dot(stretchedUV, vec2(-stretchDir.y, stretchDir.x))
    );
    star = max(star, smoothstep(starSize * 2.0, 0.0, length(stretchedUV)) * (1.0 - starDist));

    // brighter as they approach
    float brightness = 0.3 + (1.0 - starDist) * 0.7;
    vec3 sCol = mix(vec3(0.8, 0.9, 1.0), vec3(1.0, 0.7, 0.4), 1.0 - starDist);
    starColor += sCol * star * brightness;
  }

  // background stars (distant)
  for (int i = 0; i < 100; i++) {
    float fi = float(i);
    vec2 starPos = vec2(
      hash(vec2(fi * 1.3, 7.0)) - 0.5,
      hash(vec2(fi * 1.7, 13.0)) - 0.5
    ) * vec2(aspect, 1.0) * 1.2;

    // gravitational lensing distortion
    vec2 toCenter = -starPos;
    float starDistToCenter = length(starPos);
    float lensing = 0.1 / (starDistToCenter + 0.2);
    starPos += normalize(toCenter) * lensing * 0.05;

    float star = smoothstep(0.003, 0.0, length(uv - starPos));
    float twinkle = sin(t * (1.0 + hash(vec2(fi, 99.0)) * 2.0) + fi) * 0.3 + 0.7;
    starColor += vec3(0.6, 0.7, 0.9) * star * twinkle * 0.5;
  }

  // photon ring (bright ring at event horizon edge)
  float photonRing = smoothstep(0.01, 0.0, abs(dist - 0.1));
  photonRing *= 0.8;

  // combine
  vec3 color = vec3(0.0);
  color += diskColor * disk * 1.5;
  color += diskColor * streams * 0.6;
  color += vec3(1.0, 0.8, 0.5) * photonRing;
  color += starColor;

  // darken center (event horizon)
  color *= horizon;

  // subtle glow around black hole
  float glow = exp(-dist * 5.0) * 0.15;
  color += vec3(0.4, 0.2, 0.1) * glow * horizon;

  // vignette
  float vig = 1.0 - smoothstep(0.3, 0.9, dist);
  color *= 0.7 + vig * 0.3;

  fragColor = vec4(color, 1.0);
}`,
};
