const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dnsRoutes = require('./routes/dnsRoutes');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
});

app.use(cors());
app.use(express.json({ limit: '1kb' }));
app.use('/api/', limiter);

app.use('/api/dns', dnsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  if (err.code === 'LIMIT_JSON_SIZE') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
