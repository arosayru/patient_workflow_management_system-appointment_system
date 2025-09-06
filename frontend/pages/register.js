import { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from './_app';
import { apiFetch } from '../utils/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useContext(AuthContext);
  const router = useRouter();

  if (user) {
    router.replace('/dashboard');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        data: { name, email, password },
      });
      login(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err.data?.message || 'Registration failed');
    }
  };

  return (
    <main>
      <h1>Register as a Patient</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
  );
}