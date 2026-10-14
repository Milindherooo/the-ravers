# RAVERS.IN — the warehouse journey

A canvas-only, scroll-driven Three.js experience. The viewport contains the warehouse and original supplied logo. Six transparent chapter elements provide reversible scroll progress. There are no visible DOM headings, cards, navigation, image elements or CSS overlays.

## Development

Use Node >=22.13 and npm. Run `npm ci`, `npm run dev`, `npm run build`, `npm test`. The current Node runtime is 24.19.0. Production retains the static Python/esbuild pipeline; Vite is a local development/editor adapter.

- `src/ravers/body.html`: canvas and transparent scroll anchors.
- `src/ravers/overrides.css`: full-viewport canvas and input surface.
- `src/ravers/world.js`: base warehouse, original logo loading and shared clock.
- `src/ravers/environment.js`: reflection, lighting/material and vent atmosphere layer.
- `src/ravers/camera.js`: camera-only scene traversal and portrait framing.
- `src/ravers/choreography.js`: original-logo shader and scroll-linked motion.
- `src/ravers/host.js`: boot, keyboard input, reduced motion, context loss and resource teardown.
- `src/ravers/build.py`: verifies canonical source and composes the derivative.

P pauses ambient movement; scrolling still changes position. M starts/stops optional original synthesized sound. Arrow/Page keys scroll, and Home returns to the entrance. The canvas has screen-reader labels. Motion pauses in hidden tabs. Reduced-motion mode uses composed views and fades. Context loss shows the supplied logo fallback and an accessible reload description.

## Specialist workflow

[Agent workflow](docs/agents/WORKFLOW.md) describes the sequential Environment → Camera → Choreography roles, file ownership and integration contracts. The environment handoff records scene geometry and performance costs before camera work starts. Camera data then constrains logo events. The integration owner holds publication and checks. Each role has an isolated context and a separate source module.

All motion uses one clock. Camera/door/dawn events are deterministic with scroll. Ambient shader motion uses that clock and stops when paused. No role is allowed to add another renderer or animation loop. Runtime configuration and diagnostics are exposed through `window.__ravers`, `window.__raversConfig` and `RV` within the engine. `window.__ravers.metrics()` reports a rolling 120-sample render cadence, p95 frame interval, p95 CPU submission time, reflection mode and adaptive scale. It does not report GPU timer measurements.

## Source and assets

`vendor/kage/upstream` preserves eight registered files and fourteen WebPs. `dist/landing-pages/kage.html` is the exact canonical reference, SHA-256 `c8e06b90397ac246baf0ab6f32f5f6b570acc6fe03c7009f711b579fb72d9f49`. Build verifies all 22 expected hashes. The original Three.js runtime, procedural helpers and post-processing pipeline are reused. The derivative is explicitly original RAVERS adaptation, not byte-exact Kage.

The original user-supplied logo is retained byte-for-byte in `dist/assets/ravers-original-logo.png` and sampled into the world texture. Active venue geometry, material wear and atmosphere are procedural. No synthetic crowd or imported temple imagery is instantiated.

The source-derived Skiper/Watermelon components and licenses remain archived in `src/ui` and `vendor/ui`, but the production canvas entry does not mount or bundle them. Attribution/license records are retained with the code.

## Editors

Motion 14.1.0, Motion Studio 2.1.0 and CSS Studio 1.2.0 are installed. `motionStudio()` precedes the React plugin in `vite.config.mjs`. CSS Studio is imported only in development. `.env.local` selects Codex without a model override; `@openai/codex-sdk` reuses the user's existing local sign-in. `.env.example` and the dev preparation script preserve this setup across checkouts. No credentials are stored in source.

Restart the local agent and run `/studio` to activate the installed CSS Studio MCP. These editors can inspect supported DOM/CSS/Motion work. The production experience now uses Three.js; arbitrary GLSL and camera motion are not automatically exposed as Motion Studio tracks. Edit those parameters in the source modules. Applying edits through Motion Studio's subscription UI is left to the user.

## Verification limits

The real vendored Three.js maths and a stubbed renderer validate scene construction, camera transforms, reverse scroll, dawn and portrait fitting. Source tests verify canonical assets and production editor exclusion. These checks do not compile shaders on a GPU or establish visual quality/FPS.

`npm run dev` reported a successful Vite startup in this managed environment, but a subsequent HTTP request could not reach the local port. Supported browser QA is unavailable. Screen recordings, GPU render correctness, Studio panel previews and mid-range Android frame times remain unverified. Performance tiers are engineering safeguards, not a measured 60 FPS guarantee.

## Integrated result

All three specialist passes are integrated. The environment adds eight coplanar puddles, localized layered fog and industrial infrastructure; 104 static boxes are replaced by six instanced groups. Reflections use a bounded 512-pixel planar capture, not SSR. The mobile fallback approximates the seam and sky. Lighting uses analytic material shaping rather than an imported HDR map; vent fog uses depth-tested layers rather than volumetric ray marching. These substitutions bound mobile cost and are documented in `docs/environment-notes.md`.

The camera's shape-preserving interpolation and normalized quaternion direction keep the original logo framed through progress 0–1, cross the open doorway around 1.60–1.64, reach the booth and turn toward sunrise. Original logo pixels are mapped across one 2,304-vertex surface with subtle shared-time floating deformation, reversible tile separation and a single light emphasis. No extra logo draw call is introduced. Reduced motion removes these effects.

Validated: full source/build and TypeScript, environment matrices/reflection fallback, 120,012 camera samples (including doorway and canopy clearance), 5,001 choreography samples (including UV continuity, rewind, reduced motion and cleanup), and production editor exclusion. Shader hook checks use the actual vendored Three shader sources but do not compile them on a GPU. See the three specialist notes for exact bounds and limitations.
