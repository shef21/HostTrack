import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';

function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
