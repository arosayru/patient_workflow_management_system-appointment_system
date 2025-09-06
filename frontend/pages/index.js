import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from './_app';

export default function Home() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);
  return (
    <main>
      <h1>Welcome to the Hospital Appointment System</h1>
      {!user && (
        <p>
          <a href="/login">Log in</a> or <a href="/register">register as a patient</a> to get started.
        </p>
      )}
    </main>
  );
}