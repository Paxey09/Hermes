const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: '.env.local' });

const app = express();

app.use(cors());
app.use(express.json({
	verify: (req, res, buf) => {
		req.rawBody = buf;
	},
}));

// Main Routes
const mainRoutes = require("./routes/main");
app.use("/api", mainRoutes);

// Service Routes
const openClaudeRoutes = require("./routes/services/openClaude");
const facebookIntegrationRoutes = require("./routes/integrations/facebook");

app.use("/api/openclaude", openClaudeRoutes);
app.use("/api/webhooks/facebook", facebookIntegrationRoutes);

// Admin Panel Routes - Full Module Integration
const revenueRoutes = require("./routes/revenue");
const analyticsRoutes = require("./routes/analytics");
const knowledgeBaseRoutes = require("./routes/knowledge-base");
const reportsRoutes = require("./routes/reports");
const auditLogsRoutes = require("./routes/audit-logs");

app.use("/api/revenue", revenueRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/knowledge-base", knowledgeBaseRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/audit-logs", auditLogsRoutes);

module.exports = app;
