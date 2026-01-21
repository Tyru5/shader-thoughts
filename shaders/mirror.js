export const mirror = {
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// rounded box sdf
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 uv = v_uv - 0.5;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  float t = u_time;

  // room color - dim, unsettling
  vec3 color = vec3(0.04, 0.035, 0.045);

  // mirror frame
  vec2 mirrorSize = vec2(0.35, 0.45);
  float mirrorDist = sdRoundBox(uv, mirrorSize, 0.02);

  // ornate frame
  float frameDist = sdRoundBox(uv, mirrorSize + 0.04, 0.03);
  float frame = smoothstep(0.02, 0.0, frameDist) - smoothstep(0.02, 0.0, mirrorDist);

  // frame color - old dark wood
  vec3 frameColor = vec3(0.12, 0.07, 0.04);
  // frame detail
  float frameDetail = sin(atan(uv.y, uv.x) * 30.0) * 0.5 + 0.5;
  frameColor *= 0.8 + frameDetail * 0.4;

  color = mix(color, frameColor, frame);

  // inside mirror
  if (mirrorDist < 0.0) {
    // mirror surface - slightly desaturated, cold
    vec3 mirrorBg = vec3(0.08, 0.08, 0.1);

    // subtle reflection of room behind viewer
    float roomReflect = smoothstep(0.4, -0.2, uv.y) * 0.3;
    mirrorBg += vec3(0.02, 0.015, 0.01) * roomReflect;

    // THE SILHOUETTE
    vec2 silUV = uv;

    // subtle breathing movement
    float breath = sin(t * 0.8) * 0.008;
    silUV.x *= 1.0 + breath;

    // slight sway
    silUV.x += sin(t * 0.3) * 0.005;

    // head
    vec2 headCenter = vec2(0.0, 0.18);
    float headRadius = 0.09;
    float head = length(silUV - headCenter) - headRadius;

    // neck
    vec2 neckCenter = vec2(0.0, 0.08);
    float neck = sdRoundBox(silUV - neckCenter, vec2(0.035, 0.05), 0.02);

    // shoulders/torso
    vec2 torsoCenter = vec2(0.0, -0.15);
    float torso = sdRoundBox(silUV - torsoCenter, vec2(0.18 + breath * 2.0, 0.25), 0.08);

    // arms hint
    vec2 leftArm = vec2(-0.22, -0.05);
    vec2 rightArm = vec2(0.22, -0.05);
    float armL = sdRoundBox(silUV - leftArm, vec2(0.045, 0.18), 0.03);
    float armR = sdRoundBox(silUV - rightArm, vec2(0.045, 0.18), 0.03);

    // combine silhouette
    float silhouette = head;
    silhouette = min(silhouette, neck);
    silhouette = min(silhouette, torso);
    silhouette = min(silhouette, armL);
    silhouette = min(silhouette, armR);

    // silhouette is pure black void
    float silMask = smoothstep(0.01, -0.01, silhouette);

    // the figure is DARK - darker than dark
    vec3 silColor = vec3(0.0);

    // subtle edge - just barely visible outline
    float silEdge = smoothstep(0.02, 0.0, abs(silhouette)) * 0.15;
    vec3 edgeColor = vec3(0.05, 0.05, 0.07);

    // eyes - or where eyes should be - just slightly less dark
    // they don't reflect light, they absorb it
    vec2 leftEye = vec2(-0.03, 0.2);
    vec2 rightEye = vec2(0.03, 0.2);
    float eyeL = smoothstep(0.015, 0.005, length(silUV - leftEye));
    float eyeR = smoothstep(0.015, 0.005, length(silUV - rightEye));
    float eyes = eyeL + eyeR;

    // eyes occasionally "blink" - or look away
    float blink = step(0.92, hash(vec2(floor(t * 0.5), 0.0)));
    eyes *= (1.0 - blink);

    // eyes are slightly visible but wrong
    vec3 eyeColor = vec3(0.02, 0.015, 0.02);

    // mirror reflection
    color = mirrorBg;
    color += edgeColor * silEdge;
    color = mix(color, silColor, silMask);
    color += eyeColor * eyes * silMask;

    // mirror imperfections - old, warped
    float warp = hash(uv * 50.0 + floor(t * 0.1)) * 0.02;
    color += warp;

    // dust on mirror
    float dust = hash(uv * 200.0);
    dust = pow(dust, 8.0) * 0.1;
    color += dust;

    // mirror edge darkening
    float mirrorVig = smoothstep(0.0, -0.3, mirrorDist);
    color *= 0.7 + mirrorVig * 0.3;

    // cold reflection tint
    color = mix(color, color * vec3(0.9, 0.95, 1.1), 0.3);

    // something wrong - reflection occasionally shifts
    float wrongness = step(0.98, hash(vec2(floor(t * 2.0), 1.0)));
    if (wrongness > 0.0) {
      // head tilts when you're not
      float tilt = 0.1;
      vec2 tiltedUV = silUV;
      tiltedUV = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * tiltedUV;
      float tiltedHead = length(tiltedUV - headCenter) - headRadius;
      float tiltMask = smoothstep(0.01, -0.01, tiltedHead);
      color = mix(color, vec3(0.0), tiltMask * 0.5);
    }
  }

  // light source behind viewer - faint
  float lightDist = length(uv - vec2(0.0, 0.5));
  float light = exp(-lightDist * 3.0) * 0.1;
  color += vec3(0.1, 0.08, 0.06) * light;

  // room vignette
  float vig = 1.0 - length(uv) * 0.8;
  color *= max(vig, 0.0);

  // film grain
  float grain = (hash(uv * 500.0 + t * 100.0) - 0.5) * 0.04;
  color += grain;

  // overall darkness
  color *= 0.9;

  fragColor = vec4(color, 1.0);
}`,
};
