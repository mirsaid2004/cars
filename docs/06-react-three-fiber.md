# 6. React Three Fiber

React Three Fiber (R3F) lets you describe a Three.js scene with React components. It is not a wrapper with its own features — it is Three.js, expressed as JSX. This project is built with it.

## 6.1 Should you learn plain Three.js first?

Yes, briefly. Spend a week or two with plain Three.js ([02-core-concepts.md](02-core-concepts.md)) so that you know what a scene, mesh and render loop are. Then R3F will read as shorthand. People who start with R3F tend to get stuck the first time they need something the abstractions do not cover.

## 6.2 The mapping

Every Three.js class becomes a lower-case JSX element. Constructor arguments go in `args`. Properties become props.

```js
// Three.js
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 3),
  new THREE.MeshStandardMaterial({ color: 'red', roughness: 0.4 })
)
mesh.position.set(0, 1, 0)
scene.add(mesh)
```

```jsx
// R3F
<mesh position={[0, 1, 0]}>
  <boxGeometry args={[1, 2, 3]} />
  <meshStandardMaterial color="red" roughness={0.4} />
</mesh>
```

- Nesting is `add()`: a child element is added to its parent.
- Dashes reach into nested properties: `rotation-x={Math.PI / 2}`, `position-y={2}`.
- `attach` says which property of the parent a child fills: `<color attach="background" args={['#050609']} />`.
- `<primitive object={something} />` inserts an existing Three.js object — this is how the loaded car model is placed in `Car.jsx`.

## 6.3 `<Canvas>`

`<Canvas>` creates the renderer, scene and camera, handles resizing and pixel ratio, and runs the render loop.

```jsx
<Canvas
  dpr={[1, 1.75]}                       // clamp device pixel ratio
  gl={{ antialias: false }}             // renderer options
  camera={{ fov: 30, position: [6, 6, 14] }}
>
  …
</Canvas>
```

See `src/scene/Experience.jsx`. Antialiasing is switched off on the renderer there because the post-processing chain does its own multisampling.

## 6.4 The two essential hooks

### `useFrame` — the render loop
```jsx
useFrame((state, delta) => {
  ref.current.rotation.y += delta
})
```
`state` gives you `camera`, `clock`, `size`, `scene`, `gl`, `pointer`.

### `useThree` — access to the internals
```jsx
const { camera, size, gl } = useThree()
```

## 6.5 The rule that matters most: do not animate with React state

Calling `setState` 60 times a second re-renders React 60 times a second. That is slow and it is the classic R3F mistake.

```jsx
// ✗ wrong — re-renders the component every frame
const [x, setX] = useState(0)
useFrame(() => setX((v) => v + 0.01))
return <mesh position-x={x} />

// ✓ right — mutate the object directly through a ref
const ref = useRef()
useFrame((_, dt) => { ref.current.position.x += dt })
return <mesh ref={ref} />
```

**React decides *what exists*. `useFrame` decides *how it moves*.**

### How this project shares fast-changing values

`src/store.js` exports a plain mutable object:

```js
export const rig = { scroll: 0, intro: 0, pointer: { x: 0, y: 0 }, drag: 0, speed: 0 }
```

The page writes to it (scroll handler, pointer handler, GSAP). The scene reads it inside `useFrame`. No React state is involved, so scrolling causes zero re-renders. This object is the bridge between the HTML world and the WebGL world.

For values that change rarely and that the UI must react to — the selected paint — the project uses a small **Zustand** store. Components that need to re-render subscribe with `useStore((s) => s.paint)`; code inside `useFrame` reads it without subscribing, via `useStore.getState().paint`.

Decide for each value: does the *UI* need to re-render when it changes? If yes, state. If it only affects what is drawn, a ref or a mutable object.

## 6.6 Other rules

- **Do not create objects inside `useFrame`.** `new THREE.Vector3()` 60 times a second creates garbage and causes stutter. Create it once with `useMemo` or at module level and reuse it. (`CameraRig.jsx` keeps its scratch vectors at module level.)
- **Create materials and geometries once** with `useMemo`, as `Car.jsx` does for its materials.
- **Use `useLayoutEffect`** for one-off setup on loaded objects so it happens before the first frame is drawn.
- R3F disposes of geometries and materials it created when components unmount. Objects you created yourself are yours to dispose.

## 6.7 Loading with Suspense

Loaders in R3F suspend. Wrap anything that loads in `<Suspense>`:

```jsx
<Suspense fallback={null}>
  <Car />
</Suspense>
```

drei's `useProgress()` reports loading progress from anywhere, including outside the canvas — that is what powers this project's loading screen in `App.jsx`. `useGLTF.preload(url)` starts the download as soon as the module is imported.

## 6.8 drei — the standard helper library

`@react-three/drei` is a large collection of ready-made components. Used in this project:

| Helper | What it does here |
|--------|-------------------|
| `useGLTF` | loads the car, with Draco |
| `useTexture` | loads the shadow image |
| `Environment` | renders the live light rig into the environment map |
| `Lightformer` | a glowing shape for that rig |
| `MeshReflectorMaterial` | the blurred mirror floor |
| `Text` | the 3D "M_DEV" wordmark |
| `Sparkles` | dust in the air |
| `useProgress` | loading percentage |

Others worth knowing: `OrbitControls`, `ContactShadows`, `Html` (DOM elements positioned in 3D), `ScrollControls`, `Float`, `Instances`, `Center`, `Bounds`, `PerformanceMonitor`, `Stage`.

Before writing anything non-trivial, check whether drei already has it.

## 6.9 Events

Meshes accept pointer events directly; R3F does the ray casting.

```jsx
<mesh onClick={(e) => …} onPointerOver={(e) => …} />
```

This project does not use them, because the canvas sits behind the page. Its drag-to-rotate is handled by pointer events on the HTML section, which add to `rig.drag`.

## 6.10 The wider ecosystem

- `@react-three/postprocessing` — effects ([07-shaders-and-postprocessing.md](07-shaders-and-postprocessing.md))
- `@react-three/rapier` — physics
- `@react-three/xr` — VR and AR
- `leva` — a quick control panel for tuning values while you work
- `r3f-perf` — an in-scene performance monitor

## Exercises

1. Rebuild the plain Three.js cube from chapter 2 in R3F.
2. Write a component with `useFrame` that orbits a sphere around the origin using a ref.
3. Deliberately write the "wrong" `setState` version, open React DevTools' profiler, and see the re-renders. Then fix it.
4. Add `leva` to this project and expose the paint's `roughness` and `clearcoatRoughness` as live sliders.
5. Add drei's `<OrbitControls>` to `Experience.jsx` and temporarily remove `<CameraRig />` so you can fly around the studio and see how the light rig is built.
