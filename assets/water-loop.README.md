# Water fallback

`water-loop.webm` (VP9) and `water-loop.mp4` (H.264) contain the same monochrome
GPU water surface as `waves-surface.js`, rendered offline in Firefox at 1920×960,
30 fps, 32 seconds, without audio. The 960 frames were exported as lossless PNGs
at exact timestamps before encoding; this is not a screen recording.

To close the loop, temporal rates in the export shader were quantized to integer
multiples of 2π/32. Spatial fields, mesh, analytic normals and lighting were retained.
The final export at t=32 differs from t=0 by at most 2/255 per channel.

Encoding: FFmpeg, libvpx-vp9 CRF 16 / cpu-used 3 / row-mt 1, and libx264 CRF 14 /
preset medium / faststart, both yuv420p. Native video is loaded only when WebGL
fails, paused when hidden or outside the hero, and respects reduced motion.
