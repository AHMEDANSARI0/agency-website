import type { Metadata } from "next";
import { ArrowRight, Globe2 } from "lucide-react";
import { db } from "@/lib/database";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Founder & Team — Ahmed Ansari & OmniFlow",
  description:
    "Meet Ahmed Ansari, Founder of OmniFlow, and learn how we partner directly with service businesses, consultants, and agencies.",
};

export default async function TeamPage() {
  const [team, settings] = await Promise.all([
    db.listTeamMembers(true),
    db.getSiteSettings(),
  ]);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "About", href: "/about" },
          { label: "Founder & Team" },
        ]}
        badge="Leadership & Engineering"
        title={`Led Directly by ${settings.founderName}`}
        description="Clients work directly with senior engineering leadership—never passed off to junior account layers after discovery."
        actions={<Button href="/contact">Schedule Discovery Conversation</Button>}
      />

      <section className="py-16 sm:py-20">
        <Container className="space-y-8">
          {team.map((member) => (
            <article
              key={member.id}
              className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-8 shadow-card sm:p-10"
            >
              <div className="flex flex-wrap items-center gap-2">
                {member.isFounder && <Badge>Founder</Badge>}
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                  <Globe2 className="h-3.5 w-3.5 text-primary" />
                  Serving {member.regionsServed.join(", ")}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-ink-heading sm:text-3xl">
                {member.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>

              <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-body">{member.bio}</p>

              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Core Architectural Focus
                </h3>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {member.focusAreas.map((area) => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              {member.linkedinUrl && (
                <div className="mt-6">
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-link hover:text-link-hover"
                  >
                    Connect on LinkedIn →
                  </a>
                </div>
              )}
            </article>
          ))}

          <div className="rounded-card border border-line bg-surface-muted p-8 text-center">
            <h2 className="text-xl font-bold text-ink-heading">
              Work Directly With {settings.companyName}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-body">
              Every system is scoped, architected, and verified with direct founder involvement.
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/contact">
                Start a Conversation
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
