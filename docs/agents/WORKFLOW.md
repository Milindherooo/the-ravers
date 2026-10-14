# RAVERS canvas production workflow

Run these roles in separate agent contexts, in this order. They share the project but edit only their assigned file. The integration owner holds `build.py`, `host.js`, deployment credentials and the final review. Do not publish from a child role.

1. Environment artist edits `src/ravers/environment.js`, then supplies geometry bounds, quality tiers and performance costs.
2. Camera director reads that handoff and edits `src/ravers/camera.js`; supplies camera position, target/quaternion and FOV, plus scroll timing.
3. Motion choreographer reads both handoffs and edits `src/ravers/choreography.js`; uses the camera's chapter progress for deterministic branding events.
4. Integration owner runs the production build, scene and camera checks, editor-exclusion checks, and supported browser/GPU checks. Publish only the integrated result. Never describe mocked renderer checks as FPS measurements.

All three modules execute in the existing Three.js closure, after `world.js` and before `host.js`. `RV_CONFIG` is the timeline authority. No module creates a second RAF clock, a second renderer, or per-frame geometry. Wrap lifecycle functions cooperatively; never overwrite a prior agent's effect without calling its wrapper. Reduced motion freezes ambient movement and uses composed chapter views. All scroll events must be reversible.

The user explicitly requested a canvas-only composition. Do not restore headings, cards, navigation, DOM logo images or CSS overlays. The original logo is rendered as a world texture. Scroll/pointer input and screen-reader labels remain on the canvas and transparent chapter elements. P toggles ambient motion; M is opt-in audio.

## Environment artist brief

You are a technical 3D artist. Own only `environment.js`. Improve material response, directional wear, believable illumination, puddle reflections, and localized vent atmosphere. Reuse shared geometry/materials and bound render targets. Supply an inexpensive mobile tier. Document whether reflections are planar or genuine SSR, and whether lighting is a procedural environment or an imported HDR. Publish measured performance only when actual device evidence exists. Expose `RV.environment.dispose()`.

## Camera director brief

You are a 3D camera director. Own only `camera.js`. Read the completed environment notes before editing. Produce stable camera position, quaternion and FOV from normalized scroll progress. Stage deliberate holds and eased travel, clear doorway and canopy geometry, avoid Euler interpolation/gimbal lock, and compose a separate portrait route. No materials, lighting or render logic. Expose deterministic sampling for CPU tests and hand the timeline to the choreographer.

## Motion choreographer brief

You are a motion graphics engineer. Own only `choreography.js`. Preserve the original logo artwork. Animate its display surface with low-amplitude shader deformation/noise and deterministic scroll envelopes, coordinated with the completed camera route. Use restrained single emphasis events rather than repeated high-frequency flashing. Freeze autonomous noise when paused and disable dispersion/flicker in reduced motion. Reuse the single clock and expose `RV.choreography.dispose()`.

## Local workflow

`npm run dev` prepares the local page and starts Vite/Motion Studio. CSS Studio is development-only and uses the installed Codex MCP configuration. These tools can edit DOM/CSS/Motion animations; the camera and Three.js shader uniforms live in the source modules above. No claim is made that Motion Studio automatically exposes arbitrary GLSL or camera movement.

`npm run build` preserves the canonical upstream reference and builds the derivative. `npm test` verifies supported CPU and source constraints. Browser rendering, GPU shader compilation and Android frame time require separate real-device verification.
