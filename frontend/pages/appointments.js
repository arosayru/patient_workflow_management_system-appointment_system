import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from './_app';
import { apiFetch } from '../utils/api';

export default function Appointments() {
  const { user, token, logout, authReady } = useContext(AuthContext);
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [changes, setChanges] = useState({});

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      router.replace('/login');
    } else {
      loadAppointments();
    }
  }, [authReady, user]);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/appointments', { token });
      setAppointments(data);
      const initialChanges = {};
      data.forEach((appt) => {
        initialChanges[appt.id] = { status: appt.status, notes: appt.notes || '' };
      });
      setChanges(initialChanges);
    } catch (err) {
      setError(err.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, status, notes) => {
    try {
      await apiFetch(`/appointments/${id}`, {
        method: 'PUT',
        token,
        data: { status, notes },
      });
      loadAppointments();
    } catch (err) {
      alert(err.data?.message || 'Update failed');
    }
  };

  const handleChange = (id, field, value) => {
    setChanges((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
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
      <h1>Appointments</h1>
      {loading && <p>Loading appointments...</p>}
      {error && <p className="error">{error}</p>}
      {appointments.length === 0 && !loading && <p>No appointments found.</p>}
      {appointments.length > 0 && (
        <table>
          <thead>
            <tr>
              {user.role !== 'patient' && <th>Patient</th>}
              {user.role !== 'doctor' && <th>Doctor</th>}
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Notes</th>
              {user.role !== 'patient' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => {
              const canEdit = user.role === 'doctor' || user.role === 'admin';
              const change = changes[appt.id] || { status: appt.status, notes: appt.notes || '' };
              return (
                <tr key={appt.id}>
                  {user.role !== 'patient' && <td>{appt.patient_name}</td>}
                  {user.role !== 'doctor' && <td>{appt.doctor_name}</td>}
                  <td>{appt.slot_date}</td>
                  <td>{appt.slot_time}</td>
                  <td>
                    {canEdit ? (
                      <select
                        value={change.status}
                        onChange={(e) => handleChange(appt.id, 'status', e.target.value)}
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    ) : (
                      appt.status
                    )}
                  </td>
                  <td>
                    {canEdit ? (
                      <input
                        type="text"
                        value={change.notes}
                        onChange={(e) => handleChange(appt.id, 'notes', e.target.value)}
                      />
                    ) : (
                      appt.notes
                    )}
                  </td>
                  {canEdit && (
                    <td>
                      <button onClick={() => handleUpdate(appt.id, change.status, change.notes)}>Save</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
