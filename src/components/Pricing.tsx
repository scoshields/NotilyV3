import React from 'react';
import { PricingCard } from './PricingCard';
import { useNavigate } from 'react-router-dom';

const monthlyFeatures = [
  { text: 'Unlimited clients', included: true },
  { text: 'Session scheduling', included: true },
  { text: 'Client notes & documentation', included: true },
  { text: 'Basic analytics', included: true },
  { text: 'Email support', included: true },
  { text: 'Advanced analytics', included: false },
  { text: 'Priority support', included: false },
];

const annualFeatures = [
  { text: 'Unlimited clients', included: true },
  { text: 'Session scheduling', included: true },
  { text: 'Client notes & documentation', included: true },
  { text: 'Basic analytics', included: true },
  { text: 'Email support', included: true },
  { text: 'Advanced analytics', included: true },
  { text: 'Priority support', included: true },
];

export const Pricing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">
            Pricing
          </h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose the right plan for you
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
          <PricingCard
            title="Monthly"
            price={9.99}
            period="month"
            features={monthlyFeatures}
          />
          <PricingCard
            title="Annual"
            price={99.99}
            period="year"
            features={annualFeatures}
            popular={true}
          />
        </div>
        <div className="mt-16 text-center">
          <button
            onClick={() => navigate('/signup')}
            className="btn px-8 py-4 text-lg"
          >
            Start Free Trial
          </button>
          <p className="mt-4 text-sm text-gray-500">
            14-day free trial, no credit card required
          </p>
        </div>
      </div>
    </div>
  );
};