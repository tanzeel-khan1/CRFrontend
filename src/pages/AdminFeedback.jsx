import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';

export default function AdminFeedback() {
  const queryClient = useQueryClient();
  const { data: feedback = [], isLoading, error } = useQuery({
    queryKey: ['admin-pending-feedback'],
    queryFn: api.feedback.getPending,
  });
  const moderation = useMutation({
    mutationFn: ({ id, status }) => api.feedback.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-feedback'] });
      toast.success(`Feedback ${variables.status}`);
    },
    onError: (mutationError) => toast.error(mutationError.message || 'Unable to update feedback'),
  });

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Feedback moderation</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review feedback before it is shown on public pages.</p>
      </header>
      {isLoading ? (
        <p className="py-10 text-sm text-muted-foreground">Loading feedback…</p>
      ) : error ? (
        <p role="alert" className="py-10 text-sm text-destructive">{error.message}</p>
      ) : feedback.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nothing is waiting for review.
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-semibold">{item.client_name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.company_id?.name || 'Company'} · {new Date(item.created_date).toLocaleString()}
                  </p>
                  <div className="mt-3 flex" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} className={`h-4 w-4 ${index < item.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                    ))}
                  </div>
                  {item.text && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.text}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    onClick={() => moderation.mutate({ id: item.id, status: 'approved' })}
                    disabled={moderation.isPending}
                    className="gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moderation.mutate({ id: item.id, status: 'rejected' })}
                    disabled={moderation.isPending}
                    className="gap-1.5"
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
