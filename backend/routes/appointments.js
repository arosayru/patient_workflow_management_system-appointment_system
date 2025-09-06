const express = require('express');
const { pool } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const user = req.user;
  try {
    let query = `SELECT a.id, a.status, a.notes, a.created_at,
                        u.name AS patient_name,
                        d_user.name AS doctor_name,
                        a.slot_id,
                        s.slot_date, s.slot_time
                 FROM appointments a
                 JOIN users u ON a.patient_id = u.id
                 JOIN doctors d ON a.doctor_id = d.id
                 JOIN users d_user ON d.user_id = d_user.id
                 JOIN doctor_schedule s ON a.slot_id = s.id`;
    const params = [];
    if (user.role === 'patient') {
      query += ' WHERE a.patient_id = $1';
      params.push(user.id);
    } else if (user.role === 'doctor') {
      query += ' WHERE a.doctor_id = $1';
      params.push(user.doctorId);
    }
    query += ' ORDER BY s.slot_date DESC, s.slot_time DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authenticateToken, authorizeRoles('patient'), async (req, res) => {
  const user = req.user;
  const { doctorId, slotId, notes } = req.body;
  try {
    if (!doctorId || !slotId) {
      return res.status(400).json({ message: 'doctorId and slotId are required' });
    }
    const { rows: slotRows } = await pool.query(
      'SELECT id, doctor_id, is_booked FROM doctor_schedule WHERE id = $1',
      [slotId]
    );
    if (slotRows.length === 0) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    const slot = slotRows[0];
    if (slot.doctor_id != doctorId) {
      return res.status(400).json({ message: 'Slot does not belong to the specified doctor' });
    }
    if (slot.is_booked) {
      return res.status(400).json({ message: 'Slot is already booked' });
    }
    await pool.query('BEGIN');
    const { rows: appointmentRows } = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, slot_id, status, notes)
       VALUES ($1, $2, $3, 'pending', $4) RETURNING *`,
      [user.id, doctorId, slotId, notes || '']
    );
    await pool.query(
      'UPDATE doctor_schedule SET is_booked = TRUE, updated_at = NOW() WHERE id = $1',
      [slotId]
    );
    await pool.query('COMMIT');
    res.status(201).json(appointmentRows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('doctor', 'admin'), async (req, res) => {
  const appointmentId = req.params.id;
  const { status, notes } = req.body;
  const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const { rows: appointmentRows } = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );
    if (appointmentRows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    const appointment = appointmentRows[0];
    if (req.user.role === 'doctor' && req.user.doctorId !== appointment.doctor_id) {
      return res.status(403).json({ message: 'Forbidden: cannot modify another doctor\'s appointment' });
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (status) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    if (notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(notes);
    }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    values.push(appointmentId);
    const query = `UPDATE appointments SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
    const { rows } = await pool.query(query, values);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;