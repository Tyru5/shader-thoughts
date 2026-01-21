export const simulation = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// the pattern that repeats at every scale
float pattern(vec2 p, float t) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  // grid cells
  float grid = smoothstep(0.02, 0.0, abs(f.x - 0.5) - 0.48);
  grid += smoothstep(0.02, 0.0, abs(f.y - 0.5) - 0.48);

  // each cell has a "state"
  float state = hash(i + floor(t * 0.5));

  // some cells "flicker" - simulation updating
  float flicker = step(0.97, hash(i + floor(t * 8.0)));

  // data streams in cells
  float data = 0.0;
  if (state > 0.7) {
    float stream = fract(f.y * 8.0 - t * 2.0 - hash(i) * 10.0);
    stream = smoothstep(0.1, 0.0, stream) * smoothstep(0.0, 0.05, f.x) * smoothstep(1.0, 0.95, f.x);
    data = stream * 0.5;
  }

  return grid * 0.3 + flicker * 0.8 + data;
}

void main() {
  vec2 uv = v_uv - 0.5;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  float t = u_time * 0.4;

  vec3 color = vec3(0.0);

  // infinite recursive zoom
  float totalPattern = 0.0;
  float zoom = 1.0;
  float zoomSpeed = t * 0.8;

  for (int i = 0; i < 12; i++) {
    float fi = float(i);

    // each layer zooms at different rate, creating infinite recursion
    float layerZoom = pow(2.0, fi - mod(zoomSpeed, 1.0) * 1.0);
    float layerAlpha = 1.0 - abs(mod(zoomSpeed, 1.0) - 0.5) * 2.0;
    layerAlpha = pow(layerAlpha, 0.5);

    // offset each layer slightly - nothing is perfectly aligned
    vec2 offset = vec2(
      sin(fi * 1.3 + t * 0.1) * 0.01,
      cos(fi * 1.7 + t * 0.1) * 0.01
    );

    vec2 p = (uv + offset) * layerZoom * 4.0;

    // slight rotation per layer - reality isn't quite right
    float rot = fi * 0.002 + sin(t * 0.1) * 0.01;
    p = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * p;

    float pat = pattern(p, t + fi * 0.5);

    // deeper layers are different colors
    vec3 layerColor = vec3(0.0, 0.8, 0.6); // cyan-green matrix color
    if (mod(fi, 3.0) < 1.0) layerColor = vec3(0.0, 0.6, 0.9);
    if (mod(fi, 3.0) > 1.5) layerColor = vec3(0.0, 0.9, 0.7);

    float depth = 1.0 / (1.0 + fi * 0.3);
    color += layerColor * pat * depth * 0.3;
  }

  // the deeper you look, the more you see the same thing
  // recursive frames showing "you" looking at the screen
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float frameZoom = pow(0.7, fi);
    vec2 frameUV = uv / frameZoom;

    // screen frame
    float frameX = smoothstep(0.0, 0.01, abs(frameUV.x) - 0.6 * aspect);
    float frameY = smoothstep(0.0, 0.01, abs(frameUV.y) - 0.4);
    float frame = max(frameX, frameY);
    frame *= smoothstep(0.7 * aspect, 0.65 * aspect, abs(frameUV.x));
    frame *= smoothstep(0.5, 0.45, abs(frameUV.y));

    float depth = pow(0.6, fi);
    vec3 frameColor = mix(vec3(0.1, 0.3, 0.2), vec3(0.0, 0.15, 0.1), fi / 8.0);

    color += frameColor * frame * depth;
  }

  // glitch tears - the simulation struggling
  float glitchY = floor(t * 15.0);
  float glitchLine = hash(vec2(glitchY, 1.0));
  if (abs(v_uv.y - glitchLine) < 0.01 && hash(vec2(glitchY, 2.0)) > 0.85) {
    color = 1.0 - color; // invert
    uv.x += 0.05;
  }

  // scanlines - we're being rendered
  float scan = sin(v_uv.y * u_resolution.y * 1.5) * 0.5 + 0.5;
  color *= 0.9 + scan * 0.1;

  // pixel grid - zoom in enough and you see we're discrete
  vec2 pixelGrid = fract(v_uv * u_resolution * 0.02);
  float pixels = smoothstep(0.1, 0.0, pixelGrid.x) + smoothstep(0.1, 0.0, pixelGrid.y);
  color += vec3(0.0, 0.1, 0.08) * pixels * 0.1;

  // numbers floating - the code underlying reality
  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    vec2 numPos = vec2(
      hash(vec2(fi, 0.0)) - 0.5,
      mod(hash(vec2(fi, 1.0)) - t * 0.1 * (0.5 + hash(vec2(fi, 2.0))), 1.0) - 0.5
    ) * vec2(aspect, 1.0) * 1.5;

    float dist = length(uv - numPos);
    float num = smoothstep(0.02, 0.01, dist);

    // numbers flicker in and out
    float visible = step(0.3, hash(vec2(fi, floor(t * 4.0))));
    color += vec3(0.0, 0.5, 0.3) * num * 0.3 * visible;
  }

  // central eye/void - something is watching the simulation
  float centerDist = length(uv);
  float eye = smoothstep(0.15, 0.1, centerDist);
  float pupil = smoothstep(0.06, 0.04, centerDist);
  float eyeRing = smoothstep(0.01, 0.0, abs(centerDist - 0.12));

  // pupil dilates
  float dilate = 0.05 + sin(t * 0.5) * 0.02;
  pupil = smoothstep(dilate + 0.02, dilate, centerDist);

  color = mix(color, vec3(0.02, 0.08, 0.06), eye * 0.7);
  color += vec3(0.0, 0.4, 0.3) * eyeRing;
  color = mix(color, vec3(0.0), pupil);

  // the eye "sees" - reflection of the pattern
  if (centerDist < 0.12 && centerDist > dilate) {
    vec2 eyeUV = uv / centerDist * 0.05;
    float reflection = pattern(eyeUV * 20.0 - t, t);
    color += vec3(0.0, 0.3, 0.2) * reflection * 0.3;
  }

  // vignette - edges of perception
  float vig = 1.0 - pow(centerDist * 1.2, 2.0);
  color *= max(vig, 0.0);

  // overall color grade - sickly digital green
  color = pow(color, vec3(1.0, 0.9, 1.1));

  // final flicker - reality stuttering
  float stutter = 0.95 + hash(vec2(floor(t * 30.0), 0.0)) * 0.1;
  color *= stutter;

  // rare full reset flash
  if (hash(vec2(floor(t * 0.5), 100.0)) > 0.995) {
    color = vec3(1.0);
  }

  fragColor = vec4(color, 1.0);
}`,
};
