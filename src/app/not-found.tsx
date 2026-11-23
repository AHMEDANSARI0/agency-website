import Link from "next/link";
import { headers } from "next/headers";
import { permanentRedirect, redirect } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { db } from "@/lib/database";

export default async function NotFoundPage() {
  let requestedPath: string | null = null;
  try {
    const reqHeaders = await headers();
    requestedPath = reqHeaders.get("x-omniflow-pathname");
  } catch {
    requestedPath = null;
  }

  if (requestedPath) {
    const rule = await db.findActiveRedirect(requestedPath);
    if (rule) {
      if (rule.permanent) {
        permanentRedirect(rule.destinationPath);
      }
      redirect(rule.destinationPath);
    }
  }

  return (
    <main
      id="main-content"
      className="bg-tech-grid-subtle flex min-h-[75vh] items-center bg-canvas py-20"
    >
      <Container className="max-w-xl text-center">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-accent-subtle text-primary">
          <Compass className="h-6 w-6" />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Error 404 · Route Not Found
        </p>
        <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-ink-heading sm:text-4xl">
          This page has moved or does not exist
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-body sm:text-base">
          Explore our automation services, test the five interactive workflow simulators, or request a direct operational review.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <span>Back to Homepage</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/demos"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-5 py-2.5 text-sm font-semibold text-ink-heading transition-colors hover:bg-surface-muted"
          >
            Interactive Demos
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-5 py-2.5 text-sm font-semibold text-ink-heading transition-colors hover:bg-surface-muted"
          >
            Contact OmniFlow
          </Link>
        </div>
      </Container>
    </main>
  );
}
