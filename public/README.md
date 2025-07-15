# `public/` Directory

This folder holds all **static assets** (HTML, images, compiled front-end bundles, etc.) that the Express server serves directly.

Why it matters for Docker builds:

1. **COPY step succeeds** – The Dockerfile copies `public/` into the final image.  
   If the directory is missing, Docker prints a _“no source files were specified”_ warning and the container may fail at runtime.

2. **Single-page app entry** – `index.html` (created by the Vite/React build) must be here so that the backend can answer every browser request with the SPA shell.

3. **Runtime flexibility** – Any files you add to `public/` after the container is built (e.g., uploaded screenshots, map images) can be volume-mounted and served without rebuilding the image.

If you are running locally **without** having built the front-end yet, this README ensures the directory exists so Docker doesn’t complain. After you run the front-end build (`npm run build` in the client project) the generated files will replace this placeholder.
