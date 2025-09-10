import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SignIn from './SignIn';
import SignUp from './SignUp';

type AuthMode = 'signin' | 'signup';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [error, setError] = useState<string>('');
  const { signIn, signUp, isLoading } = useAuth();

  const handleSignIn = async (email: string, password: string) => {
    try {
      setError('');
      await signIn({ email, password });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignUp = async (email: string, password: string, name: string, phone: string) => {
    try {
      setError('');
      await signUp({ email, password, name, phone });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      {mode === 'signin' ? (
        <SignIn
          onSignIn={handleSignIn}
          onSwitchToSignUp={() => setMode('signup')}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <SignUp
          onSignUp={handleSignUp}
          onSwitchToSignIn={() => setMode('signin')}
          isLoading={isLoading}
          error={error}
        />
      )}
    </>
  );
};

export default AuthPage;
