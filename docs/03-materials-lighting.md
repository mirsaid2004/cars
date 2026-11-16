# 3. Materials, lighting and colour

This is the chapter that decides whether your work looks like a tech demo or like a photograph. Most "why does my scene look bad" questions are answered here.

## 3.1 Physically based rendering (PBR)

`MeshStandardMaterial` and `MeshPhysicalMaterial` describe a surface with a few physically meaningful numbers instead of artistic guesses. Learn what each one does by sight.

| Property | Range | Meaning |
|----------|-------|---------|
| `color` | colour | base colour (for metals, the colour of the reflection) |
| `metalness` | 0–1 | 0 = plastic, wood, paint. 1 = bare metal. Rarely in between |
| `roughness` | 0–1 | 0 = mirror, 1 = chalk |
| `normalMap` | texture | fakes small surface detail without extra triangles |
| `aoMap` | texture | darkens creases |
| `emissive`, `emissiveIntensity` | colour, number | light the surface gives off itself |
| `envMapIntensity` | number | how strongly it reflects the environment |

`MeshPhysicalMaterial` adds:

| Property | Use |
|----------|-----|
| `clearcoat`, `clearcoatRoughness` | a glossy lacquer layer on top — **car paint** |
| `transmission`, `thickness`, `ior` | real refractive glass and liquids |
| `sheen` | cloth and velvet |
| `iridescence` | soap bubbles, oil film |

Each of these extras adds shader cost, and `transmission` requires an extra render pass. Use them where they are visible.

### The car paint in this project

`src/scene/Car.jsx`:

```js
new THREE.MeshPhysicalMaterial({
  color: '#e01a08',
  metalness: 0.85,       // metallic flake base
  roughness: 0.42,       // the base is fairly diffuse…
  clearcoat: 1,          // …under a full lacquer layer
  clearcoatRoughness: 0.03, // that is almost mirror-smooth
})
```

That combination — a rough metallic base beneath a sharp clear layer — is the standard recipe for automotive paint. The glass there is deliberately *not* using `transmission`: it is a dark, fully reflective, partly transparent material, which is far cheaper and reads correctly on a car.

## 3.2 A metal surface with nothing to reflect is black

This surprises everyone once. A material with `metalness: 1` has no diffuse colour at all — it only shows reflections. With plain lights and no environment, it renders nearly black. **PBR materials need an environment map.**

## 3.3 Lights

| Light | Behaviour | Cost |
|-------|-----------|------|
| `AmbientLight` | flat fill from everywhere | trivial |
| `HemisphereLight` | sky colour from above, ground colour from below | trivial |
| `DirectionalLight` | parallel rays, like the sun | low |
| `PointLight` | a bulb, radiates in all directions | medium |
| `SpotLight` | a cone | medium |
| `RectAreaLight` | a glowing rectangle (softbox) | higher, no shadows |

Light intensities use physical units in current Three.js, so values such as 3 for a directional light or tens to hundreds for a point light are normal. Old tutorials that use `intensity: 1` for everything will look dim.

## 3.4 Environment maps and image-based lighting (IBL)

An environment map is a 360° image surrounding the scene. Every PBR surface is lit and reflected by it. For product and car visuals this matters more than any lamp.

Two ways to get one:

1. **An HDR photograph** (`.hdr` or `.exr`), loaded with `RGBELoader` / `EXRLoader` and assigned to `scene.environment`. Free ones are available from Poly Haven.
2. **A rendered light rig** — you build a small scene of glowing shapes and render it into a cube map. This is how studio photography actually works, and it is what this project does.

### The light rig in this project

`src/scene/Studio.jsx` uses drei's `<Environment>` with child meshes instead of an image:

- a big soft ceiling panel,
- a row of bright strips above the car that continuously travel along its length,
- a warm side panel that takes the colour of the chosen paint,
- a cold blue kicker on the opposite side,
- two rings at the nose and tail.

`frames={Infinity}` re-renders that rig into the environment map every frame, so the moving strips slide across the bodywork as live reflections. That sweeping highlight is the main reason the paint looks alive. The trade-off is cost: a live environment is six extra small renders per frame, which is why its resolution is kept at 256.

Lesson: on a glossy object you are not lighting the surface, you are **designing what it reflects**. Long, soft, bright shapes give long, elegant highlights.

## 3.5 Shadows

Real-time shadows are expensive and fiddly. To enable them:

```js
renderer.shadowMap.enabled = true
light.castShadow = true
mesh.castShadow = true
floor.receiveShadow = true
```

Then tune `light.shadow.mapSize`, the shadow camera's bounds, and `light.shadow.bias` to remove artefacts.

Often you can avoid them entirely:

- **Baked shadows** — a pre-rendered texture. This project puts a soft ambient-occlusion image on a plane under the car (`car_ao.png`, with multiply blending, in `Car.jsx`). It costs almost nothing and looks softer than a real-time shadow.
- **Contact shadows** — drei's `<ContactShadows>` renders a cheap blurred blob from below.
- **Accumulated soft shadows** — drei's `<AccumulativeShadows>` for static scenes.

## 3.6 Colour management

Getting this wrong gives washed-out or over-dark results.

- Colour textures (base colour, emissive) are stored in **sRGB**. Set `texture.colorSpace = THREE.SRGBColorSpace`. glTF loaders do this automatically.
- Data textures (normal, roughness, metalness, AO) are **linear**. Leave them alone.
- Lighting maths happens in linear space, and the renderer converts to sRGB for the screen (`renderer.outputColorSpace`, sRGB by default).

Rule of thumb: if it is a picture of colour, it is sRGB. If it is numbers pretending to be a picture, it is linear.

## 3.7 Tone mapping and HDR

Real light spans a huge range; a screen shows 0 to 1. **Tone mapping** compresses the scene's high-dynamic-range values into that range gracefully instead of clipping them to white.

```js
renderer.toneMapping = THREE.ACESFilmicToneMapping  // filmic contrast
renderer.toneMappingExposure = 1.0                   // overall brightness
```

Options include `ACESFilmicToneMapping` (cinematic, slightly desaturating), `AgXToneMapping` and `NeutralToneMapping` (truer colours — good for product shots).

Two details that matter in this project:

- Glowing things (headlights, speed streaks, light strips) are given colour values **above 1** and marked `toneMapped={false}`. Values above 1 are what the bloom effect picks up.
- When you use a post-processing chain, tone mapping must happen **once, at the end**, as a pass — not on the renderer. See `<ToneMapping>` as the last effect in `src/scene/Experience.jsx`.

## 3.8 Fog and atmosphere

`scene.fog = new THREE.Fog(color, near, far)` fades objects into a colour with distance. Set the fog colour equal to the background colour and a floor disappears into the horizon without a visible edge. This project does exactly that to hide the edge of the reflective floor.

## 3.9 Reflective floors

The floor in `Studio.jsx` uses drei's `MeshReflectorMaterial`: it renders the scene a second time from a mirrored camera and blurs the result. It looks excellent and costs roughly one extra scene render per frame. It is the single most expensive thing in this project after the main render.

## Exercises

1. Put a sphere in a scene with `MeshStandardMaterial` and build a small control panel (try `lil-gui`) for `metalness` and `roughness`. Watch what happens with and without an environment map.
2. Load an HDR environment from Poly Haven and assign it to `scene.environment`. Try three different ones on the same object.
3. Recreate the car paint material on a sphere. Then change one value at a time to learn what each contributes.
4. Switch between `ACESFilmicToneMapping`, `AgXToneMapping` and `NoToneMapping` and describe the difference in your own words.
5. In this project, open `src/scene/Studio.jsx` and change the size, position and brightness of the travelling strips. Watch the reflections on the bonnet change.
