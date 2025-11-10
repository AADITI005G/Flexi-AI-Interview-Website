const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { connectDB, dbStatus } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
let interviewRoutes;
try {
  interviewRoutes = require('./routes/interviewRoutes');
} catch (_) {
  // optional, will be added later
}

const app = express();

app.use(cors());
app.use(express.json());

// Connect to DB (or prepare in-memory fallback)
connectDB();

app.get('/api/health', async (req, res) => {
  const db = await dbStatus();
  res.json({ status: 'ok', time: new Date().toISOString(), db });
});

app.use('/api/auth', authRoutes);
if (interviewRoutes) {
  app.use('/api/interview', interviewRoutes);
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

