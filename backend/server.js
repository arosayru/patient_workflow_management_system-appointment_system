const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./db');

const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const medicalRecordRoutes = require('./routes/medicalRecords');
const analyticsRoutes = require('./routes/analytics');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

initializeDatabase()
  .then(() => {
    console.log('Database initialized');
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });

app.use('/auth', authRoutes);
app.use('/doctors', doctorRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/medical-records', medicalRecordRoutes);
app.use('/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('Hospital appointment system API is running');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});