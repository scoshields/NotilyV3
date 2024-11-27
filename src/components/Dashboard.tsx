import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Brain, LogOut, Home, Users, Calendar, FileText, UserCircle } from 'lucide-react';
import { ClientForm } from './ClientForm';
import { ClientList } from './ClientList';
import { ClientProfile } from './ClientProfile';
import { SessionCalendar } from './SessionCalendar';
import { TherapyNotes } from './TherapyNotes';
import { DashboardHome } from './DashboardHome';
import { UserProfile } from './UserProfile';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import type { Client, Session, TherapyNote } from '../types';

export const Dashboard: React.FC = () => {
  const { signOut } = useStore();
  const location = useLocation();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notes, setNotes] = useState<TherapyNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch subscription status
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', user.id)
          .single();

        if (!userError && userData) {
          setSubscriptionStatus(userData.subscription_status);
        }

        // Fetch clients
        const { data: clientsData } = await supabase
          .from('clients')
          .select('*')
          .eq('therapist_id', user.id);

        if (clientsData) setClients(clientsData);

        // Fetch sessions
        const { data: sessionsData } = await supabase
          .from('sessions')
          .select('*')
          .eq('therapist_id', user.id);

        if (sessionsData) setSessions(sessionsData);

        // Fetch notes
        const { data: notesData } = await supabase
          .from('therapy_notes')
          .select('*')
          .eq('therapist_id', user.id);

        if (notesData) setNotes(notesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const hasAccess = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
  const isCancelled = subscriptionStatus === 'cancelled' || subscriptionStatus === 'inactive';
  const isProfilePage = location.pathname === '/dashboard/profile';

  // Only redirect to profile if cancelled/inactive and not already on profile page
  if (!hasAccess && isCancelled && !isProfilePage) {
    return <Navigate to="/dashboard/profile" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', requiresSubscription: false },
    { path: '/dashboard/clients', icon: Users, label: 'Clients', requiresSubscription: false },
    { path: '/dashboard/schedule', icon: Calendar, label: 'Schedule', requiresSubscription: false },
    { path: '/dashboard/notes', icon: FileText, label: 'Notes', requiresSubscription: false },
    { path: '/dashboard/profile', icon: UserCircle, label: 'Profile', requiresSubscription: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50">
      <nav className="glass fixed w-full z-50 border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Brain className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold gradient-text">
                  Notily
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map(({ path, icon: Icon, label }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === '/dashboard'}
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="btn"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<DashboardHome clients={clients} sessions={sessions} notes={notes} />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/schedule" element={<SessionCalendar />} />
            <Route path="/notes" element={<TherapyNotes />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};