require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

require('./db'); // initializes schema on boot

const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const { publicApiLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  helmet({
    contentSecurityPolicy: false, // the SPA's built assets are hashed by Vite; avoid fighting a strict default CSP here
  })
);
app.use(cors());
app.use(express.json({ limit: '200kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/public', publicApiLimiter, publicRoutes);
app.use('/api/admin', adminRoutes);

// Serve the built React client (client/dist) in production.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const indexPath = path.join(clientDist, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(200).send('Reviews Link Platform API is running. Client build not found yet - run "npm run build:client".');
  }
  res.sendFile(indexPath, (err) => {
    if (err) next(err);
  });
});

app.use('/api', notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Reviews Link Platform server listening on port ${PORT}`);
});
