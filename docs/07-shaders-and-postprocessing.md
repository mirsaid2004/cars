# 7. Shaders and post-processing

Shaders are the programs that run on the GPU. Everything you have used so far — every material — is a shader someone else wrote. Writing your own is the step from "using Three.js" to "making anything you can imagine".

Do not start here. Come to this chapter once chapters 2–5 feel comfortable.

## 7.1 The two shaders

Shaders are written in **GLSL**, a small C-like language.

- The **vertex shader** runs once per vertex. Its job is to output the vertex's position on screen. It can also move vertices (waves, wind, morphing).
- The **fragment shader** runs once per pixel. Its job is to output a colour.

Values flow one way: *attributes* (per vertex) → vertex shader → *varyings* (interpolated across the triangle) → fragment shader. *Uniforms* are values sent from JavaScript that are the same for every vertex and pixel — time, colours, textures.

```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ff4a1c') },
  },
  vertexShader: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      p.z += sin(p.x * 4.0 + uTime) * 0.1;          // a wave
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(uColor * vUv.y, 1.0);      // a vertical gradient
    }
  `,
})

// each frame:
material.uniforms.uTime.value = elapsedSeconds
```

`ShaderMaterial` supplies `position`, `uv`, `normal`, `projectionMatrix` and `modelViewMatrix` for you. `RawShaderMaterial` supplies nothing.

## 7.2 What to learn in GLSL

- **Types**: `float`, `vec2`, `vec3`, `vec4`, `mat4`, `sampler2D`. Numbers need a decimal point (`1.0`, not `1`).
- **Swizzling**: `color.rgb`, `pos.xz`, `v.xxy`.
- **The core functions**: `mix` (lerp), `step`, `smoothstep`, `clamp`, `fract`, `mod`, `length`, `distance`, `dot`, `normalize`, `sin`/`cos`, `pow`.
- **Thinking in UV space**: drawing shapes by computing, for each pixel, whether it is inside them.
- **Noise**: random-looking but smooth functions (Perlin, simplex, FBM). The foundation of fire, clouds, water, terrain and dissolves.
- **Lighting by hand**: `dot(normal, lightDirection)` is diffuse light. A **Fresnel** term (`pow(1.0 - dot(normal, viewDirection), n)`) gives glowing edges.

The classic free starting point is *The Book of Shaders*, which teaches fragment shaders from nothing.

## 7.3 Extending built-in materials

Usually you want PBR lighting *plus* a small custom change. Rewriting a PBR shader is a lot of work. Options:

- `material.onBeforeCompile` — patch the built-in shader source by string replacement. Powerful, fragile.
- **three-custom-shader-material** — a library that does this cleanly.
- **TSL** — see below.

## 7.4 TSL and the node system

Three.js now has a shader language written in JavaScript, **TSL** (`three/tsl`), used with node materials (`MeshStandardNodeMaterial` and friends). You compose functions instead of writing strings:

```js
import { color, sin, time, positionLocal } from 'three/tsl'
material.colorNode = color('#ff4a1c').mul(sin(time).mul(0.5).add(0.5))
```

TSL compiles to GLSL for WebGL and to WGSL for WebGPU, so one shader works on both renderers. It is the direction the library is heading. Learning GLSL first is still worthwhile: the concepts are identical and most existing material is in GLSL.

## 7.5 Post-processing

Post-processing renders the scene into an off-screen image and then runs fragment shaders over that image before showing it. It is how you get the last 20% of "cinematic".

Two libraries:

- Three.js's own `EffectComposer` (`three/addons/postprocessing/`).
- **pmndrs `postprocessing`**, used via `@react-three/postprocessing` in R3F. It merges compatible effects into a single pass, which is faster. This project uses it.

### The chain in this project

`src/scene/Experience.jsx`:

```jsx
<EffectComposer multisampling={4}>
  <Bloom mipmapBlur luminanceThreshold={1} intensity={0.85} radius={0.75} />
  <ChromaticAberration offset={[0.0005, 0.0005]} />
  <Vignette offset={0.22} darkness={0.82} />
  <Noise opacity={0.03} />
  <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
</EffectComposer>
```

| Effect | What it adds |
|--------|-------------|
| **Bloom** | bright areas glow. `luminanceThreshold={1}` means only values *above* 1 bloom, so you choose exactly what glows by giving it an over-bright colour (headlights, light streaks). Everything else stays crisp |
| **Chromatic aberration** | very slight colour fringing at the edges, like a real lens |
| **Vignette** | darker corners, pulling the eye to the centre |
| **Noise** | film grain. Hides colour banding in dark gradients and removes the "too clean" CG look |
| **Tone mapping** | compresses HDR to the screen. Must be last |

Selective bloom through over-bright values is the technique to remember. It requires an HDR pipeline: the composer renders to floating-point buffers, emissive materials use `toneMapped={false}` with intensities above 1, and tone mapping is applied once at the end.

### Other effects worth knowing

Depth of field, SSAO / N8AO (ambient occlusion), screen-space reflections, motion blur, LUT colour grading, god rays, glitch, outline, SMAA / FXAA antialiasing.

### Restraint

Every effect in the chain above is set very low. Post-processing done well is not noticed; done heavily it is the first thing that looks dated. Each pass also costs a full-screen fragment shader, so the budget is real.

## 7.6 Colour grading without shaders

Some of the "grade" in this project is not WebGL at all. `.grade` in `src/styles.css` is a fixed CSS gradient layered over the canvas: a darkening at top and bottom so text stays readable, and a faint glow in the accent colour rising from the bottom. Cheap, and trivially adjustable. Use the simplest tool that produces the picture.

## Exercises

1. Write a `ShaderMaterial` whose fragment shader draws a circle using `distance` and `smoothstep`.
2. Animate it with a `uTime` uniform.
3. Displace a plane's vertices with a sine wave in the vertex shader to make a flag.
4. Add a Fresnel glow to a sphere.
5. In this project, set the `Bloom` threshold to 0 and observe why a threshold matters. Then remove `<ToneMapping>` and see what happens to the highlights.
6. Add a `DepthOfField` effect to the wheel close-up and decide honestly whether it improves the shot.
