/**
 * Photorealistic Earth shaders — day/night blend, ocean specular,
 * dual-layer atmospheric Fresnel glow (cyan rim like NASA footage).
 */

export const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vPositionW;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

export const earthFragmentShader = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uSpecularMap;
  uniform vec3 uSunDir;
  uniform float uNightBoost;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 sunDir = normalize(uSunDir);

    float NdotL = dot(normal, sunDir);
    // Soft, wide terminator — most of the visible disc reads as bright daylight
    float dayMix = smoothstep(-0.35, 0.55, NdotL);

    vec3 dayCol = texture2D(uDayMap, vUv).rgb;
    // Lift & gently saturate the day texture for a vivid "blue marble" look
    dayCol = pow(dayCol, vec3(0.92)) * 1.18;
    vec3 nightCol = texture2D(uNightMap, vUv).rgb * uNightBoost;
    vec3 color = mix(nightCol, dayCol, dayMix);

    // Ocean specular highlight (tight, subtle glint)
    float specMask = texture2D(uSpecularMap, vUv).r;
    vec3 halfDir = normalize(sunDir + vViewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 110.0) * specMask * dayMix;
    color += spec * vec3(0.9, 0.95, 1.0) * 0.4;

    // Soft daylight ambient so nothing crushes to black
    color += dayCol * 0.07;

    // Bluish atmospheric scattering toward the lit limb
    float fresnel = pow(1.0 - max(dot(normal, vViewDir), 0.0), 3.0);
    color += vec3(0.10, 0.28, 0.45) * fresnel * dayMix * 0.6;

    // Gentle limb darkening for depth
    color *= 1.0 - fresnel * 0.18;

    gl_FragColor = vec4(color, 1.0);
  }
`

export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

export const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColorInner;
  uniform vec3 uColorOuter;
  uniform float uIntensity;
  uniform float uPower;

  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    float viewDot = max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0);
    float fresnel = pow(1.0 - viewDot, uPower);
    vec3 col = mix(uColorInner, uColorOuter, pow(fresnel, 0.55));
    float alpha = fresnel * uIntensity;
    gl_FragColor = vec4(col, alpha);
  }
`

/** Soft procedural nebula behind the globe */
export const nebulaVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const nebulaFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    vec2 p = uv * 3.2;

    float n1 = fbm(p + vec2(uTime * 0.015, uTime * 0.008));
    float n2 = fbm(p * 1.6 - vec2(uTime * 0.01, -uTime * 0.012) + n1 * 0.45);

    float d = length(uv);
    float core = smoothstep(0.78, 0.0, d);
    float alpha = core * (n2 * 0.95);

    vec3 col = mix(uColorA, uColorB, n1 * 1.1 + 0.1);
    // Add glowing gas highlights
    col += vec3(0.08, 0.35, 0.45) * n2 * 0.55;

    gl_FragColor = vec4(col, max(alpha * 0.22, 0.0));
  }
`

