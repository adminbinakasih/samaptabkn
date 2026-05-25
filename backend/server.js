require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./src/models');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://samapta.binakasihnusantara.sch.id',
    'http://samapta.binakasihnusantara.sch.id',
  ],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/user', require('./src/routes/user.routes'));
app.use('/api/activity', require('./src/routes/activity.routes'));
app.use('/api/activity', require('./src/routes/gps.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/leaderboard', require('./src/routes/leaderboard.routes'));
app.use('/api/feed', require('./src/routes/feed.routes'));
app.use('/api/stats', require('./src/routes/stats.routes'));

// Health check
app.get('/', (req, res) => res.json({ message: 'BKN-Running API is running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('Database connected.');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Unable to connect to database:', err);
    process.exit(1);
  });
