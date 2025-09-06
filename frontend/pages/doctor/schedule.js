import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../_app';
import { apiFetch } from '../../utils/api';

export default function SchedulePage() {
  const { user, token, logout, authReady } = useContext(AuthContext);
  const router = useRouter();
  const { doctorId: queryDoctorId } = router.query;
  const doctorId = queryDoctorId || (user && user.doctorId);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newSlots, setNewSlots] = useState([{ date: '', time: '' }]);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'doctor' && user.role !== 'admin') {
      router.replace('/dashboard');
    } else if (doctorId) {
      loadSchedule();
    }
  }, [authReady, user, doctorId]);

  const loadSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      const data = await apiFetch(`/doctors/${doctorId}/schedule?${params.toString()}`, { token });
      setSlots(data);
    } catch (err) {
      setError(err.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSlotChange = (index, field, value) => {
    setNewSlots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSlotField = () => {
    setNewSlots((prev) => [...prev, { date: '', time: '' }]);
  };

  const handleAddSlots = async (e) => {
    e.preventDefault();
    const toAdd = newSlots.filter((s) => s.date && s.time);
    if (toAdd.length === 0) return;
    try {
      await apiFetch(`/doctors/${doctorId}/schedule`, { method: 'POST', token, data: toAdd });
      setNewSlots([{ date: '', time: '' }]);
      loadSchedule();
    } catch (err) {
      alert(err.data?.message || 'Failed to add slots');
    }
  };

  if (!authReady) return null;
  
  if (!user || !doctorId) return null;

  return (
    <main>
      <nav>
        <div>
          <strong>Hospital System</strong>
        </div>
        <div>
          <a href="/dashboard">Dashboard</a>
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
        </div>
      </nav>
      <h1>Manage Schedule</h1>
      <form onSubmit={(e) => { e.preventDefault(); loadSchedule(); }} style={{ marginBottom: '1rem' }}>
        <label htmlFor="dateFilter">Filter by date:</label>
        <input
          id="dateFilter"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="submit">Apply</button>
      </form>
      {loading && <p>Loading schedule...</p>}
      {error && <p className="error">{error}</p>}
      {slots.length === 0 && !loading && <p>No slots found.</p>}
      {slots.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id}>
                <td>{slot.slot_date}</td>
                <td>{slot.slot_time}</td>
                <td>{slot.is_booked ? 'Booked' : 'Available'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <section style={{ marginTop: '2rem' }}>
        <h2>Add Available Slots</h2>
        <form onSubmit={handleAddSlots}>
          {newSlots.map((slot, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="date"
                value={slot.date}
                onChange={(e) => handleNewSlotChange(index, 'date', e.target.value)}
                required
              />
              <input
                type="time"
                value={slot.time}
                onChange={(e) => handleNewSlotChange(index, 'time', e.target.value)}
                required
              />
            </div>
          ))}
          <button type="button" onClick={addSlotField}>Add another slot</button>
          <button type="submit" style={{ marginLeft: '1rem' }}>Save Slots</button>
        </form>
      </section>
    </main>
  );
}
