import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../_app';
import { apiFetch } from '../../utils/api';

export default function DoctorsPage() {
  const { token, user } = useContext(AuthContext);
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (specialty) params.append('specialty', specialty);
      if (location) params.append('location', location);
      if (date) params.append('date', date);
      const data = await apiFetch(`/doctors?${params.toString()}`, { token });
      setDoctors(data);
    } catch (err) {
      setError(err.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <main>
      <nav>
        <div>
          <strong>Hospital System</strong>
        </div>
        <div>
          {user ? (
            <>
              <a href="/dashboard">Dashboard</a>
              <a href="/appointments">My Appointments</a>
            </>
          ) : (
            <>
              <a href="/login">Login</a>
              <a href="/register">Register</a>
            </>
          )}
        </div>
      </nav>
      <h1>Find a Doctor</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {loading && <p>Loading doctors...</p>}
      {error && <p className="error">{error}</p>}
      <ul>
        {doctors.map((doc) => (
          <li key={doc.id} style={{ marginTop: '1rem' }}>
            <strong>{doc.name}</strong> – {doc.specialty}, {doc.location}
            <br />
            <a href={`/doctors/${doc.id}`}>View Profile</a>
            {date && doc.availableSlots && doc.availableSlots.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong>Available slots on {date}:</strong>{' '}
                {doc.availableSlots.map((s) => `${s.slot_time}`).join(', ')}
              </div>
            )}
            {date && doc.availableSlots && doc.availableSlots.length === 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                No available slots on {date}
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}