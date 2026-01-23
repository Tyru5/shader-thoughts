export const tesseract = {
  resolutionScale: 0.75,
  fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

// 4D rotation matrices
vec4 rotateXW(vec4 p, float a) {
  float c = cos(a), s = sin(a);
  return vec4(c * p.x - s * p.w, p.y, p.z, s * p.x + c * p.w);
}

vec4 rotateYW(vec4 p, float a) {
  float c = cos(a), s = sin(a);
  return vec4(p.x, c * p.y - s * p.w, p.z, s * p.y + c * p.w);
}

vec4 rotateZW(vec4 p, float a) {
  float c = cos(a), s = sin(a);
  return vec4(p.x, p.y, c * p.z - s * p.w, s * p.z + c * p.w);
}

vec4 rotateXY(vec4 p, float a) {
  float c = cos(a), s = sin(a);
  return vec4(c * p.x - s * p.y, s * p.x + c * p.y, p.z, p.w);
}

vec4 rotateXZ(vec4 p, float a) {
  float c = cos(a), s = sin(a);
  return vec4(c * p.x - s * p.z, p.y, s * p.x + c * p.z, p.w);
}

vec4 rotateYZ(vec4 p, float a) {
  float c = cos(a), s = sin(a);
  return vec4(p.x, c * p.y - s * p.z, s * p.y + c * p.z, p.w);
}

// project 4D to 3D (perspective)
vec3 project4Dto3D(vec4 p, float w) {
  float scale = 1.0 / (w - p.w);
  return p.xyz * scale;
}

// project 3D to 2D (perspective)
vec2 project3Dto2D(vec3 p, float z) {
  float scale = 1.0 / (z - p.z);
  return p.xy * scale;
}

// distance to line segment
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 uv = v_uv - 0.5;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  float t = u_time * 0.3;

  // 16 vertices of a tesseract (4D hypercube)
  vec4 verts[16];
  int idx = 0;
  for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2; j++) {
      for (int k = 0; k < 2; k++) {
        for (int l = 0; l < 2; l++) {
          verts[idx++] = vec4(
            float(i) * 2.0 - 1.0,
            float(j) * 2.0 - 1.0,
            float(k) * 2.0 - 1.0,
            float(l) * 2.0 - 1.0
          ) * 0.4;
        }
      }
    }
  }

  // rotate in 4D
  for (int i = 0; i < 16; i++) {
    verts[i] = rotateXW(verts[i], t);
    verts[i] = rotateYW(verts[i], t * 0.7);
    verts[i] = rotateZW(verts[i], t * 0.5);
    verts[i] = rotateXY(verts[i], t * 0.3);
    verts[i] = rotateYZ(verts[i], t * 0.4);
  }

  // project to 2D
  vec2 proj[16];
  float depths[16];
  for (int i = 0; i < 16; i++) {
    vec3 p3 = project4Dto3D(verts[i], 2.0);
    proj[i] = project3Dto2D(p3, 3.0);
    depths[i] = verts[i].w + verts[i].z * 0.5;
  }

  // 32 edges of tesseract - connect vertices that differ by one coordinate
  int edges[64];
  edges[0]=0;edges[1]=1; edges[2]=0;edges[3]=2; edges[4]=0;edges[5]=4; edges[6]=0;edges[7]=8;
  edges[8]=1;edges[9]=3; edges[10]=1;edges[11]=5; edges[12]=1;edges[13]=9;
  edges[14]=2;edges[15]=3; edges[16]=2;edges[17]=6; edges[18]=2;edges[19]=10;
  edges[20]=3;edges[21]=7; edges[22]=3;edges[23]=11;
  edges[24]=4;edges[25]=5; edges[26]=4;edges[27]=6; edges[28]=4;edges[29]=12;
  edges[30]=5;edges[31]=7; edges[32]=5;edges[33]=13;
  edges[34]=6;edges[35]=7; edges[36]=6;edges[37]=14;
  edges[38]=7;edges[39]=15;
  edges[40]=8;edges[41]=9; edges[42]=8;edges[43]=10; edges[44]=8;edges[45]=12;
  edges[46]=9;edges[47]=11; edges[48]=9;edges[49]=13;
  edges[50]=10;edges[51]=11; edges[52]=10;edges[53]=14;
  edges[54]=11;edges[55]=15;
  edges[56]=12;edges[57]=13; edges[58]=12;edges[59]=14;
  edges[60]=13;edges[61]=15;
  edges[62]=14;edges[63]=15;

  vec3 color = vec3(0.02, 0.02, 0.04);

  // draw edges
  for (int i = 0; i < 32; i++) {
    int a = edges[i * 2];
    int b = edges[i * 2 + 1];

    float d = sdSegment(uv, proj[a], proj[b]);

    float avgDepth = (depths[a] + depths[b]) * 0.5;
    float depthFactor = 0.5 + avgDepth * 0.5;

    // edge glow
    float edge = exp(-d * 80.0) * depthFactor;
    float core = smoothstep(0.004, 0.001, d) * depthFactor;

    // color based on depth in 4D
    vec3 edgeColor = mix(
      vec3(0.2, 0.5, 1.0),
      vec3(1.0, 0.6, 0.2),
      depthFactor
    );

    color += edgeColor * edge * 0.4;
    color += vec3(1.0, 0.95, 0.9) * core * 0.8;
  }

  // draw vertices
  for (int i = 0; i < 16; i++) {
    float d = length(uv - proj[i]);
    float depthFactor = 0.5 + depths[i] * 0.5;

    float vert = exp(-d * 120.0) * depthFactor;
    float vertCore = smoothstep(0.012, 0.006, d) * depthFactor;

    vec3 vertColor = mix(vec3(0.3, 0.6, 1.0), vec3(1.0, 0.7, 0.3), depthFactor);
    color += vertColor * vert * 0.5;
    color += vec3(1.0) * vertCore * 0.6;
  }

  // subtle vignette
  float vig = 1.0 - length(uv) * 0.5;
  color *= vig;

  fragColor = vec4(color, 1.0);
}`,
};
