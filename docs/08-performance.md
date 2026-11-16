# 8. Performance

A scene that stutters is not cinematic, whatever it looks like in a screenshot. The target is a steady 60 frames per second, which gives you about 16 milliseconds per frame for everything.

## 8.1 Measure first

Do not guess. Tools:

- **`renderer.info`** — `renderer.info.render.calls` (draw calls) and `.triangles`, plus `renderer.info.memory` for geometries and textures.
- **stats.js / `r3f-perf`** — live frame rate, frame time, draw calls and GPU time on screen.
- **Chrome DevTools → Performance** — shows whether time goes to JavaScript or to the GPU.
- **Spector.js** — a browser extension that records every WebGL call in a frame.

Work out whether you are **CPU-bound** (too many draw calls, heavy JavaScript per frame) or **GPU-bound** (too many pixels, heavy shaders). A quick test: shrink the browser window. If the frame rate jumps, you are GPU-bound.

## 8.2 Draw calls

Each mesh with its own material is at least one draw call. Aim for a few hundred at most; under 100 is comfortable on phones.

Ways to reduce them:

- **Instancing** — draw one geometry many times in a single call, each copy with its own transform.
- **Merging** — combine static meshes that share a material into one geometry (`BufferGeometryUtils.mergeGeometries`, or in Blender).
- **Sharing materials** — identical materials should be one object, not copies.
- **Texture atlases** — let several objects share one material.

### Instancing in this project

The speed streaks in `src/scene/Experience.jsx` are 140 thin boxes drawn in **one** draw call with `<instancedMesh>`. Each frame the code computes a matrix per streak with a reused `Object3D`, writes it with `setMatrixAt`, and sets `instanceMatrix.needsUpdate = true`. When the car is not "moving", the whole mesh is set invisible and the loop exits early, so it costs nothing.

## 8.3 Pixels

Fragment work scales with pixel count, and pixel count scales with the square of the device pixel ratio. A phone with a ratio of 3 renders 9× the pixels of a ratio of 1.

- Cap the ratio: `dpr={[1, 1.75]}` in this project. Above 2 is rarely worth it.
- drei's `PerformanceMonitor` or `AdaptiveDpr` can lower it automatically when the frame rate drops.
- Render expensive effects (bloom, reflections) at lower resolution than the screen.

## 8.4 The expensive things in this project

In rough order of cost — useful as a guide to what is expensive in general:

1. **The reflective floor** (`MeshReflectorMaterial`) — renders the scene a second time, then blurs it.
2. **The live environment map** (`frames={Infinity}`) — six small renders of the light rig per frame. Kept at 256 resolution, and the rig is only a handful of flat shapes.
3. **Post-processing** — several full-screen passes, with 4× multisampling.
4. **`MeshPhysicalMaterial` with clearcoat** — a heavier shader than standard, though only on the body.
5. **The car itself** — the geometry is the cheap part.

If this had to run on low-end phones, the levers would be, in order: lower the reflector resolution or replace it with a static gradient, drop the environment to `frames={1}` (static reflections), reduce the pixel ratio, and remove multisampling.

## 8.5 Textures and memory

- GPU memory is roughly `width × height × 4` bytes, plus a third for mipmaps. A 4096² texture is about 85 MB.
- Use the smallest size that holds up at the distance it is seen.
- Use **KTX2** compressed textures for large sets — they stay compressed in GPU memory.
- Power-of-two dimensions (512, 1024, 2048) are the safe choice.

## 8.6 JavaScript per frame

- **Allocate nothing in the loop.** No `new Vector3()`, no `.clone()`, no array or object literals in `useFrame`. Garbage collection pauses show up as hitches. Keep scratch objects outside the loop and reuse them.
- **No React re-renders per frame** — see [06-react-three-fiber.md](06-react-three-fiber.md).
- **Skip work that is not visible** — as the speed streaks do.

Being honest about this project: a couple of spots do allocate per frame (`color.clone()` in `Studio.jsx` and a `new THREE.Color` in the speed-streak update). They are small, but they are exactly the kind of thing to clean up — a good first exercise.

## 8.7 Geometry

- Triangle counts in the low hundreds of thousands are fine on desktop; aim lower on mobile.
- **LOD** (`THREE.LOD`) swaps in simpler models at a distance.
- **Frustum culling** is automatic: objects outside the camera's view are skipped. It works per object, so one gigantic merged mesh is always drawn.
- Compress with Draco or Meshopt for download size (this does not reduce runtime cost).

## 8.8 Shadows and lights

- Each shadow-casting light renders the scene again. A point light with shadows renders it six times.
- Prefer baked or fake shadows where the lighting does not change — as the car's contact shadow does here.
- Keep shadow maps small (1024–2048) and the shadow camera tightly fitted.

## 8.9 Render on demand

If nothing moves, render nothing. In R3F, `<Canvas frameloop="demand">` only renders when something calls `invalidate()`. Ideal for configurators and viewers that are mostly still, and it saves battery. This project animates constantly, so it uses the default continuous loop.

## 8.10 Loading performance

Perceived performance starts before the first frame:

- Show a loading state (this project has a progress loader).
- Compress models and textures.
- Split code so the 3D bundle does not block the first paint — the JavaScript here is a single ~1.7 MB chunk, which `React.lazy` around `<Experience />` would improve.
- Preload critical assets (`useGLTF.preload`).

## 8.11 A checklist

- [ ] Draw calls measured and reasonable
- [ ] Pixel ratio capped
- [ ] No allocations in the frame loop
- [ ] No React state updates per frame
- [ ] Textures no larger than needed
- [ ] Models compressed
- [ ] Shadows baked or faked where possible
- [ ] Tested on a real phone, not only in a desktop browser

## Exercises

1. Add `r3f-perf` to this project and record the draw calls and frame time in each section.
2. Change the reflector `resolution` from 1024 to 256 and the environment from `frames={Infinity}` to `frames={1}`. Measure the difference and judge what was lost visually.
3. Remove the two per-frame allocations mentioned in 8.6.
4. Render 5,000 cubes as separate meshes, then as one `InstancedMesh`. Compare the frame rate.
