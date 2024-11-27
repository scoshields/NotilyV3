export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          therapist_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          date_of_birth: string | null
          address: string | null
          insurance: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          date_of_birth?: string | null
          address?: string | null
          insurance?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          date_of_birth?: string | null
          address?: string | null
          insurance?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          therapist_id: string
          client_id: string
          date: string
          time: string
          duration: number
          status: 'scheduled' | 'completed' | 'cancelled'
          type: 'initial' | 'individual' | 'family' | 'couple' | 'followup' | 'emergency' | 'telehealth'
          notes: string | null
          recurrence: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          client_id: string
          date: string
          time: string
          duration: number
          status?: 'scheduled' | 'completed' | 'cancelled'
          type: 'initial' | 'individual' | 'family' | 'couple' | 'followup' | 'emergency' | 'telehealth'
          notes?: string | null
          recurrence?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          client_id?: string
          date?: string
          time?: string
          duration?: number
          status?: 'scheduled' | 'completed' | 'cancelled'
          type?: 'initial' | 'individual' | 'family' | 'couple' | 'followup' | 'emergency' | 'telehealth'
          notes?: string | null
          recurrence?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      therapy_notes: {
        Row: {
          id: string
          therapist_id: string
          client_id: string
          session_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          client_id: string
          session_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          client_id?: string
          session_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}