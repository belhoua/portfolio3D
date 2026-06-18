/** Subtle vignette post-process pass */
export const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.05 },
    darkness: { value: 1.1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - 0.5) * vec2(offset);
      float vig = clamp(dot(uv, uv) * darkness, 0.0, 1.0);
      gl_FragColor = vec4(mix(texel.rgb, vec3(0.0), vig * 0.55), texel.a);
    }
  `,
}
