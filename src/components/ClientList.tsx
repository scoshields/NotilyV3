import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { User, Mail, Phone, Calendar, ToggleLeft, ToggleRight, Plus, ArrowLeft } from 'lucide-react';
import { Client, Session, TherapyNote } from '../types';
import { supabase } from '../lib/supabase';
import { ClientForm } from './ClientForm';
import { ClientProfile } from './ClientProfile';

export const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSessions, setClientSessions] = useState<Session[]>([]);
  const [clientNotes, setClientNotes] = useState<TherapyNote[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientSessions(selectedClient.id);
      fetchClientNotes(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientSessions = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

      if (error) throw error;
      setClientSessions(data || []);
    } catch (err) {
      console.error('Error fetching client sessions:', err);
    }
  };

  const fetchClientNotes = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('therapy_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientNotes(data || []);
    } catch (err) {
      console.error('Error fetching client notes:', err);
    }
  };

  const handleAddClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientData,
          therapist_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => [data, ...prev]);
      setShowAddClient(false);
    } catch (err) {
      console.error('Error adding client:', err);
      throw err;
    }
  };

  const handleAddSession = async (sessionData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          ...sessionData,
          therapist_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      setClientSessions(prev => [data, ...prev]);
    } catch (err) {
      console.error('Error adding session:', err);
      throw err;
    }
  };

  const handleUpdateSession = async (sessionId: string, sessionData: any) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      setClientSessions(prev => prev.map(s => s.id === sessionId ? data : s));
    } catch (err) {
      console.error('Error updating session:', err);
      throw err;
    }
  };

  const toggleStatus = async (client: Client) => {
    try {
      const newStatus = client.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', client.id);

      if (error) throw error;

      setClients(prev => prev.map(c => 
        c.id === client.id ? { ...c, status: newStatus } : c
      ));

      if (selectedClient?.id === client.id) {
        setSelectedClient({ ...selectedClient, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating client status:', err);
      throw err;
    }
  };

  const filteredClients = clients
    .filter(client => {
      if (filter === 'all') return true;
      return client.status === filter;
    })
    .filter(client => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        client.first_name?.toLowerCase().includes(searchLower) ||
        client.last_name?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower)
      );
    });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Loading clients...</h3>
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

  if (selectedClient) {
    return (
      <ClientProfile
        client={selectedClient}
        sessions={clientSessions}
        notes={clientNotes}
        onBack={() => setSelectedClient(null)}
        onAddSession={handleAddSession}
        onUpdateSession={handleUpdateSession}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
        <button
          onClick={() => setShowAddClient(true)}
          className="btn"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Client
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'inactive'
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white relative group cursor-pointer"
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatus(client);
                }}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
                title={`Toggle status (currently ${client.status})`}
              >
                {client.status === 'active' ? (
                  <ToggleRight className="h-6 w-6" />
                ) : (
                  <ToggleLeft className="h-6 w-6" />
                )}
              </button>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-gray-900 truncate">
                  {client.first_name} {client.last_name}
                </h4>
                <div className="mt-1 flex flex-col space-y-2">
                  {client.email && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Client since {format(new Date(client.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  client.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by adding a new client'}
          </p>
        </div>
      )}

      {showAddClient && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <ClientForm
              onSubmit={handleAddClient}
              onCancel={() => setShowAddClient(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};