/**
 * Realistic sun shaders — turbulent plasma surface (warm) with limb glow,
 * plus a soft additive corona. Designed to bloom into a believable star.
 */

const NOISE = /* glsl */ `
  vec3 hash3(vec3 p){
    p = vec3(dot(p, vec3(127.1,311.7, 74.7)),
             dot(p, vec3(269.5,183.3,246.1)),
             dot(p, vec3(113.5,271.9,124.6)));
    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
  }
  float noise(vec3 p){
    vec3 i = floor(p); vec3 f = fract(p);
    vec3 u = f*f*(3.0-2.0*f);
    return mix(mix(mix(dot(hash3(i+vec3(0,0,0)), f-vec3(0,0,0)),
                       dot(hash3(i+vec3(1,0,0)), f-vec3(1,0,0)), u.x),
                   mix(dot(hash3(i+vec3(0,1,0)), f-vec3(0,1,0)),
                       dot(hash3(i+vec3(1,1,0)), f-vec3(1,1,0)), u.x), u.y),
               mix(mix(dot(hash3(i+vec3(0,0,1)), f-vec3(0,0,1)),
                       dot(hash3(i+vec3(1,0,1)), f-vec3(1,0,1)), u.x),
                   mix(dot(hash3(i+vec3(0,1,1)), f-vec3(0,1,1)),
                       dot(hash3(i+vec3(1,1,1)), f-vec3(1,1,1)), u.x), u.y), u.z);
  }
  float fbm(vec3 p){
    float v = 0.0; float a = 0.5;
    for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }
`

export const sunVertexShader = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main(){
    vPos = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

export const sunFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCore;   // hot core color
  uniform vec3 uMid;    // mid plasma
  uniform vec3 uEdge;   // cooler limb
  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  ${NOISE}

  void main(){
    vec3 p = normalize(vPos);
    // Layered, slowly evolving plasma turbulence
    float n = fbm(p * 3.2 + vec3(0.0, uTime*0.06, 0.0));
    n += 0.5 * fbm(p * 6.5 - vec3(uTime*0.05, 0.0, uTime*0.04));
    n = clamp(n*0.6 + 0.5, 0.0, 1.0);

    // Granulation / sunspots
    float spots = smoothstep(0.35, 0.0, fbm(p*9.0 + uTime*0.03));

    vec3 col = mix(uMid, uCore, smoothstep(0.45, 0.95, n));
    col = mix(col, uEdge, smoothstep(0.5, 0.0, n));
    col *= mix(1.0, 0.78, spots);

    // Limb brightening (edge glows hotter, like real solar footage)
    float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), 2.2);
    col += uCore * fres * 1.4;

    // Overall brightness boost so it blooms
    col *= 1.5;
    gl_FragColor = vec4(col, 1.0);
  }
`

export const coronaVertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main(){
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

export const coronaFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main(){
    float d = max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0);
    float glow = pow(d, 2.6); // brightest toward the centre of the disc, fading out
    gl_FragColor = vec4(uColor * glow * uIntensity, glow * uIntensity);
  }
`
