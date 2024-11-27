import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { format, addDays, differenceInDays } from 'date-fns';
import { UserCircle, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MONTHLY_PAYMENT_LINK = 'https://buy.stripe.com/test_eVa9CvbT75rwaUUaEF';
const ANNUAL_PAYMENT_LINK = 'https://buy.stripe.com/test_fZebKDbT74ns9QQ288';

export const UserProfile: React.FC = () => {
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('No authenticated session');
        }

        const { data, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handlePayment = (plan: 'monthly' | 'annual') => {
    const link = plan === 'monthly' ? MONTHLY_PAYMENT_LINK : ANNUAL_PAYMENT_LINK;
    window.open(link, '_blank', 'width=800,height=600');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <UserCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No profile data found</h3>
      </div>
    );
  }

  const subscriptionStatus = userData.subscription_status || 'trialing';
  const isTrialing = subscriptionStatus === 'trialing';
  const isActive = subscriptionStatus === 'active';
  const isCancelled = subscriptionStatus === 'cancelled';
  const trialDaysLeft = userData.trial_start_date
    ? differenceInDays(
        addDays(new Date(userData.trial_start_date), 14),
        new Date()
      )
    : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your account and subscription details
          </p>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user?.email}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Subscription status</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : isTrialing
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                </span>
              </dd>
            </div>

            {isTrialing && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Trial status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {trialDaysLeft > 0 ? (
                    <span className="text-blue-600">
                      {trialDaysLeft} days remaining in trial
                    </span>
                  ) : (
                    <span className="text-red-600">Trial expired</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <div className="space-y-4">
            {(!isActive || isTrialing) && !isCancelled && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  <p className="text-sm text-gray-700">
                    {isTrialing
                      ? 'Your trial will expire soon. Upgrade to continue using all features.'
                      : 'Upgrade your account to access all features.'}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handlePayment('monthly')}
                    className="btn flex-1"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Monthly Plan
                  </button>
                  <button
                    onClick={() => handlePayment('annual')}
                    className="btn flex-1"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Annual Plan
                  </button>
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Your subscription has been cancelled
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-yellow-700">
                        Resubscribe to maintain full access to all features.
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handlePayment('monthly')}
                          className="btn-secondary"
                        >
                          Resubscribe Monthly
                        </button>
                        <button
                          onClick={() => handlePayment('annual')}
                          className="btn"
                        >
                          Resubscribe Annually
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};