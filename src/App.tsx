import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { useStore } from './store';
import { supabase } from './lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function App() {
  const { user, isInitialized, isLoading, initialize, setUser, setIsLoading } = useStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          await setUser(session.user);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            await setUser(session.user);
          } else if (event === 'SIGNED_OUT') {
            await setUser(null);
          }
        });

        if (!isInitialized) {
          await initialize();
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        await setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, [initialize, isInitialized, setUser, setIsLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!user ? <Auth mode="signin" /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!user ? <Auth mode="signup" /> : <Navigate to="/dashboard" replace />} />
        <Route path="/pricing" element={<LandingPage />} />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;