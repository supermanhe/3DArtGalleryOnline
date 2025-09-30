# Gallery Artwork Management System

## Project Overview
A 3D art gallery built with Three.js and Cannon.js physics, featuring user image upload and management functionality with Youware Backend integration.

## Architecture

### Frontend (HTML/CSS/JS)
- **Three.js**: 3D scene rendering and artwork display
- **Cannon.js**: Physics simulation for first-person movement
- **Main Components**:
  - `index.html`: Entry point with Three.js and Cannon.js CDN
  - `main.js`: Core 3D gallery logic with image management system
  - `style.css`: Basic styling

### Backend (Cloudflare Workers)
- **Technology**: TypeScript on Cloudflare Workers
- **Database**: D1 SQLite for user image storage
- **Location**: `backend/` directory
- **API Endpoints**:
  - `GET /api/gallery/images` - Retrieve user's gallery images
  - `POST /api/gallery/upload` - Upload/update artwork images
  - `DELETE /api/gallery/{artworkId}` - Delete specific artwork

## Gallery Structure
Artworks are organized by wall positions:
- **North Wall (Back)**: artwork1-3 (Left, Center, Right)
- **South Wall (Front)**: artwork4-6 (Left, Center, Right)  
- **East Wall (Right)**: artwork7-9 (Left, Center, Right)
- **West Wall (Left)**: artwork10-12 (Left, Center, Right)

## Key Features

### Image Management System
- **Replace Button**: Located below "Click to play" button
- **Modal Interface**: Organized by wall sections with 3 artworks per wall
- **Upload Functionality**: Local image upload with compression
- **Dual Storage**: Youware Backend + localStorage fallback
- **User-Specific**: Each user sees their own uploaded images

### Storage Strategy
- **Primary**: Youware Backend (user-specific image storage)
- **Fallback**: Browser localStorage (when backend unavailable)
- **Image Format**: Base64 encoded for database compatibility
- **Compression**: Automatic image compression (80% quality, max 800px)

## Database Schema

### Table: gallery_images
```sql
CREATE TABLE gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    artwork_id TEXT NOT NULL,
    image_data TEXT NOT NULL,  -- Base64 encoded
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, artwork_id)
);
```

## Development Commands

### Backend Development
```bash
cd backend
npm install                 # Install dependencies
npm run build              # Build worker (dry-run)
npm run deploy             # Deploy to Workers
```

### Frontend Testing
- Open `index.html` in browser
- Click "Click to play" to enter gallery
- Click "Replace" button to manage artworks

## User Authentication
- Uses Youware's built-in user system
- User identity via `X-Encrypted-Yw-ID` header
- No additional authentication required

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
└── backend/                # Cloudflare Workers backend
    ├── src/index.ts        # Worker entry point
    ├── wrangler.toml       # Worker configuration
    ├── package.json        # Dependencies
    └── schema.sql          # Database schema
```

## Important Notes
- Images are compressed before storage due to 2MB row limit
- Backend automatically handles CORS for browser requests
- Fallback to localStorage ensures functionality without backend
- Each user maintains their own personalized gallery