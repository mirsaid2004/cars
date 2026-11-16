# Learning Three.js — a practical guide

This folder is a learning path for Three.js, written around the code in this project (the M_DEV Cars showcase). Every topic points to the place in `src/` where it is used, so you can read the theory and then open a real, working example.

## How to use these docs

Read them in order. Each file ends with exercises — do them. Three.js is learned by building, not by reading.

| # | File | What you learn |
|---|------|----------------|
| 1 | [01-foundations.md](01-foundations.md) | What to know before Three.js: JavaScript, the maths, how a GPU draws |
| 2 | [02-core-concepts.md](02-core-concepts.md) | Scene, camera, renderer, meshes, the render loop |
| 3 | [03-materials-lighting.md](03-materials-lighting.md) | PBR materials, lights, environment maps, colour and tone mapping |
| 4 | [04-models-and-assets.md](04-models-and-assets.md) | glTF, Draco, textures, working with a loaded model |
| 5 | [05-animation-and-camera.md](05-animation-and-camera.md) | Frame-rate-independent motion, easing, scroll-driven cameras |
| 6 | [06-react-three-fiber.md](06-react-three-fiber.md) | Three.js inside React: R3F and drei |
| 7 | [07-shaders-and-postprocessing.md](07-shaders-and-postprocessing.md) | GLSL, custom materials, bloom and other effects |
| 8 | [08-performance.md](08-performance.md) | Draw calls, instancing, measuring, mobile |
| 9 | [09-project-walkthrough.md](09-project-walkthrough.md) | How this project works, file by file |
| 10 | [10-learning-plan.md](10-learning-plan.md) | A 12-week plan, project ideas, resources |

## The short version: what must be mastered

If you only remember one list, make it this one. Roughly in the order you should learn them:

1. **The scene graph** — objects have parents, and position/rotation/scale are relative to the parent.
2. **The render loop and delta time** — everything that moves is updated once per frame, scaled by elapsed time.
3. **Cameras** — field of view, aspect, near/far, and how to place and aim a camera on purpose.
4. **Vectors and rotations** — `Vector3`, lerp, dot and cross products, Euler angles versus quaternions.
5. **Geometry** — vertices, normals, UVs, indices, `BufferGeometry`.
6. **PBR materials** — colour, metalness, roughness, normal maps, clearcoat, transmission.
7. **Lighting with environment maps** — most realistic scenes are lit by an image, not by lamps.
8. **Colour management and tone mapping** — why your scene looks washed out or blown out, and how to fix it.
9. **The glTF pipeline** — exporting, compressing, loading, and editing a model after it loads.
10. **Animation technique** — damping, easing, timelines, and tying motion to scroll or input.
11. **Performance** — draw calls, instancing, texture size, pixel ratio.
12. **Shaders** — GLSL vertex and fragment shaders, uniforms, and post-processing.

Items 1–9 make you productive. Items 10–12 are what make work look professional.

## A realistic time estimate

- **2–3 weeks** of regular practice: you can build a scene with a loaded model, lighting and orbit controls.
- **2–3 months**: you can build something like this project on your own.
- **6+ months**: you are comfortable writing shaders and debugging performance.

These assume you already know JavaScript well. If you don't, start there — see [01-foundations.md](01-foundations.md).
