import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, isToday, parseISO } from 'date-fns';
import type { TherapyNote, Client, Session } from '../types';

export const TherapyNotes: React.FC = () => {
  const [notes, setNotes] = useState<TherapyNote[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today'>('today');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Fetch all sessions for today
      const today = new Date().toISOString().split('T')[0];
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('therapist_id', user.id)
        .eq('date', today)
        .order('time', { ascending: true });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('therapy_notes')
        .select('*')
        .eq('therapist_id', user.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('therapist_id', user.id);

      if (clientsError) throw clientsError;
      setClients(clientsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load notes and sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';
  };

  const getTodaysSessions = () => {
    return sessions.filter(session => {
      return session.status === 'scheduled' || session.status === 'completed';
    });
  };

  const getFilteredNotes = () => {
    if (filter === 'all') {
      return notes;
    }
    return notes.filter(note => isToday(new Date(note.created_at)));
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (error) {
      return timeString;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Loading notes...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      </div>
    );
  }

  const todaysSessions = getTodaysSessions();
  const filteredNotes = getFilteredNotes();
  const incompleteSessions = todaysSessions.filter(session => !notes.some(note => note.session_id === session.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Session Notes</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'today'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'all'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            All Notes
          </button>
        </div>
      </div>

      {filter === 'today' && incompleteSessions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Incomplete Notes</h3>
          <div className="space-y-4">
            {incompleteSessions.map((session) => (
              <div key={session.id} className="bg-white shadow rounded-lg p-6 border-l-4 border-yellow-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {getClientName(session.client_id)}
                    </h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{formatTime(session.time)} ({session.duration} minutes)</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <span>Note pending</span>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Note Required
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredNotes.length === 0 && incompleteSessions.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'today' 
              ? 'No notes or scheduled sessions for today'
              : 'Notes will appear here after sessions are completed'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {getClientName(note.client_id)}
                  </h3>
                  <div className="mt-2 flex items-center text-gray-500">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{format(new Date(note.created_at), 'PPpp')}</span>
                  </div>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-600">{note.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};