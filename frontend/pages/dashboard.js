import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from './_app';
import { apiFetch } from '../utils/api';

export default function Dashboard() {
  const { user, token, logout } = useContext(AuthContext);
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'admin') {
      setLoadingAnalytics(true);
      apiFetch('/analytics', { token })
        .then((data) => {
          setAnalytics(data);
          setLoadingAnalytics(false);
        })
        .catch((err) => {
          setError(err.data?.message || 'Failed to load analytics');
          setLoadingAnalytics(false);
        });
    }
  }, [user, token, router]);

  if (!user) return null;

  return (
    <main>
      <nav>
        <div>
          <strong>Hospital System</strong>
        </div>
        <div>
          {user.role === 'patient' && (
            <>
              <a href="/doctors">Browse Doctors</a>
              <a href="/appointments">My Appointments</a>
            </>
          )}
          {user.role === 'doctor' && (
            <>
              <a href="/appointments">Appointments</a>
              <a href="/medical-records">Medical Records</a>
              <a href="/doctor/schedule">Manage Schedule</a>
            </>
          )}
          {user.role === 'admin' && (
            <>
              <a href="/admin/doctors">Manage Doctors</a>
              <a href="/appointments">Appointments</a>
            </>
          )}
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
        </div>
      </nav>
      <h1>Hello, {user.name}</h1>
      {user.role === 'admin' && (
        <section>
          <h2>Analytics</h2>
          {loadingAnalytics && <p>Loading analytics...</p>}
          {error && <p className="error">{error}</p>}
          {analytics && (
            <>
              <p>Total patients: {analytics.patientCount}</p>
              <h3>Appointments by Doctor</h3>
              <table>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Appointments</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.appointmentsByDoctor.map((row) => (
                    <tr key={row.doctor_id}>
                      <td>{row.doctor_name}</td>
                      <td>{row.appointment_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      )}
    </main>
  );
}