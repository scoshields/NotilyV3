import React from 'react';
import { format, parseISO, isWithinInterval, startOfYear, endOfYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isFuture, isToday } from 'date-fns';
import { Calendar, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import type { Client, Session, TherapyNote } from '../types';
import { SessionAnalytics } from './SessionAnalytics';

interface Props {
  clients: Client[];
  sessions: Session[];
  notes: TherapyNote[];
}

export const DashboardHome: React.FC<Props> = ({ clients = [], sessions = [], notes = [] }) => {
  const activeClients = clients.filter(client => client.status === 'active');
  const inactiveClients = clients.filter(client => client.status === 'inactive');

  // Get next session
  const nextSession = sessions
    .filter(s => isFuture(parseISO(`${s.date}T${s.time}`)) && s.status !== 'cancelled')
    .sort((a, b) => parseISO(`${a.date}T${a.time}`).getTime() - parseISO(`${b.date}T${b.time}`).getTime())[0];

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';
  };

  // Today's sessions stats
  const todaySessions = sessions.filter(s => isToday(parseISO(s.date)));
  const todayCompletedSessions = todaySessions.filter(s => s.status === 'completed');
  const completionRate = todaySessions.length > 0 
    ? (todayCompletedSessions.length / todaySessions.length) * 100 
    : 0;

  // Weekly stats
  const weekSessions = sessions.filter(s => 
    isWithinInterval(parseISO(s.date), {
      start: startOfWeek(new Date()),
      end: endOfWeek(new Date())
    })
  );

  // Monthly stats
  const monthSessions = sessions.filter(s => 
    isWithinInterval(parseISO(s.date), {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    })
  );

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Today's Sessions</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{todaySessions.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{todayCompletedSessions.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{completionRate.toFixed(0)}%</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Clients</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{activeClients.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Analytics */}
        <SessionAnalytics sessions={sessions} />

        {/* Next Session Card */}
        {nextSession && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Next Session</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                nextSession.type === 'initial' ? 'bg-blue-100 text-blue-800' :
                nextSession.type === 'emergency' ? 'bg-red-100 text-red-800' :
                'bg-green-100 text-green-800'
              }`}>
                {nextSession.type}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <p className="text-xl font-semibold text-gray-900">{getClientName(nextSession.client_id)}</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{format(parseISO(nextSession.date), 'PPPP')}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{format(parseISO(`${nextSession.date}T${nextSession.time}`), 'p')} ({nextSession.duration} minutes)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Overview */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">Client Overview</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Clients</span>
              <span className="font-medium">{clients.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Active Clients</span>
              <span className="font-medium">{activeClients.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Inactive Clients</span>
              <span className="font-medium">{inactiveClients.length}</span>
            </div>
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">Weekly Overview</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Sessions</span>
              <span className="font-medium">{weekSessions.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Completed</span>
              <span className="font-medium">
                {weekSessions.filter(s => s.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Cancelled</span>
              <span className="font-medium">
                {weekSessions.filter(s => s.status === 'cancelled').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};