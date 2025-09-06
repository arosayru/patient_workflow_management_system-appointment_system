import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../_app';
import { apiFetch } from '../../utils/api';

export default function DoctorProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { user, token } = useContext(AuthContext);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    apiFetch(`/doctors/${id}`, { token })
      .then((data) => {
        setDoctor(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.data?.message || 'Failed to load doctor');
        setLoading(false);
      });
  }, [id, token]);

  const handleBook = async (slotId) => {
    setBookingMsg('');
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'patient') {
      setBookingMsg('Only patients can book appointments');
      return;
    }
    try {
      await apiFetch('/appointments', {
        method: 'POST',
        token,
        data: { doctorId: doctor.id, slotId },
      });
      setBookingMsg('Appointment booked successfully');
      const data = await apiFetch(`/doctors/${id}`, { token });
      setDoctor(data);
    } catch (err) {
      setBookingMsg(err.data?.message || 'Failed to book appointment');
    }
  };

  return (
    <main>
      <nav>
        <div>
          <strong>Hospital System</strong>
        </div>
        <div>
          <a href="/doctors">Back to search</a>
          {user && <a href="/dashboard">Dashboard</a>}
        </div>
      </nav>
      {loading && <p>Loading doctor...</p>}
      {error && <p className="error">{error}</p>}
      {doctor && (
        <>
          <h1>{doctor.name}</h1>
          <p>
            <strong>Specialty:</strong> {doctor.specialty}
          </p>
          <p>
            <strong>Location:</strong> {doctor.location}
          </p>
          {doctor.bio && (
            <p>
              <strong>Bio:</strong> {doctor.bio}
            </p>
          )}
          <h2>Available slots</h2>
          {doctor.availableSlots.length === 0 && <p>No available slots.</p>}
          {doctor.availableSlots.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {doctor.availableSlots.map((slot) => (
                  <tr key={slot.id}>
                    <td>{slot.slot_date}</td>
                    <td>{slot.slot_time}</td>
                    <td>
                      <button onClick={() => handleBook(slot.id)}>Book</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {bookingMsg && <p className={bookingMsg.startsWith('Appointment') ? 'success' : 'error'}>{bookingMsg}</p>}
        </>
      )}
    </main>
  );
}