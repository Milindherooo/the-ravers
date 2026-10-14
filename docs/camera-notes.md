# Camera direction handoff

Load `src/ravers/camera.js` after environment and before choreography/host, inside the same authored engine closure and before JOBS run. The file adds camera data/math only. It preserves original `buildRig` through a cooperative wrapper, including camera layers and temporary camera. It replaces `applyCamera`: the original interpolated look target could pass through the camera during the lookback; the original portrait dolly could push a camera through walls. `fitAspect` is now a no-op. No renderer, clock, loop or listeners are added.

`RV_CONFIG.camera` and `CAM` reference the six new chapter records. `RIG.smooth` is the input, in chapter units 0..5. Keep the existing `RV_CONFIG.travel` [.12,.86], `rvTravel`, scroll damping and reduced-motion policy. There is no second normalized smoothstep on progress. Shape-preserving cubic Hermite interpolation gives continuous tangents and no positional overshoot; each coordinate stops before reversing. The endpoints settle. Existing scroll holds occupy the first 12% and last 14% of each chapter interval. Movement takes the middle 74%, plus the existing damping; at damping 6.2, a target step takes about .48 seconds to settle 95%. Actual travel duration depends on scrolling, not a new timer.

| Chapter | Desktop position | Desktop authored look point | FOV | Portrait position | Portrait FOV |
|---|---|---|---:|---|---:|
| 0 Entrance | 3.4, 3.4, 18 | 0, 7.3, -7.16 | 48 | .8, 3.9, 20 | 63 |
| 1 Threshold | 0, 5.6, 7 | 0, 7.8, -7.16 | 54 | 0, 5.6, 8.4 | 74 |
| 2 Empty hall | -.45, 3.1, -17 | 0, 3.8, -33 | 55 | 0, 3.15, -16 | 65 |
| 3 Booth | 1.6, 3.45, -28.8 | 0, 1.65, -32 | 55 | .7, 3.5, -28.2 | 69 |
| 4 Lookback sunrise | -.8, 3.6, -26 | 0, 4.6, 1 | 53 | -.25, 3.6, -26 | 62 |
| 5 Afterglow | .1, 2.55, -14 | 0, 5, 8 | 52 | 0, 2.7, -14 | 63 |

The threshold crane height is deliberate: the full supplied logo at y11.4 stays above the canopy silhouette. Then the camera descends beneath the canopy and crosses the aperture at progress 1.5995–1.6405 across tested screen shapes. The outward door sweep is only entered after doors are fully open at 1.2. Interior positions remain in the central lane; the booth camera stays in front of the desk and speaker stacks. The lookback turns left across the room using an unwrapped direction angle, then eases toward the entrance light. Orientation is always constructed with a fixed world-up look matrix and a normalized quaternion; pitch remains far from its pole. The direction path cannot collapse to a zero look vector during the turn.

Portrait composition blends continuously from aspect 1.15 to .55 and uses separate authored positions, aim and wider lenses. There is no aspect-derived displacement after entering. Pointer parallax is bounded to .1m horizontal and .055m vertical at most, diminishing further in portrait. The host normally supplies only ±.35, so normal desktop movement is smaller.

## Choreography API and visibility

`RV.camera.sample(progress, aspect=16/9, pointerX=0, pointerY=0, out?)` returns `{position, target, direction, quaternion, fov, progress, portrait}` with Three vectors/quaternion. The returned `target` is a consistent 20m forward direction reference, not the original authored focal-point distance. It is deterministic and reversible with no frame history. Use `RV.camera.createSample()` and supply `out` to reuse vector allocations. `RV.camera.current` is the reused live sample. `RV.camera.chapters` exposes complete wide and portrait records.

`RV.camera.windows` exposes these chapter-progress windows:

| Window | Range | Meaning |
|---|---|---|
| logo | 0–1 | Entire original facade logo framed; its corner rays clear canopy |
| logoDeparture | 1–1.18 | Exit entrance typography; do not rely on artwork visibility after this |
| entry | 1.2–2 | Doors fully open; camera crosses aperture around 1.60–1.64 |
| booth | 2.65–3.25 | Approach and early departure around console |
| turn | 3–4 | Continuous left lookback; avoid frontal-only typography assumptions |
| sunrise | 4–5 | Portal and exterior light are the visual destination |

These are composition cues, not new timelines. Keep lighting on `RV_CONFIG.dawn` [3.55,4.35] and door opening on `RV_CONFIG.doorOpen` [.35,1.2]. Preserve the original logo artwork. No additional DOM overlays are required by this layer.

## Exact validation and limits

`node --check src/ravers/camera.js` passed. `node /tmp/ravers-camera-test.cjs` passed with the vendored legacy Three math library. That temporary, untracked CPU harness tested 120,012 samples: 10,001 points on 0..5 for four aspects (16/9, 1, 9/16, 390/844) and three pointer extremes. It checked finite values, unit quaternion length within 1e-12, deterministic resampling, floor/roof/central-lane bounds, clearance of the two rotating door leaf boxes, delayed entry into the outward sweep, camera application and C1 position joins. Maximum position change per .0005 progress was .01442m; maximum quaternion angular change was .002215 radians. All four logo corners stayed within the view frustum and their sight rays cleared the canopy during 0..1 at 101 samples for every aspect/pointer combination.

The camera allocates its live vectors once and performs a few scalar cubic evaluations plus one look matrix/quaternion conversion per update. Original unused rig curves remain for upstream compatibility; no new GPU resource or render pass is introduced. This is an implementation cost statement, not measured frame-rate evidence. The harness does not establish GPU rendering, reflections, fog sorting, text legibility, wall occlusion outside tested canopy rays or aesthetic quality. Camera rendering has not been browser-verified. Full scene/browser QA remains necessary.
