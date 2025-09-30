interface Env {
  DB: D1Database;
}

interface GalleryImage {
  user_id: string;
  artwork_id: string;
  image_data: string;
}

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Encrypted-Yw-ID, X-Is-Login',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Get user ID from headers
    const userId = request.headers.get('X-Encrypted-Yw-ID');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      if (path === '/api/gallery/images' && request.method === 'GET') {
        // Get all user's gallery images
        const stmt = env.DB.prepare('SELECT artwork_id, image_data, uploaded_at FROM gallery_images WHERE user_id = ?');
        const { results } = await stmt.bind(userId).all();
        
        return new Response(JSON.stringify({ success: true, images: results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } else if (path === '/api/gallery/upload' && request.method === 'POST') {
        // Upload or update an artwork image
        const data: GalleryImage = await request.json();
        
        if (!data.artwork_id || !data.image_data) {
          return new Response(JSON.stringify({ error: 'Missing artwork_id or image_data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check image size (approximately 2MB limit for base64)
        if (data.image_data.length > 2.5 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: 'Image too large. Please compress the image.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Upsert (INSERT OR REPLACE) the image
        const stmt = env.DB.prepare(`
          INSERT OR REPLACE INTO gallery_images (user_id, artwork_id, image_data, uploaded_at) 
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `);
        
        await stmt.bind(userId, data.artwork_id, data.image_data).run();

        return new Response(JSON.stringify({ success: true, message: 'Image uploaded successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } else if (path.startsWith('/api/gallery/') && request.method === 'DELETE') {
        // Delete a specific artwork image
        const artworkId = path.split('/').pop();
        
        if (!artworkId) {
          return new Response(JSON.stringify({ error: 'Missing artwork_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const stmt = env.DB.prepare('DELETE FROM gallery_images WHERE user_id = ? AND artwork_id = ?');
        await stmt.bind(userId, artworkId).run();

        return new Response(JSON.stringify({ success: true, message: 'Image deleted successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } else {
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } catch (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};