# 10. A learning plan

A 12-week path, assuming roughly an hour a day and solid JavaScript. Adjust the pace, but keep the order and do the projects — each one exists to force a specific skill.

## Phase 1 — Fundamentals (weeks 1–3)

Plain Three.js, no React.

**Week 1 — the basics**
- Read [01-foundations.md](01-foundations.md) and [02-core-concepts.md](02-core-concepts.md).
- Build the minimum scene from memory. Add `OrbitControls`, helpers, resize handling.
- *Project:* a solar system using only nested groups.

**Week 2 — materials and light**
- Read [03-materials-lighting.md](03-materials-lighting.md).
- Experiment with every PBR parameter using `lil-gui`. Load an HDR environment.
- *Project:* a "material lab" — a row of spheres showing different materials under a switchable environment.

**Week 3 — models**
- Read [04-models-and-assets.md](04-models-and-assets.md).
- Install Blender; learn to open, inspect, rename and export.
- *Project:* a product viewer — load a model, light it well, add orbit controls, and let the user change one material's colour.

**Checkpoint:** you can explain the scene graph, local versus world space, and why a metal object might render black.

## Phase 2 — Motion and React (weeks 4–6)

**Week 4 — animation**
- Read [05-animation-and-camera.md](05-animation-and-camera.md).
- Practise delta time, `damp`, easing. Learn GSAP basics and timelines.
- *Project:* add an intro animation and a scripted camera move to your product viewer.

**Week 5 — React Three Fiber**
- Read [06-react-three-fiber.md](06-react-three-fiber.md).
- Rebuild your product viewer in R3F with drei.
- *Project:* the same viewer, now with HTML UI that controls the scene through a store.

**Week 6 — scroll**
- Study `App.jsx` and `CameraRig.jsx` in this project.
- *Project:* a three-section scrolling page where the camera moves between three composed shots of your model.

**Checkpoint:** you can explain why you must not call `setState` in `useFrame`, and you can design a camera path that never clips through the subject.

## Phase 3 — Polish (weeks 7–9)

**Week 7 — shaders I**
- Read [07-shaders-and-postprocessing.md](07-shaders-and-postprocessing.md).
- Work through the early chapters of *The Book of Shaders*.
- *Project:* five small fragment shaders — gradient, circle, stripes, animated noise, a ripple.

**Week 8 — shaders II**
- Vertex displacement, Fresnel, passing uniforms and textures.
- *Project:* an animated shader background, or a hologram material for your model.

**Week 9 — post-processing and performance**
- Read [08-performance.md](08-performance.md).
- Add bloom, vignette and grain to your scroll project. Measure before and after.
- *Project:* profile your scroll page and halve its draw calls or frame time.

**Checkpoint:** you can make only specific objects glow, and you can tell whether a slow scene is CPU- or GPU-bound.

## Phase 4 — A real project (weeks 10–12)

Build one complete piece, start to finish, and publish it. Good options:

- A product landing page (headphones, a watch, a shoe) with a scroll-driven camera and a colour configurator.
- A personal portfolio with a 3D hero.
- A small interactive scene — a room to look around, with clickable objects.
- Rebuild this project from an empty folder, using these docs and the source only when stuck.

Rules for the final project: test it on a real phone, give it a loading state, and keep it at 60 fps.

## What "mastered" means

You have mastered the fundamentals when you can, without looking things up:

- [ ] Set up scene, camera, renderer and loop from an empty file
- [ ] Explain parent/child transforms and convert between local and world space
- [ ] Choose a field of view deliberately and compose a shot
- [ ] Describe a surface in PBR terms and build its material
- [ ] Light a glossy object with an environment and control its reflections
- [ ] Fix a scene that is washed out, too dark, or blown out
- [ ] Load, inspect, optimise and modify a glTF model
- [ ] Animate with delta time and damping; sequence with a timeline
- [ ] Drive a scene from scroll or pointer input
- [ ] Keep per-frame code free of allocations and React re-renders
- [ ] Reduce draw calls with instancing or merging
- [ ] Write a simple vertex and fragment shader with uniforms
- [ ] Build a post-processing chain with selective bloom and correct tone mapping
- [ ] Profile a scene and name its most expensive part

## Resources

**Official**
- threejs.org — documentation, the manual, and several hundred examples with source. The examples are the best reference there is: find one close to what you want and read its code.
- r3f.docs.pmnd.rs — React Three Fiber documentation.
- drei.docs.pmnd.rs — drei component reference.

**Courses and books**
- *Three.js Journey* (Bruno Simon) — the most thorough paid course; covers plain Three.js, shaders, Blender and R3F.
- *Discover three.js* — a free online book, strong on fundamentals.
- *The Book of Shaders* — free; the standard introduction to fragment shaders.
- *WebGL2 Fundamentals* — free; for understanding what Three.js does underneath.

**Tools**
- Blender — modelling and asset preparation
- gltf.report — inspect models in the browser
- glTF Transform — command-line optimisation
- gltfjsx — model to R3F component
- lil-gui / leva — live control panels
- Spector.js, r3f-perf, stats.js — profiling

**Assets**
- Poly Haven — CC0 HDRIs, textures, models
- Sketchfab — models (check each licence)
- ambientCG — CC0 PBR textures

**Inspiration and study**
- Awwwards and the Three.js forum showcase — see what is possible, then work out how it was done.
- The pmndrs examples and Codrops tutorials — many with full source.

## Habits that speed things up

1. **Read source.** When an example impresses you, open its code. Most techniques are 20 lines once you see them.
2. **Change one thing at a time.** With a control panel if possible. You learn what a parameter does by moving it.
3. **Keep a scrapbook.** A folder of tiny experiments, one idea each. You will reuse them constantly.
4. **Study real photography and film.** Lighting, lens choice, composition and camera movement are skills from outside programming, and they are most of what separates good 3D work from average.
5. **Finish things.** A small published project teaches more than a large abandoned one.
