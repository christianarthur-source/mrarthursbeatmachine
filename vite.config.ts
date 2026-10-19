import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function saveAvatarPlugin(): Plugin {
  return {
    name: 'save-avatar-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/save-avatar', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { dataUrl } = JSON.parse(body);
              if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Valid image dataUrl required' }));
                return;
              }
              const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              if (buffer.length < 100) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Image buffer too small' }));
                return;
              }

              const publicPath = path.resolve(__dirname, 'public/mr_arthur_avatar.jpg');
              const assetPath = path.resolve(__dirname, 'src/assets/images/mr_arthur_avatar_1791818819660.jpg');

              fs.writeFileSync(publicPath, buffer);
              fs.writeFileSync(assetPath, buffer);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Avatar saved permanently' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), saveAvatarPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

