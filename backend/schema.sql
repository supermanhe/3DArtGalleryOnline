-- Gallery Images Storage Table
CREATE TABLE gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    artwork_id TEXT NOT NULL,
    image_data TEXT NOT NULL,  -- Base64 encoded image data
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, artwork_id)  -- Each user can have one image per artwork
);