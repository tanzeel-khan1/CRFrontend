import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function FeedbackSubmission() {
  const { token } = useParams();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['feedback-form', token],
    queryFn: () => api.feedback.getSubmissionForm(token),
    retry: false,
  });

  const submission = useMutation({
    mutationFn: () => api.feedback.submit(token, { rating, text }),
    onSuccess: () => setSubmitted(true),
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Ranvola · Client feedback</p>
        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading your feedback form…</p>
        ) : error ? (
          <>
            <h1 className="mt-5 font-display text-3xl font-semibold">This feedback link is unavailable</h1>
            <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
          </>
        ) : submitted ? (
          <>
            <h1 className="mt-5 font-display text-3xl font-semibold">Thank you, {data.client_name}!</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your feedback has been received. The platform team is reviewing it before it appears on the public page.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-display text-3xl font-semibold">How was your experience?</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your feedback helps {data.client_name} improve their service. No account is needed.</p>
            <form
              className="mt-8 space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                submission.mutate();
              }}
            >
              <fieldset>
                <legend className="text-sm font-medium">Your rating</legend>
                <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} star${value === 1 ? '' : 's'}`}
                      onClick={() => setRating(value)}
                      className="rounded-md p-1 text-amber-500 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Star className={`h-8 w-8 ${value <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-2">
                <label htmlFor="feedback-text" className="text-sm font-medium">Tell us more (optional)</label>
                <Textarea
                  id="feedback-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={2000}
                  placeholder="Share a few words about your experience"
                  className="min-h-32 bg-background"
                />
                <p className="text-right text-xs text-muted-foreground">{text.length}/2000</p>
              </div>
              {submission.error && (
                <p role="alert" className="text-sm text-destructive">{submission.error.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={!rating || submission.isPending}>
                {submission.isPending ? 'Sending feedback…' : 'Submit feedback'}
              </Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
