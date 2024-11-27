import React, { useState } from 'react';
import { format, parseISO, isWithinInterval, startOfYear, endOfYear } from 'date-fns';
import { BarChart3, Calendar } from 'lucide-react';
import type { Session } from '../types';

interface Props {
  sessions: Session[];
}

type DateRange = 'year' | 'month' | 'week' | 'custom';

export const SessionAnalytics: React.FC<Props> = ({ sessions }) => {
  const [dateRange, setDateRange] = useState<DateRange>('year');
  const [customStartDate, setCustomStartDate] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(endOfYear(new Date()), 'yyyy-MM-dd'));

  const getFilteredSessions = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (dateRange) {
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        break;
      case 'custom':
        startDate = parseISO(customStartDate);
        endDate = parseISO(customEndDate);
        break;
      default:
        startDate = startOfYear(now);
        endDate = endOfYear(now);
    }

    return sessions.filter(session => {
      const sessionDate = parseISO(session.date);
      return isWithinInterval(sessionDate, { start: startDate, end: endDate }) &&
             session.status === 'completed';
    });
  };

  const calculateHoursByType = () => {
    const filteredSessions = getFilteredSessions();
    const hoursByType: Record<string, number> = {};

    filteredSessions.forEach(session => {
      const hours = session.duration / 60;
      hoursByType[session.type] = (hoursByType[session.type] || 0) + hours;
    });

    return hoursByType;
  };

  const hoursByType = calculateHoursByType();
  const totalHours = Object.values(hoursByType).reduce((sum, hours) => sum + hours, 0);

  const sessionTypes = {
    initial: 'Initial',
    individual: 'Individual',
    family: 'Family',
    couple: 'Couple',
    followup: 'Follow-up',
    emergency: 'Emergency',
    telehealth: 'Telehealth'
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      initial: 'bg-blue-100 text-blue-800',
      individual: 'bg-green-100 text-green-800',
      family: 'bg-purple-100 text-purple-800',
      couple: 'bg-pink-100 text-pink-800',
      followup: 'bg-yellow-100 text-yellow-800',
      emergency: 'bg-red-100 text-red-800',
      telehealth: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-medium text-gray-900">Session Analytics</h2>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="year">This Year</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {dateRange === 'custom' && (
        <div className="flex items-center space-x-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total Hours</span>
          <span className="text-lg font-semibold text-gray-900">
            {totalHours.toFixed(1)}
          </span>
        </div>

        <div className="space-y-2">
          {Object.entries(hoursByType).map(([type, hours]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(type)}`}>
                  {sessionTypes[type as keyof typeof sessionTypes]}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {hours.toFixed(1)} hrs
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};