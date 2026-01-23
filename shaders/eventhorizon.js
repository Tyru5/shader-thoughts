export const eventhorizon = {
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

void main() {
  vec2 uv = v_uv - 0.5;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  float t = u_time * 0.2;

  // approach speed - accelerating toward horizon
  float approach = 1.0 - exp(-t * 0.1);
  approach = min(approach, 0.95);

  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  // event horizon radius - grows as we approach
  float horizonRadius = 0.05 + approach * 0.4;

  // gravitational lensing - space bends toward center
  float lensing = 1.0 / (dist * 4.0 + 0.1);
  lensing *= approach;

  // distorted coordinates
  vec2 lensedUV = uv;
  lensedUV *= 1.0 - lensing * 0.5;

  // spiral into the void
  float spiralAngle = angle + lensing * 3.0 + t * (0.5 + approach);
  lensedUV = vec2(cos(spiralAngle), sin(spiralAngle)) * length(lensedUV);

  vec3 color = vec3(0.0);

  // stars being stretched and pulled in
  for (int i = 0; i < 100; i++) {
    float fi = float(i);

    float starAngle = hash(vec2(fi, 0.0)) * PI * 2.0;
    float starDist = 0.2 + hash(vec2(fi, 1.0)) * 0.8;

    // stars spiral inward over time
    float fallSpeed = 0.05 + hash(vec2(fi, 2.0)) * 0.1;
    starDist -= mod(t * fallSpeed + hash(vec2(fi, 3.0)), 1.0) * approach * 0.5;

    // gravitational spiral
    starAngle += (1.0 / (starDist + 0.1)) * approach * 2.0;

    vec2 starPos = vec2(cos(starAngle), sin(starAngle)) * starDist;

    // spaghettification - stars stretch radially
    vec2 toCenter = normalize(-starPos);
    float stretch = 1.0 + (1.0 - starDist) * approach * 10.0;

    vec2 diff = uv - starPos;
    float radialDist = abs(dot(diff, toCenter));
    float tangentDist = abs(dot(diff, vec2(-toCenter.y, toCenter.x)));

    float star = smoothstep(0.008 * stretch, 0.0, radialDist) *
                 smoothstep(0.003, 0.0, tangentDist);

    // doppler shift - blue approaching, red receding
    float doppler = dot(normalize(starPos), vec2(0.0, -1.0)) * 0.5 + 0.5;
    vec3 starColor = mix(vec3(1.0, 0.4, 0.2), vec3(0.4, 0.6, 1.0), doppler);

    // intensity increases as they fall in
    float intensity = 0.5 + (1.0 - starDist) * 1.5;

    if (starDist > horizonRadius * 0.8) {
      color += starColor * star * intensity;
    }
  }

  // accretion disk - superheated matter
  float diskAngle = angle + t * 1.5;
  float diskNoise = noise(vec2(diskAngle * 3.0, dist * 10.0 - t * 2.0));

  float diskInner = horizonRadius * 1.5;
  float diskOuter = horizonRadius * 4.0;

  float disk = smoothstep(diskInner, diskInner + 0.05, dist) *
               smoothstep(diskOuter + 0.1, diskOuter - 0.1, dist);

  // disk spiral structure
  float spiral = sin(diskAngle * 4.0 + dist * 20.0 - t * 3.0) * 0.5 + 0.5;
  disk *= 0.5 + spiral * 0.5 + diskNoise * 0.3;

  // disk color - hot inner edge
  float diskTemp = 1.0 - smoothstep(diskInner, diskOuter, dist);
  vec3 diskColor = mix(vec3(1.0, 0.3, 0.1), vec3(1.0, 0.9, 0.7), diskTemp);
  diskColor = mix(diskColor, vec3(0.5, 0.2, 0.4), smoothstep(diskInner + 0.1, diskOuter, dist));

  color += diskColor * disk * (0.8 + approach * 0.5);

  // photon sphere - light orbiting the black hole
  float photonRadius = horizonRadius * 1.5;
  float photonRing = smoothstep(0.015, 0.0, abs(dist - photonRadius));
  photonRing *= 0.5 + sin(angle * 8.0 - t * 5.0) * 0.3;
  color += vec3(1.0, 0.95, 0.8) * photonRing * 1.5;

  // inner photon ring - last light
  float innerRing = smoothstep(0.01, 0.0, abs(dist - horizonRadius * 1.1));
  color += vec3(1.0, 0.8, 0.5) * innerRing * 2.0;

  // the void - event horizon
  float horizon = smoothstep(horizonRadius, horizonRadius - 0.02, dist);
  color = mix(color, vec3(0.0), horizon);

  // hawking radiation flicker at edge
  float hawking = smoothstep(0.02, 0.0, abs(dist - horizonRadius));
  hawking *= hash(vec2(angle * 10.0, floor(t * 30.0))) * 0.5;
  color += vec3(0.5, 0.6, 1.0) * hawking;

  // gravitational redshift - everything shifts red near horizon
  float redshift = smoothstep(horizonRadius * 3.0, horizonRadius, dist);
  color = mix(color, color * vec3(1.2, 0.7, 0.5), redshift * 0.6);

  // time dilation visual - frame dragging streaks
  float frameDrag = smoothstep(horizonRadius * 2.0, horizonRadius, dist);
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float streakAngle = fi * PI / 6.0 + t * 2.0;
    vec2 streakDir = vec2(cos(streakAngle), sin(streakAngle));

    float streak = pow(max(dot(normalize(uv), streakDir), 0.0), 20.0);
    streak *= frameDrag * smoothstep(horizonRadius, horizonRadius * 2.0, dist);

    color += vec3(0.3, 0.4, 0.6) * streak * 0.3;
  }

  // lens flare from accretion disk
  float flare = pow(max(1.0 - dist * 2.0, 0.0), 3.0);
  flare *= 0.3 + approach * 0.5;
  color += vec3(1.0, 0.6, 0.3) * flare * 0.2;

  // outer glow
  float outerGlow = exp(-dist * 2.0) * 0.2;
  color += vec3(0.3, 0.2, 0.4) * outerGlow;

  // chromatic aberration increases near horizon
  vec3 aberration = color;
  float aberrStr = redshift * 0.02;
  aberration.r = color.r * (1.0 + aberrStr);
  aberration.b = color.b * (1.0 - aberrStr);
  color = mix(color, aberration, 0.5);

  // vignette - peripheral vision darkening from g-forces
  float vig = 1.0 - pow(dist * 1.2, 2.0);
  color *= max(vig, 0.0);

  // intensity boost
  color *= 1.2;

  fragColor = vec4(color, 1.0);
}`,
};
