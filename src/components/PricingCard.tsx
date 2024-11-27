import React from 'react';
import { Check } from 'lucide-react';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface Props {
  title: string;
  price: number;
  period: string;
  features: PricingFeature[];
  popular?: boolean;
}

export const PricingCard: React.FC<Props> = ({
  title,
  price,
  period,
  features,
  popular = false,
}) => {
  return (
    <div
      className={`relative rounded-2xl border ${
        popular
          ? 'border-indigo-600 shadow-indigo-100'
          : 'border-gray-200'
      } bg-white p-8 shadow-lg ${popular ? 'shadow-xl' : ''}`}
    >
      {popular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
          Most Popular
        </div>
      )}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="mt-4 flex items-baseline justify-center gap-x-2">
          <span className="text-5xl font-bold tracking-tight text-gray-900">
            ${price}
          </span>
          <span className="text-sm font-semibold leading-6 text-gray-600">
            /{period}
          </span>
        </div>
      </div>
      <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
        {features.map((feature, index) => (
          <li key={index} className="flex gap-x-3">
            <Check
              className={`h-6 w-5 flex-none ${
                feature.included ? 'text-indigo-600' : 'text-gray-400'
              }`}
              aria-hidden="true"
            />
            {feature.text}
          </li>
        ))}
      </ul>
    </div>
  );
};