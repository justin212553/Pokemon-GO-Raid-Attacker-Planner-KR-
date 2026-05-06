import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import cookieSession from 'cookie-session';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'default-secret'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: 'none'
  }));

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    '' // Redirect URI will be set per request
  );

  const DRIVE_SCOPES = [
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file'
  ];

  // API Routes
  app.get('/api/auth/google/url', (req, res) => {
    const appUrl = (process.env.APP_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers['x-forwarded-host'] || req.get('host')}`).replace(/\/$/, '');
    const redirectUri = `${appUrl}/auth/callback`;

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: DRIVE_SCOPES,
      redirect_uri: redirectUri,
      prompt: 'consent'
    });
    res.json({ url });
  });

  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Code missing');
    }

    try {
      const appUrl = (process.env.APP_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers['x-forwarded-host'] || req.get('host')}`).replace(/\/$/, '');
      const redirectUri = `${appUrl}/auth/callback`;

      const { tokens } = await oauth2Client.getToken({
        code: code as string,
        redirect_uri: redirectUri
      });
      
      req.session!.tokens = tokens;
      
      res.send(`
        <html>
          <head>
            <title>Pokemon GO Raid Attacker Planner - 인증</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { background: #020617; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .container { text-align: center; background: #0f172a; padding: 2rem 3rem; border-radius: 1rem; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
              h1 { font-size: 1.5rem; margin-top: 0; margin-bottom: 0.5rem; letter-spacing: -0.05em; font-weight: 900; }
              h1 span.yellow { color: #fde047; }
              h1 span.blue { color: #3b82f6; }
              p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin-bottom: 0; }
              .success-icon { width: 48px; height: 48px; background: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
              .success-icon svg { width: 24px; height: 24px; color: white; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h1><span class="yellow">POKEMON</span> <span class="blue">GO</span><br/>Raid Attacker Planner</h1>
              <p>인증에 성공하여 구글 드라이브와 연결되었습니다.<br/>이 창은 잠시 후 자동으로 닫힙니다.</p>
            </div>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  window.close();
                } else {
                  window.location.origin = '/';
                }
              }, 1500); // 1.5초 후 닫힘 (UI를 보여주기 위함)
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/drive/status', (req, res) => {
    res.json({ 
      isAuthenticated: !!(req.session && req.session.tokens),
      userEmail: req.session?.tokens?.email || null
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  app.post('/api/drive/save', async (req, res) => {
    if (!req.session?.tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      client.setCredentials(req.session.tokens);

      const drive = google.drive({ version: 'v3', auth: client });
      const fileName = 'raid_planner_data.json';
      
      // Check if file exists
      const response = await drive.files.list({
        q: `name = '${fileName}' and trashed = false`,
        spaces: 'drive',
        fields: 'files(id)'
      });

      const fileMetadata = {
        name: fileName,
        mimeType: 'application/json'
      };
      
      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(req.body.data)
      };

      if (response.data.files && response.data.files.length > 0) {
        // Update
        const fileId = response.data.files[0].id!;
        await drive.files.update({
          fileId: fileId,
          media: media
        });
      } else {
        // Create
        await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id'
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Drive Save Error:', error);
      res.status(500).json({ error: 'Failed to save to Google Drive' });
    }
  });

  app.get('/api/drive/load', async (req, res) => {
    if (!req.session?.tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      client.setCredentials(req.session.tokens);

      const drive = google.drive({ version: 'v3', auth: client });
      const fileName = 'raid_planner_data.json';
      
      const response = await drive.files.list({
        q: `name = '${fileName}' and trashed = false`,
        spaces: 'drive',
        fields: 'files(id)'
      });

      if (response.data.files && response.data.files.length > 0) {
        const fileId = response.data.files[0].id!;
        const file = await drive.files.get({
          fileId: fileId,
          alt: 'media'
        });
        res.json(file.data);
      } else {
        res.status(404).json({ error: 'Save file not found' });
      }
    } catch (error) {
      console.error('Drive Load Error:', error);
      res.status(500).json({ error: 'Failed to load from Google Drive' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
