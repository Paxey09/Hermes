const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
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
