const express = require('express');
const { pool } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { rows: appointmentsByDoctor } = await pool.query(
      `SELECT d.id AS doctor_id, u.name AS doctor_name, COUNT(a.id) AS appointment_count
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN appointments a ON a.doctor_id = d.id
       GROUP BY d.id, u.name
       ORDER BY appointment_count DESC`
    );
    const { rows: patientCountRows } = await pool.query(
      `SELECT COUNT(*) AS patient_count FROM users WHERE role = 'patient'`
    );
    const analytics = {
      appointmentsByDoctor,
      patientCount: parseInt(patientCountRows[0].patient_count, 10),
    };
    res.json(analytics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;