const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role = 'patient' } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    if (role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can self-register' });
    }
    
    const { rows: existingUsers } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, role]
    );
    const user = rows[0];
    
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const { rows } = await pool.query('SELECT id, name, email, password_hash, role FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    let doctorId = null;
    if (user.role === 'doctor') {
      const { rows: doctorRows } = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [user.id]);
      if (doctorRows.length > 0) {
        doctorId = doctorRows[0].id;
      }
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, doctorId }, JWT_SECRET, { expiresIn: '1d' });
    const responseUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    if (doctorId) responseUser.doctorId = doctorId;
    res.json({ token, user: responseUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;