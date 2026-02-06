import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { Agenda } from './pages/Agenda';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Financial } from './pages/Financial';
import { Login } from './pages/Login';
import { View } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);

  if (!user) {
    return <Login />;
  }

  const navigateTo = (view: View, params?: any) => {
    setViewParams(params);
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={navigateTo} />;
      case 'patients':
        return <Patients patientId={viewParams?.patientId} />;
      case 'agenda':
        return <Agenda onNavigate={navigateTo} />;
      case 'financial':
        return <Financial />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onViewChange={navigateTo} />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={navigateTo}>
      {renderView()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}