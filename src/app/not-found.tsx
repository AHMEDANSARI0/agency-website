import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Compass } from "lucide-react";
import { Container } from "@/components/ui/Container";

export default function NotFoundPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-[78vh] items-center bg-canvas py-20 text-ink-body"
    >
      <Container className="max-w-xl">
        <div className="rounded-[20px] border border-line bg-surface-card p-8 text-center sm:p-12">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-muted text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
            Page not found · 404
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-heading sm:text-3xl">
            We couldn’t find that page.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
            The link may be outdated or the address may have moved. Use one of
            the links below to get back on track.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/services"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-heading transition-colors hover:bg-surface-muted"
            >
              <span>Browse Services</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-heading transition-colors hover:bg-surface-muted"
            >
              <span>Contact Us</span>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
