import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const sessionSchema = z.object({
  client_id: z.string(),
  date: z.string(),
  time: z.string(),
  duration: z.number().min(15).max(180),
  type: z.enum(['initial', 'individual', 'family', 'couple', 'followup', 'emergency', 'telehealth']),
  status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
  notes: z.string().optional(),
  recurrence: z.object({
    frequency: z.enum(['none', 'weekly', 'biweekly', 'monthly']),
    endDate: z.string().optional(),
  }),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface Props {
  clientId: string;
  onSubmit: (data: SessionFormData) => Promise<void>;
  onCancel?: () => void;
  sessionToEdit?: any;
}

export const SessionScheduler: React.FC<Props> = ({
  clientId,
  onSubmit,
  onCancel,
  sessionToEdit,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      client_id: clientId,
      date: sessionToEdit?.date || format(new Date(), 'yyyy-MM-dd'),
      time: sessionToEdit?.time || '09:00',
      duration: sessionToEdit?.duration || 60,
      type: sessionToEdit?.type || 'individual',
      status: sessionToEdit?.status || 'scheduled',
      notes: sessionToEdit?.notes || '',
      recurrence: {
        frequency: 'none',
        endDate: '',
      },
    },
  });

  const status = watch('status');

  const handleCancelSession = () => {
    if (window.confirm('Are you sure you want to cancel this session?')) {
      setValue('status', 'cancelled');
      handleSubmit(onSubmit)();
    }
  };

  const handleCompleteSession = () => {
    setValue('status', 'completed');
    handleSubmit(onSubmit)();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Calendar className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-medium text-gray-900">
            {sessionToEdit ? 'Edit Session' : 'Schedule New Session'}
          </h3>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input type="hidden" {...register('client_id')} value={clientId} />
        <input type="hidden" {...register('status')} />

        <div>
          <label className="label">Date</label>
          <input
            type="date"
            {...register('date')}
            className="input"
            disabled={status === 'cancelled'}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        <div>
          <label className="label">Time</label>
          <input
            type="time"
            {...register('time')}
            className="input"
            disabled={status === 'cancelled'}
          />
          {errors.time && (
            <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
          )}
        </div>

        <div>
          <label className="label">Duration (minutes)</label>
          <input
            type="number"
            min="15"
            max="180"
            step="15"
            {...register('duration', { valueAsNumber: true })}
            className="input"
            disabled={status === 'cancelled'}
          />
          {errors.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
          )}
        </div>

        <div>
          <label className="label">Session Type</label>
          <select 
            {...register('type')} 
            className="input"
            disabled={status === 'cancelled'}
          >
            <option value="initial">Initial Session</option>
            <option value="individual">Individual Session</option>
            <option value="family">Family Session</option>
            <option value="couple">Couple Session</option>
            <option value="followup">Follow-up</option>
            <option value="emergency">Emergency</option>
            <option value="telehealth">Telehealth</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {!sessionToEdit && status !== 'cancelled' && (
          <>
            <div>
              <label className="label">Recurrence</label>
              <select {...register('recurrence.frequency')} className="input">
                <option value="none">No Recurrence</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {watch('recurrence.frequency') !== 'none' && (
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  {...register('recurrence.endDate')}
                  className="input"
                />
              </div>
            )}
          </>
        )}

        <div className="col-span-2">
          <label className="label">Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="input"
            placeholder="Add any notes about the session..."
            disabled={status === 'cancelled'}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        {sessionToEdit && status !== 'cancelled' && (
          <>
            <button
              type="button"
              onClick={handleCancelSession}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <AlertTriangle className="h-4 w-4 inline-block mr-2" />
              Cancel Session
            </button>
            <button
              type="button"
              onClick={handleCompleteSession}
              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-transparent rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Clock className="h-4 w-4 inline-block mr-2" />
              Mark as Completed
            </button>
          </>
        )}

        {status !== 'cancelled' && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn"
          >
            {isSubmitting ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Clock className="h-5 w-5 mr-2" />
            )}
            {sessionToEdit ? 'Update Session' : 'Schedule Session'}
          </button>
        )}
      </div>

      {status === 'cancelled' && (
        <div className="mt-4 p-4 bg-red-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                This session has been cancelled
              </h3>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};