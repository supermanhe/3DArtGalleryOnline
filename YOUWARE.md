# Gallery Artwork Management System

## Project Overview
A 3D art gallery built with Three.js and Cannon.js physics that now runs entirely on the frontend. All artwork content is served locally so the experience works offline without any Youware backend dependencies.

## Architecture

### Frontend (HTML/CSS/JS)
- **Three.js**: 3D scene rendering and artwork display
- **Cannon.js**: Physics simulation for first-person movement
- **Main Components**:
  - `index.html`: Entry point with Three.js and Cannon.js CDN
  - `main.js`: Core 3D gallery logic with image management system
  - `style.css`: Basic styling
- **Asset Storage**: Default artwork images in `/images`

## Gallery Structure
Artworks are organized by wall positions:
- **North Wall (Back)**: artwork1-3 (Left, Center, Right)
- **South Wall (Front)**: artwork4-6 (Left, Center, Right)
- **East Wall (Right)**: artwork7-9 (Left, Center, Right)
- **West Wall (Left)**: artwork10-12 (Left, Center, Right)

## Key Features

### Image Display System
- 12 curated images placed throughout the gallery
- Locally hosted assets remove network latency and backend calls
- Ready for future enhancement with alternative storage options if needed

## Development Commands

### Frontend Testing
- Open `index.html` in browser
- Click "Click to play" to enter gallery

## File Structure
```
/
├── index.html              # Entry point
├── main.js                 # Main gallery logic
├── style.css               # Styling
├── images/                 # Default artwork assets
│   ├── artwork1.jpg - artwork12.jpg
│   ├── reference1.png      # UI reference image
│   └── reference2.png      # Gallery layout reference
└── todo.json               # Project task notes
```

## Important Notes
- Gallery operates 100% client-side; no backend build or deployment required
- Existing Three.js and Cannon.js setup remains unchanged for visual fidelity
