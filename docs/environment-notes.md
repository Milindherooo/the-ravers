# Environment and lighting extension

`src/ravers/environment.js` is evaluated in the authored engine closure **after `world.js`, before chapter choreography and the final host, before JOBS execute**. It requires the same vendored legacy Three.js; it does not import another Three build. The original reference and source assets are unchanged.

No extra initialization call is needed. Cooperative wrappers call the previously defined `buildShell`, `rvAtmosphere`, `updateWorld`, `render`, and `resize` implementations. Later wrappers should follow the same pattern. Scene changes are finished by `rvAtmosphere`, after speakers and props exist. The host should call `RV.environment.dispose()` during final non-BFCache teardown, alongside normal scene/post disposal. The method is idempotent. It does not dispose the renderer or audio.

## Added physical detail

Three merged meshes add roof purlins, beam gussets/bolts, diagonal knee supports, a suspended supply duct with hangers, outlet grilles, service vent slats, gutter/downpipe shoes and drain grilles, mezzanine steps/nosings/handrail, and left-wall cable tray. Static root-level boxes are consolidated into six instanced material/shadow groups; the current scene test finds **104 meshes replaced by six batches**, a structural reduction of 98 potential scene draw submissions per full scene pass. This is not a GPU benchmark. Door assemblies, the animated seam, luminaire signals, banners, speaker drivers, logo, and all referenced animated handles are excluded. Identical speaker cone materials are shared.

The added geometry uses the shared concrete/steel/edge/dark palette. Material hooks add subtle world-space floor/roof occlusion and doorway fill in linear outgoing light, before tonemapping. These are analytic, art-directed baked-light approximations, not a ray-traced light bake or a photographed HDR environment. Existing HDR emitters, half-float post, and dawn lighting remain in charge of the grade.

## Reflection implementation and exact limitation

**This implementation is planar reflection, not SSR.** The existing post target has a depth buffer but no sampleable depth texture. A correct SSR pass would require a readable scene depth attachment, reconstruction and ray intersection shaders, puddle/material masks, temporal handling and another compositing path. The retained pipeline is not silently relabeled as SSR.

Eight irregular coplanar puddles share one reflection material and one reduced-resolution target. A camera mirrored across floor `y=.026` uses an oblique clipping plane and projects the reflected scene into those puddles. It can reflect off-screen scene geometry, unlike SSR. It does cost an additional full scene pass on refresh, is valid only for the floor plane, and updates every three rendered frames by default (each requested render while motion is paused). Reflection refresh excludes puddles, vent fog and the old additive seam streak to prevent feedback. Capture does not run a second post chain or card views. Existing viewport, scissor, target and shadow update state are restored in `finally`.

The capture's longest dimension is at most 512 pixels, with a minimum 128-pixel minor dimension for unusual aspects. It uses half-float when the authored HDR path is available and byte format otherwise. Fresnel, low-amplitude normal distortion and irregular outlines break up the capture; motion uses the shared `WORLD.uT` clock. No separate time source or fast flashes are added.

Live captures are disabled on `LOW`, coarse pointers, adaptive scale below `.72`, and cameras too near/below the floor. The fallback is a subdued procedural sky/seam approximation: it **does not reflect arbitrary objects**. `RV.environment.mode` reports `planar` or `procedural`. Changing reflection quality can be followed by `RV.environment.invalidate()`; resize already invalidates it. No automatic quality upgrade overrides the host's performance governor.

## Atmosphere and quality budget

Fog originates at the exterior service vent `(11.5,5.6,-6.2)`, the downpipe shoes `(-9,.43,-6.5)` and `(9,.4,-6.5)`, and the interior duct outlet `(-8.75,7.5,-23)`. Three soft, overlapping depth-tested transparent layers per source give modest volume cues. Mobile/coarse uses two layers; the lowest adaptive tier keeps only two sources. These are anchored translucent billboards, **not a physically integrated volumetric ray marcher**. Their clock freezes when the shared clock freezes, and their visibility is reversible with the camera journey. The old broad haze planes and artificial seam streak are hidden, keeping their handles valid for the base updater.

No new realtime light or realtime shadow source is added. Merged hardware does not cast shadows. Fog does not write depth. Reflection targets allocate lazily, resize in place and are owned by `RV.environment.dispose()`. Owned texture, geometry, material and target resources are also registered there; scene traversal may encounter some of these resources too, so the host should keep its ordinary deduplicated resource teardown.

## Bounds and camera constraints

World coordinates are meters. Bounds describe solid geometry and recommended clearance, not an implemented collision solver. Keep chapter indices exactly `0..5`. The new layer does not modify `CAM`, scroll mapping, or chapter timing.

| Geometry / region | X range | Y range | Z range | Camera guidance |
|---|---:|---:|---:|---|
| Main warehouse envelope | -11 to 11 | 0 to 10 | -44 to -8 | Stay inside walls, below roof |
| Loading apron | -16 to 16 | 0 to 14.3 | -7.5 to 17 | Entrance sightline remains open |
| Door leaves, swept | -4.2 to 4.2 | 0 to 8.85 | -7.9 to -3.6 | Outward-opening sweep; cross only after the shared door opening curve clears the camera |
| Portal piers | abs(X) 4.0 to 16 | 0 to 14 | -8.5 to -7.5 | Cross portal within abs(X) < 3.5 |
| Interior columns | abs(X) 9.65 to 10.4 | 0 to 10 | At Z -12,-17,-22,-27,-32,-37,-42 | Keep abs(X) < 8.9 around column rows |
| Left overhead duct / hangers | -9.4 to -8.1 | 7.4 to 9.7 | -40.5 to -10.5 | Avoid lateral crane moves into this volume |
| Right mezzanine deck and rails | 7.4 to 10.8 | 5.3 to 6.9 | -32.5 to -19.3 | Do not cross the deck/rail band |
| New mezzanine steps / rail | 8.1 to 10.25 | 0 to 6.1 | -24.5 to -17.5 | Keep camera X < 7.4 in this approach |
| Speaker stacks | abs(X) 2.6 to 5.9 | 0 to 6.95 | -36.5 to -35.0 | Stop in front of Z -34.3 for frontal speaker shots |
| Mixing desk | -2.3 to 2.3 | 0 to 1.8 | -33 to -31 | Camera above Y 2.4 or in front of Z -30.4 |
| Banners | -8.8 to -2.3 | 3.4 to 7.0 | -22.2 to -19.5 | Check cloth composition before moving left of X -2 |
| Front canopy | -5.3 to 5.3 | 9.3 to 10.8 | -8 to -4.4 | Entrance camera below Y 8.7 |
| Service vent / outer fog | 10.2 to 12.8 | 4.8 to 6.5 | -6.8 to -5.7 | Detail camera should stop ahead of Z -5.3 |
| Clear central approach (guideline) | -3 to 3 | .8 to 8 | -30 to 16 | Excludes moving doors; use chapter open state |

`RV_ENV_CONFIG.bounds` provides the main envelope, apron, central-lane guideline and booth boxes for subsequent integration. Additional detailed constraints are tabulated above. Fog and puddles are intentionally traversable; keep camera Y > .4 for the floor.

## Verification

`node --check src/ravers/environment.js` passed. A temporary extension of the existing real-Three renderer-stub harness passed full construction, all 501 camera samples and rewind, dawn, portrait fitting, eight puddles, twelve desktop fog layers, instancing count, finite reflection camera/texture matrices at all six chapters, shader hook substitution, procedural fallback and repeated disposal. The extension was run outside the repository so it does not modify root-owned test files.

This validation executes real Three.js geometry/matrix/material APIs but does not compile GLSL on a GPU, inspect browser screenshots, measure GPU timings, or establish mobile frame rate. Those remain browser/device QA tasks. In particular, verify the oblique reflection and transparent fog sorting against actual renderer output before describing visual or performance results as measured.
