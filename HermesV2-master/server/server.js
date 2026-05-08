const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config({ path: '.env.local' });
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
app.set("trust proxy", 1);

console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("PORT:", process.env.PORT);

// ✅ Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://zktcypraugqiddqhntsp.supabase.co", "https://*.supabase.co"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for SPA
}));

// ✅ Rate Limiting - DDoS Protection
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 15 * 60
  }
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 15 * 60
  }
});

// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);

// Apply stricter rate limiting to authentication routes (if any on backend)
app.use('/api/auth/', authLimiter);

// ✅ CORS configuration for production and development
const corsOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL,
      'https://hermesv2-frontend.onrender.com',  // Your Render frontend
      /^https:\/\/.*\.onrender\.com$/,  // Any Render subdomain
    ].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000', '*'];

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ✅ Handle preflight
app.options('*', cors());

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));

app.get('/', (req, res) => {
  res.json({ message: 'Hermes API is running 🚀', timestamp: new Date().toISOString() });
});

// Main Routes
const mainRoutes = require('./routes/main');
app.use('/api', mainRoutes);

// Zoom/Booking Routes
const zoomRoutes = require('./routes/zoom');
app.use('/api/zoom', zoomRoutes);

// AI & Security Routes
const aiRoutes = require('./routes/services/ai');
const securityRoutes = require('./routes/services/security');
const openClaudeRoutes = require("./routes/services/openClaude");
const facebookIntegrationRoutes = require("./routes/integrations/facebook");

app.use('/api/ai', aiRoutes);
app.use('/api/security', securityRoutes);
app.use("/api/openclaude", openClaudeRoutes);
app.use("/api/webhooks/facebook", facebookIntegrationRoutes);

// Serve React frontend
app.use(express.static(path.join(__dirname, '../client/dist')));

// React Router fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
