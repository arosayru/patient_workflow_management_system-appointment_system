import { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from './_app';
import { apiFetch } from '../utils/api';

export default function Login() {
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
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        data: { email, password },
      });
      login(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err.data?.message || 'Login failed');
    }
  };

  return (
    <main>
      <h1>Log in</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Log in</button>
      </form>
      <p>
        Don&apos;t have an account? <a href="/register">Register</a>
      </p>
    </main>
  );
}