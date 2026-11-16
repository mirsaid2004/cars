# 5. Animation and camera work

Motion is where "cinematic" comes from. The techniques are few, and they are the same ones in every polished WebGL site.

## 5.1 Four kinds of animation

| Kind | Driven by | Tool |
|------|-----------|------|
| **Procedural** | time and maths, every frame | your render loop |
| **Tweened** | a start, an end, a duration and an ease | GSAP |
| **Scroll- or input-driven** | a value the user controls | your loop + a scroll library |
| **Keyframed (authored)** | clips made in Blender | `AnimationMixer` |

This project uses the first three. The car model has no authored clips.

## 5.2 Delta time, always

Anything that advances per frame must be multiplied by the seconds since the last frame:

```js
wheel.rotation.x -= angularSpeed * dt
```

Also clamp `dt`. When a tab is in the background the next frame can report several seconds, and everything jumps. Every `useFrame` in this project starts with:

```js
const dt = Math.min(delta, 0.05)
```

## 5.3 Damping — the most useful trick in this file

Do not set a value directly to its target. Move it a fraction of the remaining distance each frame. The result eases out naturally and reacts gracefully when the target changes mid-motion.

The naive version, `x += (target - x) * 0.1`, depends on frame rate. The correct version is exponential:

```js
x = THREE.MathUtils.damp(x, target, lambda, dt)
// equivalent to: x + (target - x) * (1 - Math.exp(-lambda * dt))
```

`lambda` is the speed: 2 is lazy, 5 is responsive, 12 is snappy.

Where this project uses it:

- the camera's scroll position chases the real scroll position (`CameraRig.jsx`),
- pointer parallax,
- the "speed" value that spins the wheels up and down (`Car.jsx`),
- the turntable rotation,
- paint colour, via `color.lerp(target, 1 - Math.exp(-4 * dt))`.

If you take one habit from this guide, make it this one.

## 5.4 Easing

An easing function reshapes a 0→1 progress value.

- **ease-out** (fast start, gentle stop) — things arriving, UI responses.
- **ease-in-out** — camera moves between two holds.
- **linear** — only for things tied directly to scroll or to constant motion.

`CameraRig.jsx` uses *smootherstep* between shots:

```js
const ease = (x) => x * x * x * (x * (x * 6 - 15) + 10)
```

Its slope is zero at both ends, so the camera lingers on each composed shot and travels quickly in between. That lingering is what makes scroll-driven camera work feel directed instead of mechanical.

## 5.5 GSAP for timelines

GSAP animates any numeric property of any object, including plain JavaScript objects, and sequences those animations precisely.

```js
gsap.to(rig, { intro: 1, duration: 5.2, ease: 'power3.inOut' })
```

That one line is this project's opening shot. It does not touch the camera. It animates a plain number, `rig.intro`, from 0 to 1, and the scene *reads* that number every frame: the camera uses it to descend and sweep in, the light rig uses it to fade up, and the headlights use it to flicker on.

This is a pattern worth copying: **animate a single progress value, and derive everything else from it.** It keeps complex sequences in sync automatically.

`gsap.timeline()` chains steps with relative offsets (`'<'` = start with the previous step, `'<0.5'` = half a second after it starts), which is how the loader fade, the camera move, the letterbox bars and the text reveals are choreographed in `src/App.jsx`.

## 5.6 Scroll-driven 3D

The architecture used here, and by most sites of this kind:

1. A **fixed, full-screen canvas** sits behind the page.
2. Ordinary HTML sections scroll over it.
3. Scroll position is converted to a single number.
4. The 3D scene reads that number each frame.

In `App.jsx`, the number is `rig.scroll`: the index of the current section plus the fraction of the way to the next one, so `2.5` means halfway between the third and fourth sections. It is computed from the sections' real positions on the page, which keeps camera and content aligned at any screen size.

**Smooth scrolling.** A mouse wheel scrolls in jumps. Lenis turns that into a smooth glide, which makes scroll-linked 3D feel continuous. It is combined with GSAP's ticker so there is one clock for everything.

**ScrollTrigger** (a GSAP plugin) handles the HTML side: revealing headlines when a section enters, counting numbers up, fading the hero text out.

## 5.7 Designing a camera rig

A camera has a position and a target. The naive approach — interpolate position A to position B in a straight line — fails as soon as the line passes through your subject.

`CameraRig.jsx` stores each shot in **orbit coordinates** instead:

```js
{ t: [0, 0.6, 0], r: 9, az: 90, el: 3, fov: 26, sx: -0.15, sy: 0.02 }
```

- `t` — the point being looked at
- `r` — distance from it
- `az` — angle around it (0 = nose-on)
- `el` — angle above the ground
- `fov` — lens
- `sx`, `sy` — where to place the subject in the frame

Interpolating *those* numbers makes the camera travel along arcs around the car. It can never cut through the bodywork, and you choose the direction of travel simply by choosing the azimuth values (going from 152° to 292° swings around the back; that is why the last shots use 396° and 360° instead of 36° and 0°).

Further touches in the same file, each small and each cumulative:

- **A wider swing mid-move** — `r += sin(k·π) × 1.4` pulls the camera out halfway through a transition, like a crane move.
- **Breathing** — slow sine waves on azimuth and elevation, so the frame is never dead still.
- **Pointer parallax** — a few degrees of orbit following the mouse.
- **Handheld shake** — tiny high-frequency offsets, scaled by speed, in the performance section only.
- **Lens change** — the field of view widens slightly with speed.

## 5.8 Framing: placing the subject off-centre

Text needs space. Moving the look-at target sideways changes the perspective on the object. Instead, `camera.setViewOffset(...)` shifts the *frame* without changing the viewpoint — like cropping a larger photograph. That is what `sx` and `sy` do: the car slides to one side of the screen while its perspective stays that of a centred shot.

## 5.9 Responsive cameras

A shot composed for a wide screen does not fit a tall one. `CameraRig.jsx` computes a `portrait` factor from the aspect ratio and uses it to pull the camera back, remove the horizontal offset and lift the car into the upper half of the screen. Always decide what your camera does in portrait.

## 5.10 Authored animation (for completeness)

If a model contains clips:

```js
const mixer = new THREE.AnimationMixer(gltf.scene)
mixer.clipAction(gltf.animations[0]).play()
// in the loop:
mixer.update(dt)
```

Actions can be cross-faded, looped, paused and scrubbed (`action.time = ...`), which lets you tie an authored animation to scroll.

## Exercises

1. Make a cube follow the mouse, first by setting its position directly, then with `damp`. Feel the difference at lambda 2, 6 and 15.
2. Animate a plain object `{ p: 0 }` with GSAP and use `p` to drive three unrelated things at once (a position, a colour, a light intensity).
3. Build a three-shot camera path around any object using orbit coordinates and smootherstep, driven by scroll.
4. In this project, edit one entry of `SHOTS` in `src/scene/CameraRig.jsx`. Change `fov` from 26 to 60 and compensate with `r` so the car stays the same size. Note how the car's proportions change.
5. Remove the `ease()` call in `sample()` (use `k` linearly) and scroll through the page. Describe what was lost.
