import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../_app';
import { apiFetch } from '../../utils/api';

export default function ManageDoctors() {
  const { user, token, logout, authReady } = useContext(AuthContext);
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    password: '',
    specialty: '',
    location: '',
    bio: '',
    profilePicture: '',
  });

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'admin') {
      router.replace('/dashboard');
    } else {
      loadDoctors();
    }
  }, [authReady, user]);

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/doctors', { token });
      setDoctors(data);
    } catch (err) {
      setError(err.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setNewDoctor((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/doctors', { method: 'POST', token, data: newDoctor });
      setNewDoctor({
        name: '', email: '', password: '', specialty: '', location: '', bio: '', profilePicture: '',
      });
      loadDoctors();
    } catch (err) {
      alert(err.data?.message || 'Failed to add doctor');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await apiFetch(`/doctors/${id}`, { method: 'DELETE', token });
      loadDoctors();
    } catch (err) {
      alert(err.data?.message || 'Failed to delete doctor');
    }
  };

  if (!authReady) return null;
  if (!user || user.role !== 'admin') return null;

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
      <h1>Manage Doctors</h1>
      {loading && <p>Loading doctors...</p>}
      {error && <p className="error">{error}</p>}
      {doctors.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialty</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.name}</td>
                <td>{doc.specialty}</td>
                <td>{doc.location}</td>
                <td>
                  <button onClick={() => handleDelete(doc.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <section style={{ marginTop: '2rem' }}>
        <h2>Add New Doctor</h2>
        <form onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Name"
            value={newDoctor.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newDoctor.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={newDoctor.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Specialty"
            value={newDoctor.specialty}
            onChange={(e) => handleChange('specialty', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={newDoctor.location}
            onChange={(e) => handleChange('location', e.target.value)}
            required
          />
          <textarea
            placeholder="Bio"
            value={newDoctor.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
          />
          <input
            type="text"
            placeholder="Profile Picture URL (optional)"
            value={newDoctor.profilePicture}
            onChange={(e) => handleChange('profilePicture', e.target.value)}
          />
          <button type="submit">Add Doctor</button>
        </form>
      </section>
    </main>
  );
}
