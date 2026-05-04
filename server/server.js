const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const cors = require('cors');
const express = require('express');

const app = express();

console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("PORT:", process.env.PORT);

// ✅ Allow all origins temporarily
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// ✅ Handle preflight
app.options('*', cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

const zoomRoutes = require('./routes/zoom');
app.use('/api/zoom', zoomRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

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