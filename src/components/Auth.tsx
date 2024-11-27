import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, LogIn, UserPlus, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthProps {
  mode?: 'signin' | 'signup';
}

export const Auth: React.FC<AuthProps> = ({ mode: initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const createUserRecord = async (userId: string, email: string): Promise<void> => {
    try {
      const now = new Date().toISOString();
      
      // First try with authenticated user
      let { error } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: email,
          trial_start_date: now,
          created_at: now,
          updated_at: now
        }]);

      // If that fails, try with service role client
      if (error?.code === '42501') {
        const serviceRoleClient = supabase.auth.admin;
        if (!serviceRoleClient) throw new Error('Service role client not available');
        
        ({ error } = await serviceRoleClient.createUser({
          id: userId,
          email: email,
          trial_start_date: now,
          created_at: now,
          updated_at: now
        }));
      }

      if (error) throw error;
    } catch (error) {
      console.error('Error creating user record:', error);
      throw error;
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (mode === 'signin') {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password');
          }
          throw signInError;
        }

        if (!authData.user) {
          throw new Error('No user data received');
        }

        await setUser(authData.user);
        navigate('/dashboard');
      } else {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });

        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            throw new Error('An account with this email already exists');
          }
          throw signUpError;
        }

        if (!authData.user) {
          throw new Error('No user data received');
        }

        await createUserRecord(authData.user.id, authData.user.email!);
        setSignUpSuccess(true);
        reset();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Brain className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin' ? 'Sign in to your account' : 'Start your free trial'}
        </h2>
        {mode === 'signup' && (
          <p className="mt-2 text-center text-sm text-gray-600">
            14-day free trial, no credit card required
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {signUpSuccess ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Account created successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Please check your email to verify your account.</p>
                    <button
                      onClick={() => {
                        setMode('signin');
                        setSignUpSuccess(false);
                      }}
                      className="mt-3 text-sm font-medium text-green-600 hover:text-green-500"
                    >
                      Click here to sign in
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    {...register('password')}
                    type="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {mode === 'signin' ? (
                    <LogIn className="h-5 w-5 mr-2" />
                  ) : (
                    <UserPlus className="h-5 w-5 mr-2" />
                  )}
                  {isLoading
                    ? mode === 'signin'
                      ? 'Signing in...'
                      : 'Starting trial...'
                    : mode === 'signin'
                    ? 'Sign in'
                    : 'Start free trial'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                    reset();
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {mode === 'signin'
                    ? "Don't have an account? Start free trial"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};