# RAVERS.IN: complete hero source and setup

This is the complete current canvas-only warehouse build, including the original
logo, all local assets, the verified Kage reference, editable source, tests,
specialist agent briefs, and prebuilt production output. Start here; README.md
and docs/ explain the implementation and verification limits.

## 1. Prerequisites

- Node.js 24 LTS (the export was checked with 24.19.0) and npm.
- Python 3, available as the `python` command. No Python packages are needed.
- A browser with WebGL. Internet access is needed for npm's first installation.

Check in a terminal:

```sh
node --version
npm --version
python --version
```

The last command must report Python 3. If your computer only has `python3`,
replace `python` with `python3` in the build script in package.json and in
`execFileSync('python', ...)` in scripts/prepare-dev.mjs. A shell alias alone
does not change the executable launched by Node.

## 2. Run the editable project

Unzip, then open a terminal inside the resulting ravers-hero folder:

```sh
cd ravers-hero
npm ci
npm run dev
```

Open http://127.0.0.1:5173 (or the exact URL Vite prints if that port is busy).
Keep the terminal running. Stop it with Ctrl+C. Run commands from this project
folder. Keep package-lock.json; npm ci installs its locked dependency versions.

Scroll down to enter the warehouse and move toward dawn. Scroll up to rewind.
P pauses ambient motion. M toggles opt-in synthesized audio. Arrow and Page
keys scroll; Home returns to the entrance. Device reduced-motion preferences
are respected. There is no signup backend or ticketing integration in this hero.

## 3. Preview without installing npm dependencies

The current production build is included. From ravers-hero:

```sh
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. Use `python3` instead if appropriate. Do not open
dist/index.html directly with file://; root-relative assets require HTTP.

## 4. Build and validate

```sh
npm run build
npm test
python -m http.server 8000 --directory dist
```

Publish the CONTENTS of dist/ as the root of a static website, preserving all
subdirectories. No Node or Python process is required on the production host.
Asset URLs assume a domain root, not a nested /hero/ path. To embed in another
app, serve dist at its own origin or adapt root-relative paths deliberately.
Do not use `vite build`: this project intentionally builds through Python and
esbuild. Do not edit dist/index.html directly; the next build replaces it.

## 5. What to edit

| File | Responsibility |
| --- | --- |
| src/ravers/world.js | Warehouse geometry, signs, original-logo loading, shared clock, RV_CONFIG |
| src/ravers/environment.js | Materials, industrial details, puddle reflections, localized fog, quality limits |
| src/ravers/camera.js | Active camera stops, portrait framing, travel interpolation and holds |
| src/ravers/choreography.js | Logo shader deformation and reversible scroll-triggered emphasis |
| src/ravers/host.js | Startup, inputs, reduced motion, diagnostics and cleanup |
| src/ravers/body.html | Canvas and six transparent scroll chapters |
| src/ravers/overrides.css | Full-viewport canvas, scroll dimensions and fallback styling |
| src/ravers/build.py | Source verification and final-page composition |
| dist/assets/ravers-original-logo.png | Original supplied artwork; its crop is configured in rvLogo() |
| dist/sound.mjs | Opt-in synthesized sound |
| docs/agents/WORKFLOW.md | Environment, camera and choreography agent briefs and handoffs |

The source modules intentionally share the original renderer closure. build.py
inserts them in this order: world, environment, camera, choreography, host.
Do not import them independently as ES modules without refactoring that contract.
Use camera.js for the active camera route; world.js also retains base camera data.
Keep original logo dimensions/cropping in mind when replacing its asset.

## 6. Motion Studio and CSS Studio

Both are installed with npm ci. The Vite configuration starts Motion Studio;
no second server is required for this Vite setup. Its plugin precedes React.
The first dev launch creates .env.local with:

```dotenv
MOTION_STUDIO_AGENT_PROVIDER=codex
```

Use your own existing Codex sign-in. No credentials or model override are
included. Motion Studio's subscription login and applying edits are left to you.
Open the development page and use the Studio panel when available.

CSS Studio loads only in development. The supplied .codex/config.toml, .mcp.json
and .agents/skills/studio/ contain the installed agent integration. Restart your
local agent and run /studio to activate it. The production output excludes
Studio panels and instrumentation.

The active hero is procedural Three.js. Arbitrary GLSL, camera curves and mesh
deformation are not automatically Motion Studio timeline tracks. Edit those
source modules directly. Archived React UI components are included for reference
but are not mounted in the canvas-only hero.

## 7. Validation and known limits

The export's source, asset hashes, environment construction, camera samples,
choreography, TypeScript and production editor-exclusion tests passed. These
CPU/source tests do not compile shaders on a GPU. Browser appearance, Studio
panel interactions, recordings and mid-range Android FPS remain unverified.
This export does not claim measured 60 FPS.

Puddles use bounded planar reflections, not SSR. Lighting uses analytic material
shaping, not an imported HDR map. Vent fog uses layered geometry, not volumetric
ray marching. Read docs/environment-notes.md for mobile fallback behavior.

After running in a browser, window.__ravers.metrics() reports recent render
cadence, CPU submission times and quality mode. It is not a GPU timer result.
Profile on your actual Android target before treating it as production-approved.

## 8. Export contents

SOURCE_VERSION.txt identifies the source commit. CHECKSUMS.sha256 covers each
packaged file except itself. The source and bundled assets are unchanged from
that commit; SETUP.md, SOURCE_VERSION.txt and CHECKSUMS.sha256 are export additions.
Existing vendor provenance/license files remain included. The archive omits
node_modules, Git history, private environment files, caches and the managed
hosting account binding. You can host the included static build independently.
