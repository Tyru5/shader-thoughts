# Shader Thoughts

Interactive WebGL2 shader gallery with 17 real-time visual effects.

## Shaders

gradient, plasma, chaos, tendrils, chromawave, rainbow, godrays, breath, blackhole, anxiety, tesseract, simulation, mirror, abyss, eventhorizon, horizon, and more.

## Features

- Real-time GPU rendering at 60fps
- Mouse-interactive effects
- Responsive canvas with device pixel ratio support
- Dropdown shader selection

## Setup

```bash
bun install
bun dev
```

## Build

```bash
bun run build
bun run preview
```

## Tech

TypeScript, Vite, WebGL2, GLSL

## Structure

```
src/main.ts      # WebGL setup, render loop
shaders/*.js     # Individual GLSL shaders
shaders/index.js # Shader exports
```
