# 2. Core concepts — scene, camera, renderer

Every Three.js program, however complex, is built from the same few parts. Learn these in plain Three.js first, even if you intend to use React Three Fiber later. R3F is a thin layer over exactly these objects.

## 2.1 The minimum program

```js
import * as THREE from 'three'

// 1. Scene: the container for everything
const scene = new THREE.Scene()

// 2. Camera: the point of view
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100)
camera.position.set(0, 1, 5)

// 3. Renderer: draws the scene, as seen by the camera, into a <canvas>
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

// 4. An object: geometry (shape) + material (surface) = mesh
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 'tomato' })
)
scene.add(cube)

// 5. Light (MeshStandardMaterial is black without it)
scene.add(new THREE.DirectionalLight('white', 3))
scene.add(new THREE.AmbientLight('white', 0.5))

// 6. The loop
renderer.setAnimationLoop((time) => {
  cube.rotation.y = time / 1000
  renderer.render(scene, camera)
})

// 7. Handle resize
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
```

Type this out by hand at least once. Everything else in Three.js is an elaboration of these seven steps.

## 2.2 The scene graph

A scene is a tree. Every node is an `Object3D` with `position`, `rotation`, `scale`, and a list of `children`. A child's transform is **relative to its parent**.

```js
const car = new THREE.Group()
car.add(body, wheelFL, wheelFR)
car.rotation.y = Math.PI   // the body and all wheels turn together
wheelFL.rotation.x += 0.1  // this wheel also spins on its own axle
```

This is exactly how the car in this project works. In `src/scene/Car.jsx`:

- an outer `<group>` is rotated for the turntable,
- the whole model inside it is turned 180° so its nose points along +Z,
- each wheel node is spun around its own local X axis.

Three levels of the tree, three independent motions, no interference.

Useful methods:

| Method | Purpose |
|--------|---------|
| `scene.add(obj)` / `parent.remove(obj)` | build the tree |
| `obj.getObjectByName('wheel_fl')` | find a node in a loaded model |
| `obj.traverse(fn)` | visit every descendant |
| `obj.getWorldPosition(target)` | position after all parent transforms |
| `obj.lookAt(x, y, z)` | rotate to face a point |

**Local versus world space** is a concept you must own. `mesh.position` is local. If the parent is moved or rotated, the mesh's world position changes even though `mesh.position` does not.

## 2.3 Cameras

### PerspectiveCamera
`new THREE.PerspectiveCamera(fov, aspect, near, far)`

- **fov** — vertical field of view in degrees. This is a strong creative control: 20–35 looks like a telephoto lens (flattering for cars and products), 50 is natural, 75+ is wide and distorted. This project uses 26–36 depending on the shot.
- **aspect** — width ÷ height of the canvas. Must be updated on resize.
- **near / far** — only things between these distances are drawn. Keep the range as tight as you can: a tiny `near` with a huge `far` causes flickering surfaces (z-fighting).

After changing `fov`, `aspect`, `near` or `far` you **must** call `camera.updateProjectionMatrix()`.

### OrthographicCamera
No perspective: far objects are the same size as near ones. Used for 2D, isometric views, and shadow maps.

### Controls
`OrbitControls` (from `three/addons/controls/OrbitControls.js`) gives you mouse orbit, zoom and pan. Use it while developing any scene so you can look around, even if the final product has a scripted camera.

## 2.4 Geometry

A `BufferGeometry` stores per-vertex **attributes** in typed arrays:

- `position` — where each vertex is (3 numbers each)
- `normal` — which way the surface faces there (needed for lighting)
- `uv` — texture coordinates (2 numbers each)
- `index` — optional; lets triangles share vertices

Built-in shapes (`BoxGeometry`, `SphereGeometry`, `PlaneGeometry`, `CylinderGeometry`, `TorusGeometry`, …) generate these for you. Real projects mostly load geometry from a model file.

You should be able to build one geometry by hand, to remove the mystery:

```js
const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
  0, 1, 0,   -1, -1, 0,   1, -1, 0,
]), 3))
geometry.computeVertexNormals()
```

## 2.5 Materials (first look)

| Material | Lit? | Use it for |
|----------|------|-----------|
| `MeshBasicMaterial` | no | flat colour, UI, glowing shapes, debugging |
| `MeshStandardMaterial` | yes, PBR | almost everything |
| `MeshPhysicalMaterial` | yes, PBR+ | car paint, glass, fabric — adds clearcoat, transmission, sheen |
| `MeshNormalMaterial` | no | debugging normals |
| `ShaderMaterial` | you decide | custom effects |

Details in [03-materials-lighting.md](03-materials-lighting.md).

## 2.6 The render loop

`renderer.setAnimationLoop(callback)` runs your callback every frame. Inside it you update whatever moves, then call `renderer.render(scene, camera)`.

Never move things by a fixed amount per frame — screens run at different refresh rates. Scale by the time since the previous frame (**delta time**):

```js
const timer = new THREE.Timer()
renderer.setAnimationLoop(() => {
  timer.update()
  const dt = timer.getDelta()       // seconds since last frame
  cube.rotation.y += dt * 1.5       // 1.5 radians per second on every screen
  renderer.render(scene, camera)
})
```

(`THREE.Clock` did this job for years and appears in most tutorials; recent versions of Three.js deprecate it in favour of `THREE.Timer`.)

## 2.7 Cleaning up

GPU memory is not garbage-collected. When you remove something for good, free it:

```js
geometry.dispose()
material.dispose()
texture.dispose()
```

Forgetting this causes memory to climb every time a scene or page changes.

## 2.8 Common beginner mistakes

- **Black screen** — no light with a lit material, camera inside the object, or the object outside `near`/`far`.
- **Nothing visible** — forgot `scene.add`, or the camera is looking the wrong way.
- **Stretched image** — aspect ratio not updated on resize.
- **Blurry on a phone or laptop** — pixel ratio not set. Cap it at 2: beyond that the cost rises sharply for little visible gain.
- **Changes do nothing** — forgot `updateProjectionMatrix()` on the camera, or `needsUpdate = true` on a texture, attribute or material.

## Exercises

1. Build the minimum program above from memory.
2. Make a "solar system": a sun, a planet orbiting it, and a moon orbiting the planet, using only parent/child groups and rotation — no trigonometry.
3. Add `OrbitControls`, then add `AxesHelper` and `GridHelper` to the scene so you can see the coordinate system.
4. Change the camera `fov` between 20 and 90 while moving the camera so the cube stays the same size on screen. Note how the feeling of the image changes.
