import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());
app.use(cookieParser());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
);

// Log configuration status (without secrets)
console.log("OAuth Configuration:");
console.log("- Client ID set:", !!process.env.GOOGLE_CLIENT_ID);
console.log("- Client Secret set:", !!process.env.GOOGLE_CLIENT_SECRET);
console.log("- App URL:", process.env.APP_URL || "NOT SET (defaulting to localhost)");
console.log("- Redirect URI:", `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`);

const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// API Routes
app.get("/api/health/auth-url", (req, res) => {
  // Use APP_URL from env if available, otherwise try to derive from request
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['host'];
  const derivedBaseUrl = `${protocol}://${host}`;
  const baseUrl = process.env.APP_URL || derivedBaseUrl;
  
  const redirectUri = `${baseUrl}/auth/callback`;
  
  // Update oauth2Client with the correct redirect URI for this request
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

app.get("/auth/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error("OAuth returned error:", error);
    return res.status(400).send(`OAuth error: ${error}`);
  }

  if (!code || typeof code !== "string") {
    console.error("OAuth callback without code. Query:", req.query);
    return res.status(400).send("Authentication failed: missing authorization code");
  }
  
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['host'];
  const derivedBaseUrl = `${protocol}://${host}`;
  const baseUrl = process.env.APP_URL || derivedBaseUrl;
  const redirectUri = `${baseUrl}/auth/callback`;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  try {
    const { tokens } = await client.getToken(code as string);
    // In a real app, we'd store this in a database linked to the user
    // For this demo, we'll send it back to the client via a cookie or postMessage
    // Using postMessage as per OAuth skill
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                tokens: ${JSON.stringify(tokens)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Autentifikazioa ondo burutu da. Leiho hau automatikoki itxiko da.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

app.post("/api/health/data", async (req, res) => {
  const { tokens } = req.body;
  if (!tokens) return res.status(400).json({ error: "Tokens required" });

  oauth2Client.setCredentials(tokens);
  const fitness = google.fitness({ version: 'v1', auth: oauth2Client });

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = now.getTime();

    // Fetch Steps
    const stepsResponse = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [{ dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps" }],
        bucketByTime: { durationMillis: (endOfDay - startOfDay).toString() },
        startTimeMillis: startOfDay.toString(),
        endTimeMillis: endOfDay.toString()
      }
    });

    // Fetch Sleep
    const sleepResponse = await fitness.users.sessions.list({
      userId: 'me',
      startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      endTime: now.toISOString(),
      activityType: [72] // Sleep
    });

    let totalSteps = 0;
    const stepsData = stepsResponse.data as any;
    stepsData.bucket?.forEach((bucket: any) => {
      bucket.dataset?.forEach((dataset: any) => {
        dataset.point?.forEach((point: any) => {
          point.value?.forEach((val: any) => {
            totalSteps += val.intVal || 0;
          });
        });
      });
    });

    let sleepHours = 0;
    const sleepData = sleepResponse.data as any;
    sleepData.session?.forEach((session: any) => {
      const start = parseInt(session.startTimeMillis || "0");
      const end = parseInt(session.endTimeMillis || "0");
      sleepHours += (end - start) / (1000 * 60 * 60);
    });

    res.json({
      steps: totalSteps,
      sleepHours: parseFloat(sleepHours.toFixed(1)),
      date: new Date().toLocaleDateString()
    });
  } catch (error) {
    console.error("Error fetching fitness data:", error);
    res.status(500).json({ error: "Failed to fetch health data" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
