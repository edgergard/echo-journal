/**
 * Static example of an entry, Echo's reply and one "Recalled" margin note
 * (design.md: landing preview; same look as RecalledNote on the entry page).
 */
export function LandingPreview() {
  return (
    <section
      aria-label="Example entry and reply"
      className="grid gap-x-10 gap-y-6 md:grid-cols-[minmax(0,1fr)_14rem]"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <article className="rounded-md border bg-card p-5 text-card-foreground sm:p-7">
          <div className="mb-3 flex flex-wrap items-baseline gap-3">
            <p className="font-medium">Friday, November 20</p>
            <p className="rounded-full bg-muted px-2.5 py-0.5 text-sm">
              <span className="sr-only">Mood: </span>okay
            </p>
          </div>
          <p className="max-w-[68ch] font-serif text-[1.0625rem] leading-[1.7]">
            Finally finished the move. The new flat is quiet in a way I’m not
            used to yet. Unpacked the kitchen first, the way Mum always did.
            Tomorrow: curtains, and maybe calling Dad.
          </p>
        </article>

        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-semibold text-muted-foreground">Echo</p>
          <div className="rounded-md border bg-card p-5 text-card-foreground sm:p-7">
            <p className="max-w-[68ch] font-serif text-[1.0625rem] leading-[1.7]">
              A quiet flat after a loud month is worth noticing. Last Sunday you
              wrote about arguing with your dad over this move — have you two
              talked since? What would make the new place feel like yours this
              week?
            </p>
          </div>
        </div>
      </div>

      <aside
        aria-label="Recalled entries"
        className="flex gap-3 md:self-end md:pb-8"
      >
        <span
          aria-hidden="true"
          className="mt-2.5 h-px w-6 shrink-0 bg-primary"
        />
        <div className="min-w-0">
          <p className="mb-1.5 text-sm text-muted-foreground">
            Recalled from Nov 15
          </p>
          <blockquote className="font-serif text-base leading-normal italic">
            “I said things I didn’t mean.”
          </blockquote>
        </div>
      </aside>
    </section>
  );
}
