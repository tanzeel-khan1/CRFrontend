import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Quote, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { api } from '@/api/apiClient';

const formatReviewDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

export default function PublicReviews() {
  const { companyId } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-feedback', companyId],
    queryFn: () => api.feedback.getPublicCompanyFeedback(companyId),
    retry: false,
  });
  const reviews = data?.feedback || [];
  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : null;
  const agentName = data?.agent_name || 'Agent';
  const initials = agentName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f7f7] px-4 py-8 text-[#111111] sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -top-56 left-1/2 h-[34rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(0,0,0,0.07),transparent_68%)]" />
      <div className="relative mx-auto max-w-5xl">
        <header className="relative overflow-hidden rounded-[2rem] bg-[#111111] px-6 py-8 text-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)] sm:px-12 sm:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full border border-white/[0.08]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-20 h-72 w-72 rounded-full border border-white/[0.08]" />
          <div className="relative z-10 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                <Sparkles className="h-3.5 w-3.5 text-white/80" />
                Ranvola · Client reviews
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/10 font-display text-2xl text-white">
                  {initials || 'A'}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">Real experiences, shared by clients</p>
                  <h1 className="mt-1 font-display text-4xl leading-none tracking-tight sm:text-5xl">{agentName}</h1>
                </div>
              </div>
              <p className="mt-6 max-w-lg text-sm leading-6 text-white/65 sm:text-base">
                A trusted service is best told by the people who experienced it. Explore feedback from {agentName}&apos;s clients.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 md:min-w-52">
              <div>
                {isLoading ? (
                  <div className="h-9 w-16 animate-pulse rounded bg-white/10" />
                ) : (
                  <p className="font-display text-4xl leading-none">{averageRating || '—'}</p>
                )}
                <div className="mt-2 flex gap-0.5" aria-label={averageRating ? `${averageRating} average rating` : 'No ratings'}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={`h-3.5 w-3.5 ${averageRating && index < Math.round(Number(averageRating)) ? 'fill-white text-white' : 'text-white/20'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="text-sm font-semibold">{isLoading ? ' ' : reviews.length}</p>
                <p className="mt-1 text-[11px] leading-4 text-white/50">approved<br />{reviews.length === 1 ? 'review' : 'reviews'}</p>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-9 flex items-center gap-2 border-t border-white/10 pt-5 text-[11px] text-white/45">
            <ShieldCheck className="h-4 w-4 text-white/75" />
            Every review is checked by the Ranvola team before it is published.
          </div>
        </header>

        <section className="mt-10 sm:mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#666666]">Client stories</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl">Words that matter</h2>
            </div>
            {!isLoading && !error && reviews.length > 0 && (
              <p className="pb-1 text-xs text-[#737a75]">{reviews.length} verified {reviews.length === 1 ? 'experience' : 'experiences'}</p>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-52 animate-pulse rounded-3xl border border-black/[0.05] bg-white/70" />
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="rounded-3xl border border-red-200 bg-white p-8 text-center text-sm text-destructive shadow-sm">
              {error.message}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d0d0d0] bg-white/70 px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeeee] text-[#333333]">
                <Quote className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-2xl">The first story is yet to be told</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#666666]">
                Approved client reviews will appear here. Check back soon to hear about working with {agentName}.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => {
                const date = formatReviewDate(review.createdAt || review.created_date);
                const clientInitial = review.client_name?.trim()?.[0]?.toUpperCase() || 'C';
                return (
                  <article
                    key={review.id || review._id}
                    className="group relative flex min-h-52 flex-col rounded-3xl border border-black/[0.08] bg-white p-6 shadow-[0_8px_30px_-24px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-28px_rgba(0,0,0,0.3)] sm:p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eeeeee] text-sm font-semibold text-[#333333]">
                          {clientInitial}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#202923]">{review.client_name}</h3>
                          {date && <p className="mt-1 text-xs text-[#858b86]">{date}</p>}
                        </div>
                      </div>
                      <div className="flex shrink-0 rounded-full bg-[#f2f2f2] px-2.5 py-1.5" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? 'fill-[#222222] text-[#222222]' : 'text-[#d5d5d5]'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 flex-1">
                      {review.text ? (
                        <p className="whitespace-pre-wrap text-sm leading-7 text-[#555555]">&ldquo;{review.text}&rdquo;</p>
                      ) : (
                        <p className="text-sm italic text-[#858b86]">A {review.rating}-star client experience.</p>
                      )}
                    </div>
                    <div className="mt-5 flex items-center gap-1.5 border-t border-[#eeeeee] pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#555555]">
                      <BadgeCheck className="h-4 w-4" />
                      Verified client feedback
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="py-10 text-center text-[11px] tracking-wide text-[#777777]">
          Thoughtfully reviewed and published with Ranvola
        </footer>
      </div>
    </main>
  );
}
