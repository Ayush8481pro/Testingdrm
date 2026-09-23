// server.js — Render-ready Express server
// Start command: npm start   (Render will auto-detect this)
// Bind to process.env.PORT (Render sets this automatically)

import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const API_URL =
  "https://apiv2.sonyliv.com/AGL/5.0/A/ENG/MWEB/IN/UP/CONTENT/VIDEOURL/VOD/1090476406";

// --- Cookies (from your export) ---
// In production, put this whole string in a Render env var called SONYLIV_COOKIE
// so you don't have to redeploy when cookies rotate.
const COOKIES = {

};

function buildCookieHeader() {
  // If a full cookie string is provided via env, prefer it.
  if (process.env.SONYLIV_COOKIE) return process.env.SONYLIV_COOKIE;
  return Object.entries(COOKIES)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

// Health check for Render
app.get("/", (req, res) => {
  res.json({ ok: true, service: "sonyliv-api", endpoint: "/api/hello" });
});

// The main endpoint — supports both GET and POST
app.all("/api/hello", async (req, res) => {
  try {
    const upstream = await fetch(API_URL, {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-IN,en;q=0.9",
        "content-type": "application/json",
        origin: "https://www.sonyliv.com",
        referer: "https://www.sonyliv.com/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        cookie: buildCookieHeader(),
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const text = await upstream.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    res.status(upstream.status).json({
      ok: upstream.ok,
      status: upstream.status,
      data: payload,
    });
  } catch (err) {
    console.error("Upstream request failed:", err);
    res.status(502).json({
      error: "Upstream request failed",
      message: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
