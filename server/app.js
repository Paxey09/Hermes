const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || true;

app.use(cors({
    origin: corsOrigin,
    credentials: true,
}));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({
	verify: (req, res, buf) => {
		req.rawBody = buf;
	},
}));

// Some Meta webhook validations hit the root path instead of the configured callback path.
app.get("/", (req, res, next) => {
	const mode = req.query["hub.mode"] || req.query.hub_mode;
	const token = req.query["hub.verify_token"] || req.query.hub_verify_token;
	const challenge = req.query["hub.challenge"] || req.query.hub_challenge;

	if (mode !== "subscribe") {
		return next();
	}

	const expectedToken = (process.env.FB_VERIFY_TOKEN || "").trim();
	const receivedToken = typeof token === "string" ? token.trim() : token;

	if (receivedToken && receivedToken === expectedToken) {
		return res.status(200).send(challenge);
	}

	return res.sendStatus(403);
});

// Privacy policy route
app.get("/privacy", (req, res) => {
	const privacyHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Hermes</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Privacy Policy</h1>
        <p><em>Last Updated: April 23, 2026</em></p>

        <h2>1. Information We Collect</h2>
        <p>Hermes collects: Messages, User ID, Timestamps of interactions.</p>

        <h2>2. How We Use Your Information</h2>
        <p>Your information is used to: Process messages, generate responses, improve service, maintain security, comply with legal obligations.</p>

        <h2>3. Data Storage and Security</h2>
        <p>We use industry-standard security measures, HTTPS encryption, and restrict access to authorized personnel only.</p>

        <h2>4. Third-Party Services</h2>
        <p>We use: Facebook/Meta, OpenRouter (AI API), Render (hosting).</p>

        <h2>5. User Rights</h2>
        <p>You can request access, deletion, or withdraw consent by discontinuing use of the chatbot.</p>

        <h2>6. Data Retention</h2>
        <p>Messages are retained for up to 30 days, then automatically deleted.</p>

        <h2>7. Contact Us</h2>
        <p>For inquiries: paxeylyrates@gmail.com</p>

        <h2>8. Compliance</h2>
        <p>Hermes complies with GDPR, CCPA, PH-DPA, and Facebook Platform Policies.</p>
    </div>
</body>
</html>`;
	res.setHeader("Content-Type", "text/html; charset=utf-8");
	res.send(privacyHTML);
});


// Main Routes
const mainRoutes = require("./routes/main");
app.use("/api", mainRoutes);

// Service Routes
const openClaudeRoutes = require("./routes/services/openClaude");
const openfangRoutes = require("./routes/services/openfang");
const pentagiRoutes = require("./routes/services/pentagi");
const facebookWebhookRoutes = require("./routes/integrations/facebook");

app.use("/api/openclaude", openClaudeRoutes);
app.use("/api/openfang", openfangRoutes);
app.use("/api/pentagi", pentagiRoutes);
app.use("/api/webhooks/facebook", facebookWebhookRoutes);

// Handle malformed JSON bodies from client requests.
app.use((err, req, res, next) => {
	if (err && (err.type === "entity.parse.failed" || err instanceof SyntaxError) && err.status === 400) {
		return res.status(400).json({
			error: "Invalid JSON payload",
			message: "Request body must be valid JSON.",
		});
	}

	const status = err?.status || 500;
	const message = err?.message || "Unexpected server error.";

	if (status >= 500) {
		console.error("API error:", message);
	}

	return res.status(status).json({
		error: "Request failed",
		message,
	});
});

module.exports = app;
