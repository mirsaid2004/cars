# 4. Models and assets

Real projects are built from models made in other tools. Knowing the asset pipeline is as important as knowing the API.

## 4.1 glTF is the format

Use **glTF 2.0**. It is an open standard designed for real-time rendering, and Three.js supports it best.

- `.gltf` — JSON plus separate binary and texture files.
- `.glb` — the same thing packed into one binary file. Prefer this for the web.

glTF carries meshes, PBR materials, textures, the node hierarchy, skeletons, animations and cameras. Avoid OBJ (no materials worth having, no hierarchy) and FBX (proprietary, heavy) except as a source to convert from.

## 4.2 Loading a model

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

const draco = new DRACOLoader().setDecoderPath('/draco/')
const loader = new GLTFLoader().setDRACOLoader(draco)

const gltf = await loader.loadAsync('/models/car.glb')
scene.add(gltf.scene)
```

`gltf.scene` is an ordinary `Group`. `gltf.animations` holds any animation clips.

## 4.3 Compression

Uncompressed models are large. Three kinds of compression matter:

| What | Technology | Loader support |
|------|-----------|----------------|
| Geometry | **Draco** or **Meshopt** | `DRACOLoader` / `MeshoptDecoder` |
| Textures | **KTX2 / Basis** (stays compressed on the GPU) | `KTX2Loader` |
| Textures (simple) | WebP / AVIF | built in |

The car in this project is Draco-compressed, which is why the decoder files are in `public/draco/` and passed to `useGLTF('/models/car.glb', '/draco/')` in `src/scene/Car.jsx`. Hosting the decoder yourself avoids depending on a third-party CDN.

Texture memory deserves special attention: a 4096×4096 PNG may be 2 MB on disk but occupies about 85 MB of GPU memory once decoded with mipmaps. KTX2 fixes that. Most models need 1024 or 2048 textures at most.

## 4.4 Tools you should know

- **Blender** — free; the standard tool for preparing models. You do not need to model, but you should be able to open a file, rename and delete objects, apply transforms, and export glTF.
- **gltf.report** — drag a model in to inspect its structure, sizes and draw calls in the browser.
- **glTF Transform** (`@gltf-transform/cli`) — command-line optimisation: `gltf-transform optimize in.glb out.glb` applies Draco/Meshopt, texture compression, deduplication and more.
- **gltfjsx** — turns a model into a React Three Fiber component with every mesh written out as JSX.
- **Khronos glTF Sample Viewer** — the reference renderer. If a model looks wrong there, the model is the problem.

## 4.5 Inspect before you code

Before writing any code, find out what is inside the model: node names, the hierarchy, and material names. That tells you what you can address.

For this project the car's structure was read straight out of the file. It contains nodes such as:

```
main            ← the body and everything fixed to it
  body, glass, trim, lights, leds, lights_red, interior_dark, …
wheel_fl, wheel_fr, wheel_rl, wheel_rr
  rim_fl, tire, brake, centre, nuts
steering_wheel …
```

Those names are what make the features possible: `body` gets the paint material, `glass` gets the glass material, `leds` and `lights_red` become emissive headlights and tail lights, and the four `wheel_*` nodes are spun.

## 4.6 Editing a model after it loads

Loading is rarely the end. You almost always adjust the result.

```js
// replace one material
model.getObjectByName('body').material = paintMaterial

// or walk everything
model.traverse((o) => {
  if (o.isMesh) {
    o.castShadow = true
    o.material.envMapIntensity = 1.2
  }
})
```

In `Car.jsx` a small helper walks each named node and assigns the replacement material to every mesh beneath it, because a named node can be either a mesh or a group of meshes.

### A real bug from this project, and the lesson

The first version of the car animation set the body's rotation directly:

```js
main.rotation.x = someSmallTilt   // ← the car stood on its nose
```

The `main` node already had a rotation baked in by the exporter (the original file was converted from a Z-up format, so the node carries a −90° X rotation to stand the car upright). Overwriting it threw that away.

The fix was to remember the original value and add to it:

```js
const base = { rx: main.rotation.x, y: main.position.y }
main.rotation.x = base.rx + someSmallTilt
```

**Never assume a loaded node starts at zero.** Treat a model's existing transforms as data you must preserve, or wrap the model in your own group and animate the group instead.

The same model also faces −Z, so it is turned by `rotation-y={Math.PI}` once, on load, so that everything else in the project can assume "the nose is +Z".

## 4.7 Scale, origin and orientation

When a model arrives, check three things:

1. **Scale** — is one unit one metre? A model exported in centimetres is 100× too large.
2. **Origin** — where is (0, 0, 0)? For a car you want it on the ground under the centre.
3. **Orientation** — which way is forward and which way is up?

Fix these in Blender ("Apply All Transforms") or with a wrapper group. Do not scatter compensating numbers through your code.

## 4.8 Textures

```js
const texture = await new THREE.TextureLoader().loadAsync('/wood.jpg')
texture.colorSpace = THREE.SRGBColorSpace  // for colour textures
texture.wrapS = texture.wrapT = THREE.RepeatWrapping
texture.anisotropy = renderer.capabilities.getMaxAnisotropy()  // sharper at grazing angles
```

Things to know: **UV mapping** (how a 2D image wraps a 3D surface), **mipmaps** (smaller pre-blurred copies used at a distance), and **filtering** (`LinearFilter`, `NearestFilter`).

## 4.9 Where to find models, and licences

- **Sketchfab** — the largest library; filter by "downloadable" and check each licence.
- **Poly Haven** — CC0 models, textures and HDRIs.
- **Three.js examples** — the repository ships sample models, which is where this project's car comes from.

Always read the licence. The car here is "Ferrari 458 Italia" by vicent091036, licensed CC BY 4.0, which requires credit — hence the line in the page footer. It also carries a real manufacturer's design and badges, which is a separate concern from the model's licence for anything commercial.

## Exercises

1. Download a free glTF model, drop it into gltf.report, and write down its node names, triangle count and texture sizes.
2. Load it in plain Three.js and log the hierarchy with `traverse`.
3. Replace one material and hide one part (`object.visible = false`).
4. Run `gltf-transform optimize` on it and compare the file size before and after.
5. In this project, change which nodes glow: make the `lights` node emissive as well as `leds`.
