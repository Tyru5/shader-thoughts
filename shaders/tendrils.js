export const tendrils = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

#define PI 3.14159265359
#define NUM_LINES 16

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

// smooth line with glow
float line(float d, float width) {
  return smoothstep(width, 0.0, abs(d)) +
         smoothstep(width * 4.0, 0.0, abs(d)) * 0.3;
}

// traveling node along line
float node(vec2 uv, float lineY, float t, float speed, float seed) {
  float nodeX = mod(t * speed + seed * 10.0, 3.0) - 1.5;
  float d = length(uv - vec2(nodeX, lineY));
  return smoothstep(0.04, 0.0, d) + smoothstep(0.12, 0.0, d) * 0.4;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float t = u_time;

  // background gradient - deep purple to blue
  vec3 bg1 = vec3(0.06, 0.04, 0.15);
  vec3 bg2 = vec3(0.15, 0.05, 0.25);
  vec3 col = mix(bg1, bg2, v_uv.y + sin(t * 0.2) * 0.1);

  // coordinate warp
  vec2 wuv = uv;
  wuv.x += sin(uv.y * 3.0 + t * 0.5) * 0.08;
  wuv.y += sin(uv.x * 2.0 + t * 0.3) * 0.05;

  float totalLine = 0.0;
  float totalNode = 0.0;

  for(int i = 0; i < NUM_LINES; i++) {
    float fi = float(i);
    float seed = hash(fi * 127.1);

    // base Y position spread across screen
    float baseY = (fi / float(NUM_LINES) - 0.5) * 1.8;

    // wave parameters unique per line
    float freq1 = 2.0 + seed * 3.0;
    float freq2 = 4.0 + hash(fi * 31.7) * 4.0;
    float amp1 = 0.08 + seed * 0.12;
    float amp2 = 0.03 + hash(fi * 71.3) * 0.05;
    float phase = seed * PI * 2.0;
    float speed = 0.3 + hash(fi * 91.1) * 0.5;

    // compute wavy Y
    float wave = sin(wuv.x * freq1 + t * speed + phase) * amp1;
    wave += sin(wuv.x * freq2 - t * speed * 1.3 + phase * 2.0) * amp2;
    float lineY = baseY + wave;

    // distance to line
    float d = wuv.y - lineY;

    // vary width
    float width = 0.003 + hash(fi * 51.3) * 0.004;
    width *= 1.0 + sin(wuv.x * 5.0 + t + fi) * 0.3;

    totalLine += line(d, width);

    // nodes traveling along lines
    float nodeSpeed = 0.2 + hash(fi * 111.1) * 0.3;
    totalNode += node(wuv, lineY, t, nodeSpeed, seed) * 0.6;
  }

  // line color - vibrant purple/magenta
  vec3 lineCol = vec3(0.5, 0.2, 0.9);
  vec3 lineCol2 = vec3(0.9, 0.3, 0.7);
  vec3 lineMix = mix(lineCol, lineCol2, sin(t * 0.5) * 0.5 + 0.5);

  // node color - bright cyan/white
  vec3 nodeCol = vec3(0.6, 0.9, 1.0);

  col += lineMix * totalLine * 0.7;
  col += nodeCol * totalNode;

  // center glow
  float centerGlow = exp(-length(uv) * 2.5) * 0.15;
  col += centerGlow * vec3(0.4, 0.2, 0.6);

  // edge fade
  vec2 edge = smoothstep(vec2(0.0), vec2(0.15), v_uv) *
              smoothstep(vec2(0.0), vec2(0.15), 1.0 - v_uv);
  col *= edge.x * edge.y * 0.7 + 0.3;

  // subtle scanlines
  col *= 0.97 + 0.03 * sin(gl_FragCoord.y * 1.5);

  // tonemap
  col = col / (0.8 + col);
  col = pow(col, vec3(0.45));

  fragColor = vec4(col, 1.0);
}`
};
