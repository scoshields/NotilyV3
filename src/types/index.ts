export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  emergency_contact: string;
  emergency_phone: string;
  date_of_birth: string;
  address: string;
  insurance?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  client_id: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  type: 'initial' | 'individual' | 'family' | 'couple' | 'followup' | 'emergency' | 'telehealth';
  recurrence?: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'none';
    endDate?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TherapyNote {
  id: string;
  client_id: string;
  session_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}