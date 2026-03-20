# X3DViewer (3D File Tools)

X3DViewer is a desktop tool for viewing, converting, and generating 3D files used in Hamilton automation workflows and general 3D pipelines.

## Why this project exists

Hamilton VENUS relies on `.x` and `.3dx` model formats. Support for these formats has been dropped or is no longer maintained in many mainstream 3D tools (including newer Blender workflows and other common tooling).

This project aims to change that by giving the power back to the people:

- Open and inspect legacy Hamilton 3D assets
- Generate your own `.x` models
- Switch between `.x` and common 3D formats without vendor lock-in

## Download

- Releases (Windows builds): https://github.com/zdmilot/X3DViewer/releases

## Screenshot

<img width="1268" height="855" alt="X3DViewer app screenshot" src="https://github.com/user-attachments/assets/a6b9fc61-668f-48d9-99c2-141d0175b387" />

## Features

- Load and view `.x`, `.hxx`, `.obj`, `.stl`, `.glb`, and `.gltf`
- Drag-and-drop file loading in the desktop viewer
- Convert common 3D formats to `.x`
- Export `.x` or `.hxx` content to `.obj`, `.stl`, or `.glb`
- Apply transform operations (rotate and mirror) during conversion
- Generate `.x` models from labware XML definitions
- Use either a GUI (Electron app) or a full CLI workflow

## Supported format workflows

- Input: `.x`, `.hxx`, `.obj`, `.stl`, `.glb`, `.gltf`
- Convert to `.x`: `.obj`, `.stl`, `.glb`, `.x`
- Export from `.x`/`.hxx`: `.obj`, `.stl`, `.glb`

## Quick start

### Option 1: Download prebuilt app

1. Go to the releases page: https://github.com/zdmilot/X3DViewer/releases
2. Download the latest Windows executable
3. Run the app

### Option 2: Run from source

Requirements:

- Node.js 18+

Install and start:

```bash
npm install
npm start
```

## Build a portable Windows executable

```bash
npm run dist
```

Build output is generated in the `dist` directory.

## CLI usage

Show all commands:

```bash
node cli.js --help
```

Common examples:

```bash
# Inspect a file
node cli.js your_model.hxx

# Validate and deep-parse a file
node cli.js your_model.x --validate

# Convert OBJ/STL/GLB/X to .x
node cli.js convert input.obj output.x --rotate-z 90 --mirror-y

# Export .x/.hxx to GLB
node cli.js export-x input.hxx output.glb --format glb

# Generate .x from labware XML
node cli.js generate labware.xml output.x --sbs
```

## Tech stack

- Electron
- Three.js
- Custom loaders and conversion pipeline for Hamilton and DirectX-oriented assets

## License

MIT
