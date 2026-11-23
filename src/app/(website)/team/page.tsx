import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe2, ShieldCheck } from "lucide-react";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Founder & Team",
  description:
    "Meet Ahmed Ansari, Founder of OmniFlow, and learn how our automation engineering engagements are led across the US, UK, and Canada.",
};

export default async function TeamPage() {
  const [members, settings] = await Promise.all([
    db.listTeamMembers(true),
    db.getSiteSettings(),
  ]);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "About", href: "/about" }, { label: "Founder & Team" }]}
        badge="Leadership & Delivery"
        title="Direct Principal Accountability on Every Engagement"
        description="When you work with OmniFlow, your workflow architecture, guardrails, and implementation are led directly by experienced engineering leadership—not passed off to unaccountable subcontractors."
      />

      <section className="bg-surface py-16 sm:py-22">
        <Container className="space-y-8">
          {members.map((member) => (
            <article
              key={member.id}
              className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card sm:p-10"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    aria-hidden="true"
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-glow"
                  >
                    {member.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-bold text-ink-heading">{member.name}</h2>
                      {member.isFounder && <Badge variant="accent">Founder</Badge>}
                    </div>
                    <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface-muted px-3.5 py-1.5 text-xs font-medium text-ink-heading">
                  <Globe2 className="h-4 w-4 text-primary" />
                  <span>Serving: {member.regionsServed.join(" · ")}</span>
                </div>
              </div>

              <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink-body">
                {member.bio}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-6 border-t border-line pt-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Core Engineering Focus Areas
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {member.focusAreas.map((area) => (
                      <li
                        key={area}
                        className="flex items-center gap-2 text-sm font-medium text-ink-heading"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-line bg-surface-muted p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                      Engagement Standard
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-body sm:text-sm">
                    Every client receives written workflow specifications, staged edge-case testing, and direct walkthroughs across EST and GMT business hours.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={settings.primaryCtaHref}>
                  <Button>
                    Work Directly with {member.name.split(" ")[0]}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="secondary">Review Delivery Process</Button>
                </Link>
              </div>
            </article>
          ))}
        </Container>
      </section>

      <PageConversionBanner
        eyebrow="Start a Conversation"
        title="Discuss your workflow directly with Ahmed Ansari"
        description="Share your operational challenge via our structured intake form and receive a direct response within one business day."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </>
  );
}
