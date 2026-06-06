# Remotion (optional, studio-grade video path)

The default renderer is ffmpeg (`packages/core/src/video.ts`) because it runs anywhere cheaply.
For frame-perfect captions and richer motion, swap in Remotion:

1. `npm i @remotion/cli @remotion/renderer @remotion/player remotion react react-dom` here.
2. Build a `<ShortVideo>` composition (see src/ShortVideo.tsx stub) that takes the ShortScript +
   the Gemini-generated image paths + the TTS audio and renders captioned beats.
3. In the worker, replace `video.renderVideo()` with `@remotion/renderer`'s `renderMedia()` call.
4. Note: server-side Remotion needs headless Chromium — use a bigger Render plan or a separate
   render service. Keep ffmpeg as the fallback.
