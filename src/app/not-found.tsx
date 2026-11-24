import { headers } from "next/headers";
import { permanentRedirect, redirect } from "next/navigation";
import { Compass } from "lucide-react";
import { Container } from "@/components/ui/Container";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleEyebrow,
} from "@/components/ui/soale";
import { db } from "@/lib/database";

const BUILTIN_ROUTE_ALIASES: Record<string, string> = {
  "/about-us": "/about",
  "/contact-us": "/contact",
  "/our-work": "/work",
  "/insights": "/blog",
  "/pricing-plans": "/pricing",
};

export default async function NotFoundPage() {
  let requestedPath: string | null = null;
  try {
    const reqHeaders = await headers();
    requestedPath = reqHeaders.get("x-omniflow-pathname");
  } catch {
    requestedPath = null;
  }

  if (requestedPath) {
    const normalized = requestedPath.replace(/\/+$/, "") || "/";
    const aliasDest = BUILTIN_ROUTE_ALIASES[normalized.toLowerCase()];
    if (aliasDest) {
      permanentRedirect(aliasDest);
    }

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
      className="soale-ambient-wash flex min-h-[78vh] items-center bg-canvas py-20"
    >
      <Container className="max-w-2xl">
        <SoaleCard elevated className="p-8 text-center sm:p-12">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-[18px] bg-accent-subtle text-primary">
            <Compass className="h-6 w-6" />
          </div>
          <SoaleEyebrow className="mb-4">Error 404 · Route Not Found</SoaleEyebrow>
          <h1 className="soale-h2 text-ink-heading">
            This page has moved or does not exist.
          </h1>
          <p className="soale-lead mx-auto mt-4">
            Explore our 8 automation services, test the five interactive
            workflow simulators, or book a direct operational review.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <SoaleArrowButton href="/" variant="primary">
              Back to Homepage
            </SoaleArrowButton>
            <SoaleArrowButton href="/services" variant="surface">
              All 8 Services
            </SoaleArrowButton>
            <SoaleArrowButton href="/contact?intent=call" variant="outline">
              Contact OmniFlow
            </SoaleArrowButton>
          </div>
        </SoaleCard>
      </Container>
    </main>
  );
}
