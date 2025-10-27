# Gallery Artwork Management System

## Project Overview
A 3D art gallery built with Three.js and Cannon.js physics. Users can customise every canvas directly from the browser through the
embedded artwork manager—no external backend services are required.

## Architecture

### Frontend (HTML/CSS/JS)
- **Three.js**: 3D scene rendering and artwork display
- **Cannon.js**: Physics simulation for first-person movement
- **Main Components**:
  - `index.html`: Entry point with Three.js and Cannon.js CDN
  - `main.js`: Core 3D gallery logic with image management system
  - `style.css`: Basic styling

### Storage
- **Primary**: Browser `localStorage`
- **Format**: Base64-encoded JPEG/PNG generated from uploaded images
- **Persistence**: Remains on the device/browser where the upload occurred

## Gallery Structure
Artworks are organized by wall positions:
- **North Wall (Back)**: artwork1-3 (Left, Center, Right)
- **South Wall (Front)**: artwork4-6 (Left, Center, Right)  
- **East Wall (Right)**: artwork7-9 (Left, Center, Right)
- **West Wall (Left)**: artwork10-12 (Left, Center, Right)

## Key Features

### Image Management System
- **Manage Artworks Button**: Persistent button in the top-left corner of the viewport
- **Modal Interface**: Organised by wall sections with three artworks per wall
- **Upload Functionality**: Local image upload with automatic compression (max dimension 1024px, ~85% JPEG quality)
- **Storage**: Browser `localStorage` per device/browser
- **Reset Controls**: Restore any artwork to its default texture instantly

### Storage Strategy
- **Compression**: Client-side resizing keeps uploads lightweight and friendly to storage quotas
- **Limits**: Resulting images are capped to ~2.5MB per slot to avoid exhausting localStorage limits

## Using the Gallery
- Open `index.html` in a WebGL-capable browser
- Click **Click to play** to enter the 3D environment
- Use **Manage Artworks** to upload, preview, or reset canvases
- Uploads remain available on the same browser/device thanks to `localStorage`

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
```

## Important Notes
- Images are compressed before storage to keep payload sizes manageable
- If `localStorage` is unavailable (e.g., private browsing), uploads will work for the session but will not persist
- Each browser/device maintains an independent personalised gallery
