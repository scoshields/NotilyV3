import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Check, X } from 'lucide-react';

const clientSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  emergency_contact: z.string().optional().or(z.literal('')),
  emergency_phone: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().refine((date) => !date || /^\d{4}-\d{2}-\d{2}$/.test(date), {
    message: 'Invalid date format',
  }).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  insurance: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Props {
  onSubmit: (data: ClientFormData) => Promise<void>;
}

export const ClientForm: React.FC<Props> = ({ onSubmit }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: 'active',
    },
  });

  const onSubmitForm = async (data: ClientFormData) => {
    try {
      setShowError(false);
      setErrorMessage('');
      
      // Clean up empty date before submission
      const cleanedData = {
        ...data,
        date_of_birth: data.date_of_birth || null,
      };

      await onSubmit(cleanedData);
      setShowSuccess(true);
      reset();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error adding client:', error);
      setShowError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add client');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {showSuccess && (
        <div className="rounded-md bg-green-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Client added successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {showError && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {errorMessage || 'There was an error adding the client. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4 mb-8">
        <UserPlus className="h-8 w-8 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">New Client</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('first_name')}
            className="input"
            disabled={isSubmitting}
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label className="label">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('last_name')}
            className="input"
            disabled={isSubmitting}
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            {...register('email')}
            className="input"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="label">Phone</label>
          <input
            {...register('phone')}
            className="input"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="label">Emergency Contact</label>
          <input
            {...register('emergency_contact')}
            className="input"
            disabled={isSubmitting}
          />
          {errors.emergency_contact && (
            <p className="mt-1 text-sm text-red-600">{errors.emergency_contact.message}</p>
          )}
        </div>

        <div>
          <label className="label">Emergency Phone</label>
          <input
            {...register('emergency_phone')}
            className="input"
            disabled={isSubmitting}
          />
          {errors.emergency_phone && (
            <p className="mt-1 text-sm text-red-600">{errors.emergency_phone.message}</p>
          )}
        </div>

        <div>
          <label className="label">Date of Birth</label>
          <input
            type="date"
            {...register('date_of_birth')}
            className="input"
            disabled={isSubmitting}
          />
          {errors.date_of_birth && (
            <p className="mt-1 text-sm text-red-600">{errors.date_of_birth.message}</p>
          )}
        </div>

        <div>
          <label className="label">Status</label>
          <select
            {...register('status')}
            className="input"
            disabled={isSubmitting}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="label">Address</label>
          <textarea
            {...register('address')}
            rows={3}
            className="input"
            disabled={isSubmitting}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>

        <div className="col-span-2">
          <label className="label">Insurance Information</label>
          <textarea
            {...register('insurance')}
            rows={2}
            className="input"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn"
        >
          {isSubmitting ? 'Adding...' : 'Add Client'}
        </button>
      </div>
    </form>
  );
};