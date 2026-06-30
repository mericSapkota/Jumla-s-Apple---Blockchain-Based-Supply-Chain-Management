import TopAppBar from "./TopAppBar";

export default function DashboardShell({ title, eyebrow, heading, children }) {
  return (
    <div className="min-h-screen bg-surface pb-16">
      <TopAppBar title={title} />
      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-2xl mx-auto space-y-8">
        {(eyebrow || heading) && (
          <section className="space-y-1">
            {eyebrow && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-role-accent" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                  {eyebrow}
                </span>
              </div>
            )}
            {heading && (
              <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
                {heading}
              </h2>
            )}
          </section>
        )}
        {children}
      </main>
    </div>
  );
}
