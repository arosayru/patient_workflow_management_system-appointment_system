import { useState, useEffect, createContext } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';

export const AuthContext = createContext({});

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(undefined);
  const [token, setToken] = useState(undefined);
  const [authReady, setAuthReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setUser(data.user);
          setToken(data.token);
        } catch (err) {
          console.warn('Failed to parse auth from storage', err);
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user && token) {
        localStorage.setItem('auth', JSON.stringify({ user, token }));
      } else if (user === null) {
        localStorage.removeItem('auth');
      }
    }
  }, [user, token]);

  const login = (data) => {
    setUser(data.user);
    setToken(data.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth', JSON.stringify(data));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth');
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authReady }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}

export default MyApp;
