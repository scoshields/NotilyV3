import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Edit2, Plus, X } from 'lucide-react';
import { SessionScheduler } from './SessionScheduler';
import type { Client, Session, TherapyNote } from '../types';

interface Props {
  client: Client;
  sessions: Session[];
  notes: TherapyNote[];
  onBack: () => void;
  onAddSession: (data: any) => Promise<void>;
  onUpdateSession: (id: string, data: any) => Promise<void>;
}

export const ClientProfile: React.FC<Props> = ({
  client,
  sessions,
  notes,
  onBack,
  onAddSession,
  onUpdateSession,
}) => {
  const [showNewSession, setShowNewSession] = useState(false);
  const [showNotes, setShowNotes] = useState<{ session: Session; note: TherapyNote } | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = parseISO(`${date}T${time}`);
      if (!isValid(dateTime)) return 'Invalid date';
      return format(dateTime, 'PPp');
    } catch (error) {
      console.error('Error formatting date time:', error);
      return 'Invalid date';
    }
  };

  const formatCreatedAt = (date: string) => {
    try {
      const parsedDate = parseISO(date);
      if (!isValid(parsedDate)) return 'Invalid date';
      return format(parsedDate, 'PPp');
    } catch (error) {
      console.error('Error formatting created at date:', error);
      return 'Invalid date';
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    const aDate = parseISO(`${a.date}T${a.time}`);
    const bDate = parseISO(`${b.date}T${b.time}`);
    return bDate.getTime() - aDate.getTime();
  });

  const upcomingSessions = sortedSessions.filter(session => {
    const sessionDate = parseISO(`${session.date}T${session.time}`);
    return sessionDate > new Date() && session.status !== 'cancelled';
  });

  const nextSession = upcomingSessions[0];

  const totalMinutes = sessions.reduce((total, session) => {
    return total + (session.status === 'completed' ? session.duration : 0);
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const lastNote = notes.length > 0 ? 
    notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] 
    : null;

  const handleSessionClick = (session: Session) => {
    const note = notes.find(n => n.session_id === session.id);
    if (note) {
      setShowNotes({ session, note });
    }
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setShowNewSession(true);
  };

  const handleSessionSubmit = async (data: any) => {
    if (editingSession) {
      await onUpdateSession(editingSession.id, data);
      setEditingSession(null);
    } else {
      await onAddSession(data);
    }
    setShowNewSession(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {client.first_name} {client.last_name}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Client Information</h2>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.email || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.phone || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.address || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Emergency Contact</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {client.emergency_contact ? (
                  <>
                    {client.emergency_contact}
                    {client.emergency_phone && ` (${client.emergency_phone})`}
                  </>
                ) : (
                  'Not provided'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Insurance</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.insurance || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Session Time</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {hours > 0 && `${hours} hour${hours !== 1 ? 's' : ''}`}
                {minutes > 0 && `${hours > 0 ? ' and ' : ''}${minutes} minute${minutes !== 1 ? 's' : ''}`}
                {hours === 0 && minutes === 0 && 'No completed sessions'}
              </dd>
            </div>
          </dl>
        </div>

        {nextSession && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Next Session</h2>
              <button
                onClick={() => handleEditSession(nextSession)}
                className="text-gray-400 hover:text-gray-500"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center text-gray-500">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{format(parseISO(nextSession.date), 'PPP')}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Clock className="h-5 w-5 mr-2" />
                <span>{format(parseISO(`${nextSession.date}T${nextSession.time}`), 'p')}</span>
              </div>
              <div className="text-sm text-gray-500">
                Duration: {nextSession.duration} minutes
              </div>
              <div className="text-sm text-gray-500">
                Type: {nextSession.type.charAt(0).toUpperCase() + nextSession.type.slice(1)}
              </div>
            </div>
          </div>
        )}

        {lastNote && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Latest Session Note</h2>
            <div className="prose max-w-none">
              <p className="text-gray-600">{lastNote.content}</p>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {formatCreatedAt(lastNote.created_at)}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Session History</h2>
            <button
              onClick={() => {
                setEditingSession(null);
                setShowNewSession(true);
              }}
              className="btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </button>
          </div>
          <div className="space-y-4">
            {sortedSessions.map((session) => {
              const hasNotes = notes.some(note => note.session_id === session.id);
              return (
                <div
                  key={session.id}
                  onClick={() => hasNotes && handleSessionClick(session)}
                  className={`p-4 rounded-lg border ${
                    hasNotes ? 'cursor-pointer hover:bg-gray-50' : ''
                  } ${session.status === 'cancelled' ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDateTime(session.date, session.time)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.duration} minutes - {session.type}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : session.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {session.status}
                      </span>
                      {session.status === 'scheduled' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSession(session);
                          }}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showNewSession && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <SessionScheduler
              clientId={client.id}
              sessionToEdit={editingSession}
              onSubmit={handleSessionSubmit}
              onCancel={() => {
                setShowNewSession(false);
                setEditingSession(null);
              }}
            />
          </div>
        </div>
      )}

      {showNotes && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Session Notes</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDateTime(showNotes.session.date, showNotes.session.time)}
                </p>
              </div>
              <button
                onClick={() => setShowNotes(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-600">{showNotes.note.content}</p>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Added on {formatCreatedAt(showNotes.note.created_at)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};