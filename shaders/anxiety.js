export const anxiety = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  float t = u_time;
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;

  // SHAKE - constant micro tremor + random violent jerks
  float shake = hash(floor(t * 60.0));
  vec2 shakeOffset = vec2(
    (hash(floor(t * 45.0)) - 0.5) * 0.02,
    (hash(floor(t * 47.0) + 5.0) - 0.5) * 0.02
  );
  // violent jerk
  if (shake > 0.92) {
    shakeOffset += vec2(
      (hash(floor(t * 20.0)) - 0.5) * 0.15,
      (hash(floor(t * 20.0) + 10.0) - 0.5) * 0.15
    );
  }
  uv += shakeOffset;

  vec2 st = (uv - 0.5) * vec2(aspect, 1.0);
  float dist = length(st);

  // AGGRESSIVE GLITCH BLOCKS
  float blockY = floor(uv.y * 25.0);
  float blockTime = floor(t * 25.0);
  float glitchBlock = hash(blockY + blockTime * 7.0);
  if (glitchBlock > 0.85) {
    uv.x += (hash(blockY + blockTime) - 0.5) * 0.4;
    uv.y += (hash(blockY + blockTime + 1.0) - 0.5) * 0.1;
  }

  // SCREEN TEAR
  float tearLine = hash(floor(t * 35.0));
  float tearY = hash(floor(t * 35.0) + 3.0);
  if (tearLine > 0.7 && abs(uv.y - tearY) < 0.08) {
    uv.x += 0.3 * sign(hash(floor(t * 35.0) + 5.0) - 0.5);
  }

  // PULSING - way too fast heartbeat
  float pulse = 0.0;
  pulse += pow(abs(sin(t * 12.0)), 15.0);
  pulse += pow(abs(sin(t * 12.0 + 0.1)), 20.0) * 0.6;
  pulse += pow(abs(sin(t * 17.0)), 10.0) * 0.4; // arrhythmia

  // TUNNEL CLOSING IN FAST
  float tunnelPulse = 0.25 + pulse * 0.2 + sin(t * 8.0) * 0.1;
  float tunnel = smoothstep(tunnelPulse, tunnelPulse + 0.15, dist);

  // UGLY COLORS - clashing, sickly
  vec3 color = vec3(0.0);

  // background - shifts between sickly greens and angry reds
  float colorShift = sin(t * 3.0) * 0.5 + 0.5;
  vec3 bg1 = vec3(0.2, 0.05, 0.0);  // dried blood
  vec3 bg2 = vec3(0.05, 0.15, 0.02); // sickly green
  color = mix(bg1, bg2, colorShift + hash(floor(t * 10.0)) * 0.3);

  // STATIC - aggressive
  float static1 = hash2(uv * 800.0 + t * 200.0);
  float static2 = hash2(uv * 400.0 - t * 150.0);
  float staticMix = static1 * static2;
  color += vec3(staticMix) * (0.2 + pulse * 0.3);

  // RGB SPLIT - severe
  float split = 0.02 + pulse * 0.03 + hash(floor(t * 15.0)) * 0.02;
  vec3 rgbSplit;
  rgbSplit.r = hash2((uv + vec2(split, 0.0)) * 600.0 + t * 100.0);
  rgbSplit.g = hash2(uv * 600.0 + t * 100.0);
  rgbSplit.b = hash2((uv - vec2(split, 0.0)) * 600.0 + t * 100.0);
  color += rgbSplit * 0.15;

  // WATCHING EYES - more of them, closer, wrong
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float eyeAngle = fi * 0.524 + sin(t * 4.0 + fi * 2.0) * 0.8;
    float eyeDist = 0.2 + sin(t * 3.0 + fi) * 0.15;

    // eyes drift toward center sometimes
    eyeDist -= pulse * 0.1;

    vec2 eyePos = vec2(cos(eyeAngle), sin(eyeAngle)) * eyeDist;

    // eye shape - dilated, wrong
    float eyeSize = 0.04 + sin(t * 6.0 + fi) * 0.015;
    float eye = smoothstep(eyeSize, eyeSize * 0.5, length(st - eyePos));

    // huge dilated pupil
    float pupilSize = eyeSize * (0.7 + pulse * 0.3);
    float pupil = smoothstep(pupilSize, pupilSize * 0.3, length(st - eyePos));

    // pupil looks at you - tracks center
    vec2 pupilOffset = -normalize(eyePos) * 0.01;
    float pupilTrack = smoothstep(pupilSize * 0.8, pupilSize * 0.2, length(st - eyePos - pupilOffset));

    float eyeFinal = eye * 0.7 + pupilTrack * 0.5;

    // bloodshot
    vec3 eyeColor = vec3(0.9, 0.8, 0.6) * eye;
    eyeColor += vec3(0.6, 0.1, 0.0) * pupil;
    eyeColor -= vec3(0.0, 0.2, 0.2) * pupilTrack;

    // random blink but mostly open
    float blink = step(0.15, hash(floor(t * 8.0) + fi));
    color += eyeColor * blink * (0.6 + pulse * 0.4);
  }

  // SCAN LINES - jittery
  float scanline = sin(uv.y * 400.0 + t * 50.0) * 0.5 + 0.5;
  scanline = pow(scanline, 0.5);
  color *= 0.85 + scanline * 0.15;

  // FLICKER - aggressive
  float flicker = 0.7 + hash(floor(t * 40.0)) * 0.5;
  color *= flicker;

  // FLASH - more frequent, harsh
  float flash = step(0.9, hash(floor(t * 12.0)));
  color = mix(color, vec3(1.0, 0.95, 0.8), flash * 0.7);

  // negative flash
  float negFlash = step(0.95, hash(floor(t * 15.0) + 50.0));
  if (negFlash > 0.0) {
    color = vec3(1.0) - color;
  }

  // VIGNETTE - crushing, pulsing
  float vig = 1.0 - dist * (1.8 + pulse * 0.8);
  vig = max(vig, 0.0);
  vig = pow(vig, 2.0);
  color *= vig;

  // tunnel darkness
  color = mix(color, vec3(0.01, 0.0, 0.0), tunnel * 0.9);

  // DESATURATION FLICKER - makes it feel wrong
  float desat = step(0.85, hash(floor(t * 18.0) + 100.0));
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(color, vec3(gray), desat * 0.7);

  // final contrast push
  color = pow(color, vec3(1.1));

  fragColor = vec4(color, 1.0);
}`
};
