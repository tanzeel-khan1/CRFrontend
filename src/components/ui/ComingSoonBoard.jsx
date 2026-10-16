import React from 'react';
import { Construction, Pin } from 'lucide-react';

const NOTES = [
  { title: 'Vault', body: 'Secure folders, version history, and client-ready packs.', rotate: '-rotate-2', delay: '0ms' },
  { title: 'Review', body: 'Contracts, KYC, and listings will live on one board.', rotate: 'rotate-1', delay: '80ms' },
  { title: 'Share', body: 'Controlled links instead of messy uploads.', rotate: '-rotate-1', delay: '140ms' },
];

export default function ComingSoonBoard({
  kicker = 'Workspace',
  title = 'Documents',
  subtitle = 'A refined document board is being built. Uploads are paused until it is ready.',
}) {
  return (
    <div className="space-y-6 pb-8">
      <section className="page-hero">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-background/55">{kicker}</p>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-background/70">{subtitle}</p>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[22px] border-background/10" />
        <div className="pointer-events-none absolute -bottom-24 right-20 h-48 w-48 rounded-full border border-background/15" />
      </section>

      <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-border bg-card shadow-[0_24px_80px_-48px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:32px_32px] opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--foreground)/0.04),transparent_55%)]" />

        <div className="relative z-10 flex flex-col items-center px-5 py-14 sm:px-10 sm:py-16">
          <div className="mb-8 flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            <Construction className="h-3.5 w-3.5" />
            Work in progress
          </div>

          <div className="grid w-full max-w-4xl gap-5 sm:grid-cols-3">
            {NOTES.map((note) => (
              <article
                key={note.title}
                style={{ animationDelay: note.delay }}
                className={`relative rounded-2xl border border-border bg-background p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.5)] ${note.rotate}`}
              >
                <Pin className="absolute -top-2.5 left-1/2 h-4 w-4 -translate-x-1/2 text-foreground" />
                <p className="eyebrow mt-2">{note.title}</p>
                <p className="mt-3 font-display text-2xl leading-tight">{note.title === 'Vault' ? 'Coming soon' : note.title}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{note.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 max-w-md text-center">
            <p className="font-display text-3xl">This board is under construction.</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              File upload, write, and share tools are disabled while we rebuild documents into a cleaner workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
