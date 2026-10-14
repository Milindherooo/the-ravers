# Motion choreography handoff

Load `src/ravers/choreography.js` after `camera.js` and before `host.js`, within the same legacy Three closure before JOBS. The layer cooperatively wraps `rvLogo` and `updateWorld`. The original `rvLogo()` promise must finish successfully before geometry or shader hooks are installed; bitmap failures still propagate to the host fallback. No font recreation, replacement logo, DOM surface, renderer, RAF, clock, listener or render pass is added.

The original `RV.logo.material` and its loaded `.map` remain the same objects. A 16 by 2 set of UV-continuous tiles replaces only the plane geometry; each tile contains a 4 by 3 subdivision, totaling 2,304 vertices / 768 triangles in the existing single draw call. With separation zero, adjacent tile boundaries coincide exactly and reconstruct the full original crop. No texture or UV animation modifies the artwork. This remains a rectangular photographic artwork surface, including the source's black background.

The material uses Three r149 `onBeforeCompile` with the actual vendored `begin_vertex` and `color_fragment` chunks. Two low-frequency analytic waves create a shallow floating surface: maximum forward float .043m and vertical movement .009m. Tile separation adds at most .042m horizontally, .012m vertically for the actual two-row cell coordinates, and .095m forward. Bounds expand by .16m once to cover deformation. Normal animation is unnecessary for the unlit `MeshBasicMaterial`. The artwork keeps its original material map, tone mapping and all other settings.

| Camera progress | Effect |
|---|---|
| 0–.14 | Readable assembled artwork, subtle shared-time surface float |
| .14–.30 | First geometric exhale |
| .30–.36 | Bounded separation hold |
| .36–.57 | Full geometric settlement |
| .30–.53 | One smooth red seam-light emphasis, peak +8%; artwork brightness peak +16% |
| .63–.76 | Second, smaller geometric exhale, 65% amplitude |
| .76–.80 | Smaller separation hold |
| .80–.96 | Full geometric settlement before the logo leaves its camera window |
| .92–1.08 | Surface float tapers to zero |
| After 1.08 | Original settled artwork, no choreography light contribution |

These windows are derived from `RV.camera.windows.logo`, currently [0,1]. They run on `RIG.smooth`, which the camera also samples. There is no history-dependent triggering, so backward scrolling reproduces the same geometry and light envelope. The light accent is a single continuous envelope, not a timed flashing pattern; repeated manual scrubbing can repeat it. Its intensity multiplier follows the upstream base-world light update and therefore cannot accumulate. No interior flashing or signal geometry was added.

`WORLD.uT` is directly shared by the shader. The existing host freezes this clock on pause; scroll continues to update the reversible deformation envelopes. Reduced motion sets float, separation and emphasis to zero, restoring the original rigid artwork. Existing chapter jumps and fade transitions remain owned by the host. No frame geometry allocations or GPU resource creation occur during update; live state and uniform objects are reused.

`RV.choreography` exposes:

- `state`: reused `{progress,time,float,separation,emphasis,phase}` sample.
- `sample(progress,time=0,reduced=false,out?)`: deterministic CPU envelope sampler. Supply `out` to avoid allocating; time is reported, with the vertex shader consuming the shared time uniform directly.
- `uniforms`: persistent `uRVFloat`, `uRVSeparate`, `uRVEmphasis` values.
- `ready`, `disposed`, `logo`, `geometry`, `original`: inspection/lifecycle handles.
- `dispose()`: idempotently restores original geometry, original material compile/cache-key hooks, and disposes the replacement geometry. It preserves the bitmap/material for the host's existing final scene disposal.

Validation: `node --check src/ravers/choreography.js` and `node /tmp/ravers-choreography-test.cjs` passed. The temporary CPU harness used the real vendored Three r149 library, verified 5,001 progress samples plus all reduced-motion variants, exact repeat/rewind state, finite bounded envelope values, UV reconstruction of the original dimensions, original texture identity, injection into the actual basic-material shader chunks, uniform sharing, stable light emphasis, and one-time geometry disposal with restoration. No GPU shader-driver compilation, actual bitmap load, WebGL render, visual readability, fog/reflection composition or frame-rate measurement was performed by this layer. Root integration/browser QA remains necessary.
