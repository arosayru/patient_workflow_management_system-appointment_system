const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { specialty, location, date } = req.query;
  try {
    const filters = [];
    const values = [];
    let idx = 1;
    if (specialty) {
      filters.push(`specialty ILIKE $${idx++}`);
      values.push(`%${specialty}%`);
    }
    if (location) {
      filters.push(`location ILIKE $${idx++}`);
      values.push(`%${location}%`);
    }
    const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
    const doctorsQuery = `SELECT d.id, u.name, d.specialty, d.location, d.bio, d.profile_picture
                          FROM doctors d
                          JOIN users u ON d.user_id = u.id
                          ${whereClause}`;
    const { rows: doctors } = await pool.query(doctorsQuery, values);
    
    if (date) {
      const dateObj = new Date(date);
      for (const doctor of doctors) {
        const { rows: slots } = await pool.query(
          `SELECT id, slot_date, slot_time FROM doctor_schedule
           WHERE doctor_id = $1 AND slot_date = $2 AND is_booked = FALSE
           ORDER BY slot_time ASC`,
          [doctor.id, dateObj]
        );
        doctor.availableSlots = slots;
      }
    }
    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  const doctorId = req.params.id;
  try {
    const { rows } = await pool.query(
      `SELECT d.id, u.name, d.specialty, d.location, d.bio, d.profile_picture
       FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
      [doctorId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    const doctor = rows[0];
    
    const { rows: slots } = await pool.query(
      `SELECT id, slot_date, slot_time
       FROM doctor_schedule
       WHERE doctor_id = $1 AND is_booked = FALSE AND slot_date >= CURRENT_DATE
       ORDER BY slot_date ASC, slot_time ASC`,
      [doctorId]
    );
    doctor.availableSlots = slots;
    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, email, password, specialty, location, bio, profilePicture } = req.body;
  try {
    if (!name || !email || !password || !specialty || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const { rows: userRows } = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, 'doctor']
    );
    const user = userRows[0];
    
    const { rows: doctorRows } = await pool.query(
      'INSERT INTO doctors (user_id, specialty, location, bio, profile_picture) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, specialty, location, bio || '', profilePicture || '']
    );
    const doctor = doctorRows[0];
    res.status(201).json({ user, doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const doctorId = req.params.id;
  const { specialty, location, bio, profilePicture } = req.body;
  try {
    const fields = [];
    const values = [];
    let idx = 1;
    if (specialty) {
      fields.push(`specialty = $${idx++}`);
      values.push(specialty);
    }
    if (location) {
      fields.push(`location = $${idx++}`);
      values.push(location);
    }
    if (bio !== undefined) {
      fields.push(`bio = $${idx++}`);
      values.push(bio);
    }
    if (profilePicture !== undefined) {
      fields.push(`profile_picture = $${idx++}`);
      values.push(profilePicture);
    }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    values.push(doctorId);
    const query = `UPDATE doctors SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const doctorId = req.params.id;
  try {
    const { rows: doctorRows } = await pool.query('SELECT user_id FROM doctors WHERE id = $1', [doctorId]);
    if (doctorRows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    const userId = doctorRows[0].user_id;
    
    await pool.query('DELETE FROM doctors WHERE id = $1', [doctorId]);
    
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'Doctor deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/schedule', authenticateToken, authorizeRoles('doctor', 'admin'), async (req, res) => {
  const doctorId = parseInt(req.params.id, 10);
  const user = req.user;
  
  if (user.role === 'doctor' && user.doctorId && user.doctorId !== doctorId) {
    return res.status(403).json({ message: 'Forbidden: cannot modify another doctor\'s schedule' });
  }
  const slots = Array.isArray(req.body) ? req.body : [req.body];
  try {
    const inserted = [];
    for (const slot of slots) {
      const { date, time } = slot;
      if (!date || !time) {
        return res.status(400).json({ message: 'Each slot must include date and time' });
      }
      try {
        const { rows } = await pool.query(
          `INSERT INTO doctor_schedule (doctor_id, slot_date, slot_time, is_booked)
           VALUES ($1, $2, $3, FALSE) RETURNING id, slot_date, slot_time`,
          [doctorId, date, time]
        );
        inserted.push(rows[0]);
      } catch (e) {
        console.warn('Skipping duplicate slot', e.message);
      }
    }
    res.status(201).json(inserted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/schedule', authenticateToken, authorizeRoles('doctor', 'admin'), async (req, res) => {
  const doctorId = parseInt(req.params.id, 10);
  const user = req.user;
  if (user.role === 'doctor' && user.doctorId && user.doctorId !== doctorId) {
    return res.status(403).json({ message: 'Forbidden: cannot view another doctor\'s schedule' });
  }
  const { date } = req.query;
  try {
    let query = `SELECT id, slot_date, slot_time, is_booked FROM doctor_schedule WHERE doctor_id = $1`;
    const params = [doctorId];
    if (date) {
      params.push(date);
      query += ` AND slot_date = $${params.length}`;
    }
    query += ' ORDER BY slot_date ASC, slot_time ASC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;