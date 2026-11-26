import type { Metadata } from "next";
import { buildStaticRouteMetadata } from "@/lib/seo/static-route-metadata";
import { CheckCircle2, Globe2, ShieldCheck } from "lucide-react";
import {
  getCachedPublishedTeamMembers,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
} from "@/components/ui/soale";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticRouteMetadata("team");
}

export default async function TeamPage() {
  const [members, settings] = await Promise.all([
    getCachedPublishedTeamMembers(),
    getCachedSiteSettings(),
  ]);

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        pageSlug="team"
        breadcrumbs={[
          { label: "About", href: "/about" },
          { label: "Founder & Team" },
        ]}
        badge="Leadership & Delivery"
        title="Direct Principal Accountability on Every Engagement"
        description="When you work with OmniFlow, your workflow architecture, guardrails, and implementation are led directly by experienced engineering leadership — not passed off to unaccountable subcontractors."
      />

      <section className="py-16 sm:py-24">
        <Container className="space-y-8">
          {members.map((member) => (
            <SoaleCard
              key={member.id}
              as="article"
              elevated={member.isFounder}
              className="p-7 sm:p-10"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  {member.avatarUrl && !member.avatarUrl.includes("{{") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="h-16 w-16 shrink-0 rounded-[20px] border border-line object-cover shadow-sm"
                    />
                  ) : (
                    <div
                      aria-label={`${member.name} avatar`}
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-primary/30 bg-accent-subtle text-xl font-bold text-primary shadow-sm"
                    >
                      {member.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="soale-h3 text-ink-heading">
                        {member.name}
                      </h2>
                      {member.isFounder && (
                        <SoaleChip active>Founder &amp; Principal</SoaleChip>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {member.role}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-muted px-4 py-2 text-xs font-medium text-ink-heading">
                  <Globe2 className="h-4 w-4 text-primary" />
                  <span>Serving: {member.regionsServed.join(" · ")}</span>
                </div>
              </div>

              <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink-body">
                {member.bio}
              </p>

              <div className="mt-8 grid grid-cols-1 gap-6 border-t border-line pt-6 md:grid-cols-2">
                <div>
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Core Engineering Focus Areas
                  </h3>
                  <ul className="mt-3.5 space-y-2.5">
                    {member.focusAreas.map((area) => (
                      <li
                        key={area}
                        className="flex items-center gap-2.5 text-sm font-medium text-ink-heading"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[20px] border border-line bg-surface-muted/75 p-5">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                      Engagement Standard
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-ink-body sm:text-sm">
                    Every client receives written workflow specifications,
                    staged edge-case testing, and direct walkthroughs across EST
                    and GMT business hours.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3.5">
                <SoaleArrowButton href={settings.primaryCtaHref} variant="primary">
                  Work Directly with {member.name.split(" ")[0]}
                </SoaleArrowButton>
                <SoaleArrowButton href="/how-it-works" variant="surface">
                  Review Delivery Process
                </SoaleArrowButton>
              </div>
            </SoaleCard>
          ))}
        </Container>
      </section>

      <PageConversionBanner
        pageSlug="team"
        eyebrow="Start a Conversation"
        title="Discuss your workflow directly with Ahmed Ansari"
        description="Share your operational challenge via our structured intake form and receive a direct response within one business day."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </div>
  );
}
