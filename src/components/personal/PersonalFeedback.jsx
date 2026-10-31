import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, MessageSquare, Star, XCircle } from 'lucide-react';
import { api } from '@/api/apiClient';

const STATUS_META = {
  pending: { label: 'Awaiting review', icon: Clock3, className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  rejected: { label: 'Not approved', icon: XCircle, className: 'border-border bg-muted text-muted-foreground' },
};

export default function PersonalFeedback() {
  const { data: feedback = [], isLoading, isError, error } = useQuery({
    queryKey: ['personal-feedback'],
    queryFn: api.feedback.getMine,
  });

  const approvedCount = feedback.filter((item) => item.status === 'approved').length;
  const pendingCount = feedback.filter((item) => item.status === 'pending').length;
  const averageRating = feedback.length
    ? (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(1)
    : '—';

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className="rounded-2xl bg-foreground px-6 py-7 text-background sm:px-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-background/60">
          <MessageSquare className="h-4 w-4" />
          Client feedback
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your clients’ feedback</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-background/70">
          View reviews from clients across your companies, including feedback still being reviewed by the Ranvola team.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total feedback', value: feedback.length, icon: MessageSquare },
          { label: 'Awaiting review', value: pendingCount, icon: Clock3 },
          { label: 'Average rating', value: `${averageRating}${feedback.length ? ' / 5' : ''}`, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading client feedback…
          </div>
        ) : isError ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error?.message || 'Unable to load client feedback.'}
          </div>
        ) : feedback.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <h2 className="mt-3 font-semibold">No client feedback yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Feedback submitted by your clients will appear here.
            </p>
          </div>
        ) : (
          feedback.map((item) => {
            const status = STATUS_META[item.status] || STATUS_META.pending;
            const StatusIcon = status.icon;

            return (
              <article key={item._id || item.id} className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">Feedback from {item.client_name}</h2>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.company_id?.name || 'Company'}
                      {item.createdAt && ` · ${new Date(item.createdAt).toLocaleDateString()}`}
                    </p>
                    <div className="mt-3 flex" aria-label={`${item.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${index < item.rating ? 'fill-foreground text-foreground' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                    {item.text && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.text}</p>}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
      {!isLoading && !isError && approvedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {approvedCount} {approvedCount === 1 ? 'review is' : 'reviews are'} approved and visible on your public feedback page.
        </p>
      )}
    </section>
  );
}
