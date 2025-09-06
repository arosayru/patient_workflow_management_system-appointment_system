const express = require('express');
const { pool } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const user = req.user;
  const { patientId } = req.query;
  try {
    let query = `SELECT mr.id, mr.diagnosis, mr.prescription, mr.attachments, mr.created_at,
                        p.name AS patient_name, d_user.name AS doctor_name, mr.appointment_id
                 FROM medical_records mr
                 JOIN users p ON mr.patient_id = p.id
                 JOIN doctors d ON mr.doctor_id = d.id
                 JOIN users d_user ON d.user_id = d_user.id`;
    const params = [];
    if (user.role === 'patient') {
      query += ' WHERE mr.patient_id = $1';
      params.push(user.id);
    } else if (user.role === 'doctor') {
      if (patientId) {
        query += ' WHERE mr.doctor_id = $1 AND mr.patient_id = $2';
        params.push(user.doctorId, patientId);
      } else {
        query += ' WHERE mr.doctor_id = $1';
        params.push(user.doctorId);
      }
    } else if (user.role === 'admin') {
      if (patientId) {
        query += ' WHERE mr.patient_id = $1';
        params.push(patientId);
      }
    }
    query += ' ORDER BY mr.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authenticateToken, authorizeRoles('doctor'), async (req, res) => {
  const user = req.user;
  const { appointmentId, diagnosis, prescription, attachments } = req.body;
  try {
    if (!appointmentId) {
      return res.status(400).json({ message: 'appointmentId is required' });
    }
    const { rows: appointmentRows } = await pool.query(
      'SELECT patient_id, doctor_id FROM appointments WHERE id = $1',
      [appointmentId]
    );
    if (appointmentRows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    const appointment = appointmentRows[0];
    if (appointment.doctor_id !== user.doctorId) {
      return res.status(403).json({ message: 'Forbidden: appointment does not belong to you' });
    }
    const { rows: existing } = await pool.query(
      'SELECT id FROM medical_records WHERE appointment_id = $1',
      [appointmentId]
    );
    let record;
    if (existing.length > 0) {
      const { rows: updated } = await pool.query(
        `UPDATE medical_records
         SET diagnosis = $1, prescription = $2, attachments = $3, updated_at = NOW()
         WHERE appointment_id = $4 RETURNING *`,
        [diagnosis || '', prescription || '', attachments || '', appointmentId]
      );
      record = updated[0];
    } else {
      const { rows: inserted } = await pool.query(
        `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, prescription, attachments)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [appointment.patient_id, appointment.doctor_id, appointmentId, diagnosis || '', prescription || '', attachments || '']
      );
      record = inserted[0];
    }
    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;