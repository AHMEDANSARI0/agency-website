import Link from "next/link";
import { headers } from "next/headers";
import { permanentRedirect, redirect } from "next/navigation";
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
    <main id="main-content" className="flex min-h-[75vh] items-center py-20">
      <Container className="max-w-xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight text-ink-heading sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-base font-light text-ink-body">
          The page you requested may have moved or does not exist. Return to the
          OmniFlow overview to explore our automation capabilities.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Back to Home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-line-strong px-6 py-2.5 text-sm font-medium text-ink-heading transition-colors hover:bg-surface-muted"
          >
            Contact OmniFlow
          </Link>
        </div>
      </Container>
    </main>
  );
}
