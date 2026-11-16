# 9. Project walkthrough

How the M_DEV Cars showcase is put together. Read this alongside the source.

## 9.1 Stack

| Package | Role |
|---------|------|
| `vite`, `@vitejs/plugin-react` | dev server and build |
| `react`, `react-dom` | UI |
| `three` | 3D engine |
| `@react-three/fiber` | Three.js as React components |
| `@react-three/drei` | helpers: loaders, environment, reflector, text |
| `@react-three/postprocessing`, `postprocessing` | bloom, vignette, grain, tone mapping |
| `gsap` (+ ScrollTrigger) | timelines and scroll-triggered reveals |
| `lenis` | smooth scrolling |
| `zustand` | small state store (selected paint) |
| `@fontsource/*` | self-hosted fonts |

## 9.2 File map

```
index.html
public/
  models/car.glb        the car (Draco-compressed glTF)
  models/car_ao.png     soft shadow image for under the car
  draco/                Draco decoder, self-hosted
src/
  main.jsx              entry: fonts, CSS, mount <App />
  App.jsx               all HTML, scroll logic, intro timeline
  styles.css            all styling
  store.js              paints, Zustand store, shared `rig` object
  scene/
    Experience.jsx      <Canvas>, wordmark, speed streaks, effects
    Car.jsx             model, materials, wheels, turntable
    Studio.jsx          live light rig, reflective floor, dust
    CameraRig.jsx       the six shots and the camera maths
```

## 9.3 The architecture in one picture

```
            HTML page (scrolls)                    WebGL canvas (fixed, behind)
   ┌──────────────────────────────┐        ┌──────────────────────────────────┐
   │ App.jsx                      │        │ Experience.jsx                   │
   │  Lenis scroll ──┐            │        │   CameraRig  reads scroll, intro │
   │  pointer move ──┤  writes    │  rig   │   Car        reads scroll, drag  │
   │  GSAP intro  ───┼──────────► │ ─────► │   Studio     reads intro, speed  │
   │  drag ──────────┘            │ object │   SpeedLines reads speed         │
   │                              │        │                                  │
   │  swatch click ─► Zustand ────┼────────┼─► paint colour, accent lights    │
   └──────────────────────────────┘        └──────────────────────────────────┘
```

Two layers that never touch each other directly. They communicate through two things in `src/store.js`:

- **`rig`** — a plain mutable object for values that change every frame. Writing to it triggers nothing; the scene simply reads it on its next frame.
- **`useStore`** — a Zustand store for the selected paint, because the UI has to re-render when it changes.

## 9.4 `store.js`

- `PAINTS` — the six paints: name, body colour, UI accent colour, finish label.
- `useStore` — `{ paint, setPaint }`.
- `rig` — `scroll` (section index + progress), `intro` (0→1 opening), `pointer`, `drag`, `speed`.
- `SECTION` — named indices so the scene code can say `SECTION.POWER` instead of `2`.

## 9.5 `App.jsx`

**Layers**, back to front: the canvas (`.stage`), a CSS colour grade (`.grade`), the page content (`main`), fixed navigation, the letterbox bars, the loader.

`main` has `pointer-events: none` so that it does not block anything, with buttons and the colour section switched back on.

**Scroll effect.** Creates Lenis and drives it from GSAP's ticker so the whole page shares one clock. On every scroll it calculates `rig.scroll` from the real `offsetTop` of each `.chapter`, and updates the active section for the navigation.

**Reveal effect.** For each section, a GSAP timeline tied to ScrollTrigger slides the headline lines up from behind a mask (`.line` has `overflow: hidden`; the inner `span` is translated), fades in supporting elements, and counts the statistics up. `toggleActions: 'play reverse play reverse'` makes it replay in both directions.

**Intro effect.** Waits for drei's `useProgress` to report 100%, then runs one timeline: loader fades, `rig.intro` animates 0→1 over 5.2 seconds, the bars retract, the hero text reveals, and scrolling is unlocked.

**Layout note.** Sections have a 45vh gap between them (`.chapter + .chapter { margin-top: 45vh }`). In that empty stretch only the car is on screen, which is when the camera makes its big moves. Text and camera travel take turns instead of competing.

## 9.6 `Experience.jsx`

Sets up the canvas, the background colour and matching fog, and composes the scene.

- **`Wordmark`** — the "M_DEV" letters are real 3D text standing on the floor behind the car, angled to face the hero camera, so they are reflected in the floor and partly hidden by the car. Their opacity follows `rig.intro` and fades with `rig.scroll`.
- **`SpeedLines`** — 140 instanced streaks. See [08-performance.md](08-performance.md).
- **`EffectComposer`** — see [07-shaders-and-postprocessing.md](07-shaders-and-postprocessing.md).

## 9.7 `Car.jsx`

1. Loads the model and the shadow texture.
2. Creates six materials once: paint, glass, rim, trim, headlight, tail light.
3. Assigns them to nodes by name in `useLayoutEffect`, and records the body node's original rotation and height.
4. Each frame:
   - blends the paint colour towards the selected one,
   - brings the lights up during the intro, with a flicker,
   - computes `rig.speed` from how close the scroll is to the performance section,
   - spins the four wheels by `speed × dt`,
   - adds a slight squat and vibration to the body,
   - runs the turntable: auto-rotates and applies drag while in the colour section, otherwise eases back to the nearest full turn so the car is always facing the right way for the other shots.

## 9.8 `Studio.jsx`

- **`LightRig`** inside `<Environment frames={Infinity}>` — described in [03-materials-lighting.md](03-materials-lighting.md). The strips' scroll speed is `0.9 + rig.speed × 16`, so reflections race across the car in the performance section.
- **Floor** — a large disc with `MeshReflectorMaterial`.
- **`Sparkles`** — faint dust for depth.

There are no conventional lights in this scene at all. Everything is lit by the environment map.

## 9.9 `CameraRig.jsx`

Described in detail in [05-animation-and-camera.md](05-animation-and-camera.md). In summary, each frame it:

1. damps its own scroll value towards `rig.scroll`,
2. samples the shot list at that value, with smootherstep easing,
3. applies the intro offset, the portrait adjustment, parallax, breathing and shake,
4. converts orbit coordinates to a position, calls `lookAt`, sets the field of view and the frame offset.

## 9.10 Things to try

Small changes that teach a lot:

| Change | File | What you learn |
|--------|------|----------------|
| Add a seventh paint | `store.js` | data-driven UI and scene |
| Re-frame a shot | `CameraRig.jsx` → `SHOTS` | camera composition |
| Change the strip lights | `Studio.jsx` | reflections as lighting |
| Adjust paint roughness / clearcoat | `Car.jsx` | PBR parameters |
| Change bloom threshold and intensity | `Experience.jsx` | HDR and selective glow |
| Slow the intro to 10 s | `App.jsx` | timelines |
| Add a new section with its own shot | `App.jsx`, `CameraRig.jsx`, `store.js` | the whole pipeline |

## 9.11 Known limitations

- The phone layout and portrait camera framing were written but not tested on a device.
- The JavaScript ships as a single large chunk.
- The buttons in the last section are not wired to anything.
- A couple of per-frame allocations remain (see [08-performance.md](08-performance.md)).
- The car model carries a real manufacturer's design and badges; replace it before any public or commercial use.
