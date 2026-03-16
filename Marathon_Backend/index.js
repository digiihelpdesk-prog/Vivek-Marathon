require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Logger
app.use((req, res, next) => {
  console.log('📡 Request:', req.method, req.path, JSON.stringify(req.body));
  next();
});

// Connect Database
connectDB();

const { submitRegistration } = require('./controllers/marathonController');

// Routes
app.use('/api/marathon', require('./routes/marathonRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.post('/api/register', submitRegistration);

app.get('/', (req, res) => {
  res.send('🏃 Vivek Marathon 2026 Backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});