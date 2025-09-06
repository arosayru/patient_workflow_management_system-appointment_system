import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from './_app';
import { apiFetch } from '../utils/api';

export default function MedicalRecordsPage() {
  const { user, token, logout, authReady } = useContext(AuthContext);
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ appointmentId: '', diagnosis: '', prescription: '', attachments: '' });

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      router.replace('/login');
    } else {
      loadRecords();
    }
  }, [authReady, user]);

  const loadRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      const data = await apiFetch(`/medical-records?${params.toString()}`, { token });
      setRecords(data);
    } catch (err) {
      setError(err.data?.message || 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/medical-records', { method: 'POST', token, data: form });
      setForm({ appointmentId: '', diagnosis: '', prescription: '', attachments: '' });
      loadRecords();
    } catch (err) {
      alert(err.data?.message || 'Failed to save record');
    }
  };

  if (!authReady) return null;
  if (!user) return null;

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
      <h1>Medical Records</h1>
      {loading && <p>Loading records...</p>}
      {error && <p className="error">{error}</p>}
      {records.length === 0 && !loading && <p>No records found.</p>}
      {records.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Appointment ID</th>
              <th>Diagnosis</th>
              <th>Prescription</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec.id}>
                <td>{rec.patient_name}</td>
                <td>{rec.doctor_name}</td>
                <td>{rec.appointment_id}</td>
                <td>{rec.diagnosis}</td>
                <td>{rec.prescription}</td>
                <td>{new Date(rec.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {user.role === 'doctor' && (
        <section style={{ marginTop: '2rem' }}>
          <h2>Create or Update Record</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="number"
              placeholder="Appointment ID"
              value={form.appointmentId}
              onChange={(e) => handleChange('appointmentId', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Diagnosis"
              value={form.diagnosis}
              onChange={(e) => handleChange('diagnosis', e.target.value)}
            />
            <input
              type="text"
              placeholder="Prescription"
              value={form.prescription}
              onChange={(e) => handleChange('prescription', e.target.value)}
            />
            <textarea
              placeholder="Attachments (optional)"
              value={form.attachments}
              onChange={(e) => handleChange('attachments', e.target.value)}
            />
            <button type="submit">Save Record</button>
          </form>
        </section>
      )}
    </main>
  );
}
