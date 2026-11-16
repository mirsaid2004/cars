# 1. Foundations — what to know before Three.js

Three.js is a JavaScript library that sits on top of WebGL (and now WebGPU). It hides most of the GPU plumbing, but three things underneath it never go away: JavaScript, a little maths, and a mental model of how a GPU draws a picture.

## 1.1 JavaScript you need

You do not need to be an expert, but these must feel natural:

- **ES modules** — `import` / `export`. Three.js is consumed as modules, and its extras live under `three/addons/...`.
- **Classes and `new`** — everything in Three.js is a class instance: `new THREE.Mesh(geometry, material)`.
- **References versus copies** — the single most common source of bugs.
  ```js
  const a = new THREE.Vector3(1, 0, 0)
  const b = a          // same object! changing b changes a
  const c = a.clone()  // independent copy
  ```
  Most Three.js maths methods **mutate the object they are called on** and return it: `a.add(b)` changes `a`.
- **Promises and async/await** — models and textures load asynchronously.
- **`requestAnimationFrame`** — the browser calls your function before each repaint, normally 60 or 120 times a second.
- **Typed arrays** — `Float32Array` holds vertex data. You meet them as soon as you build custom geometry.
- **A bundler** — Vite is the standard choice. This project uses it (`vite.config.js`).

If you plan to use React Three Fiber, you also need solid React: components, hooks, refs, and an understanding of when React re-renders.

## 1.2 The maths you need

You need less than people fear. You must be able to *use* these, not derive them.

### Coordinate system
Three.js is **right-handed, Y-up**: +X right, +Y up, +Z towards the viewer. One unit is conventionally one metre. The car in this project is about 4.5 units long.

### Vectors
A `Vector3` is either a position or a direction.

| Operation | Meaning | Typical use |
|-----------|---------|-------------|
| `a.add(b)`, `a.sub(b)` | combine / difference | `b - a` is the direction from a to b |
| `a.length()` | magnitude | distance |
| `a.normalize()` | make length 1 | a pure direction |
| `a.dot(b)` | how aligned two directions are (1 same, 0 perpendicular, −1 opposite) | "is this facing the camera?" |
| `a.cross(b)` | a vector perpendicular to both | building a sideways or up axis |
| `a.lerp(b, t)` | blend from a to b by t (0..1) | smooth movement |

### Trigonometry
`sin` and `cos` turn an angle into a point on a circle. That is how you orbit anything:

```js
x = radius * Math.sin(angle)
z = radius * Math.cos(angle)
```

The whole camera system in this project is built on this — see `src/scene/CameraRig.jsx`, where each shot is stored as *radius, azimuth, elevation* and converted to a position with sin and cos. Angles in Three.js are in **radians** (`degrees * Math.PI / 180`).

### Rotations
- **Euler angles** (`object.rotation.x/y/z`) — easy to read, fine for simple cases.
- **Quaternions** (`object.quaternion`) — what Three.js uses internally. Use them when blending between orientations (`slerp`) or when Euler angles produce odd flips (gimbal lock).

You do not need to understand quaternion maths. You need to know they exist and when to reach for them.

### Matrices
Every object has a 4×4 matrix that combines its position, rotation and scale. You rarely write one by hand, but you should know:

- `matrix` is local (relative to the parent); `matrixWorld` is the final result after all parents.
- The camera has a `projectionMatrix` that squashes 3D into the 2D screen.

### Interpolation and easing
`lerp(a, b, t)` is the most used function in creative coding. Easing functions bend `t` so motion starts and ends gently. See [05-animation-and-camera.md](05-animation-and-camera.md).

## 1.3 How a GPU draws (the mental model)

Understanding this explains almost every performance rule later.

1. **Geometry is triangles.** A mesh is a list of vertices (points) with attributes: position, normal (which way the surface faces), UV (where on a texture this point maps).
2. **The vertex shader** runs once per vertex and decides where it lands on screen.
3. **Rasterisation** works out which pixels each triangle covers.
4. **The fragment shader** runs once per covered pixel and decides its colour — this is where materials and lighting are computed.
5. **The depth buffer** records how far each pixel is, so nearer surfaces hide farther ones.

Consequences worth remembering:

- A **draw call** is one "draw this geometry with this material" command. Each one has a fixed CPU cost, so 1,000 small meshes are much slower than 1 big one.
- **Fragment shader cost scales with pixels.** A high-resolution screen at full device pixel ratio can be 4–9× the work.
- **Transparency is hard** because the depth buffer assumes surfaces are opaque. Transparent objects must be sorted and drawn back to front, and they sometimes sort wrongly.

## 1.4 WebGL, WebGPU and where Three.js fits

- **WebGL 2** — the long-standing browser graphics API. `WebGLRenderer` uses it, and it is what this project runs on.
- **WebGPU** — the modern successor. Three.js ships a `WebGPURenderer` (imported from `three/webgpu`) and a shader language written in JavaScript called **TSL** (`three/tsl`).

Learn with `WebGLRenderer` first: nearly every tutorial, example and library targets it. Move to WebGPU and TSL once the fundamentals are solid.

## Exercises

1. Without Three.js, write a function that returns the (x, z) position of a point orbiting the origin at a given radius and angle. Log 8 points around the circle.
2. Write your own `lerp(a, b, t)` and `clamp(x, min, max)`. Then find them in `THREE.MathUtils`.
3. Create two `Vector3`s and compute the distance between them, the direction from one to the other, and their dot product. Predict the results before running the code.
