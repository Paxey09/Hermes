const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());

// Raw body middleware for Facebook webhook signature verification
app.use((req, res, next) => {
  if (req.path === '/api/webhooks/facebook' && req.method === 'POST') {
    let rawBody = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      rawBody += chunk;
    });
    req.on('end', () => {
      req.rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
});

app.use(express.json());

// Main Routes
const mainRoutes = require("./routes/main");
app.use("/api", mainRoutes);

// Service Routes
const openClaudeRoutes = require("./routes/services/openClaude");
const openfangRoutes = require("./routes/services/openfang");
const pentagiRoutes = require("./routes/services/pentagi");

app.use("/api/openclaude", openClaudeRoutes);
app.use("/api/openfang", openfangRoutes);
app.use("/api/pentagi", pentagiRoutes);

// Facebook Webhook Routes
const facebookRoutes = require("./routes/integrations/facebook");
app.use("/api/webhooks/facebook", facebookRoutes);

module.exports = app;
