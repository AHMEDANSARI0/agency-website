import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Layers,
  Plus,
  ShieldCheck,
  UserCheck,
  Workflow,
} from "lucide-react";
import {
  getCachedActiveRedirects,
  getCachedPublishedCaseStudies,
  getCachedPublishedServices,
  getCachedServiceBySlug,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleEyebrow,
} from "@/components/ui/soale";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbJsonLd,
  buildServiceJsonLd,
  getCanonicalSiteUrl,
} from "@/features/seo/json-ld";
import { getServiceConversionBlueprint } from "@/features/services/blueprint";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";
import { isSafeRedirectRule, safeRedirectDestination } from "@/lib/security/redirect-safety";

export const revalidate = 600;

export async function generateStaticParams() {
  const services = await getCachedPublishedServices();
  return services.map((s) => ({ slug: s.slug }));
}

const LEGACY_SERVICE_SLUG_REDIRECTS: Record<string, string> = {
  "ai-lead-generation": "/services/lead-management",
  "ai-lead-generation-qualification": "/services/lead-management",
  "ai-lead-qualification-routing": "/services/lead-management",
  "lead-qualification": "/services/lead-management",
  "customer-support-ai": "/services/ai-customer-support",
  "ai-customer-support-assistants": "/services/ai-customer-support",
  "ai-support": "/services/ai-customer-support",
  "business-process-automation": "/services/workflow-automation",
  "ai-workflow-automation": "/services/workflow-automation",
  "process-automation": "/services/workflow-automation",
  "sales-automation": "/services/ai-sales-intelligence",
  "crm-pipeline-automation": "/services/ai-sales-intelligence",
  "customer-experience": "/services/ai-customer-experience",
  "client-onboarding-automation": "/services/ai-customer-experience",
  "operations-automation": "/services/ai-operations",
  "ai-strategy-workflow-audits": "/services/ai-operations",
  "data-analytics": "/services/ai-analytics",
  "reporting-operations-dashboards": "/services/ai-analytics",
  "custom-ai": "/services/custom-ai-systems",
  "internal-ai-tools-custom-portals": "/services/custom-ai-systems",
};

interface ServiceDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ServiceDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const legacyTarget = LEGACY_SERVICE_SLUG_REDIRECTS[slug.toLowerCase()];
  const resolvedSlug = legacyTarget
    ? legacyTarget.replace(/^\/services\//, "")
    : slug;
  const service = await getCachedServiceBySlug(resolvedSlug);
  if (!service || service.status !== "published") {
    return {
      title: "Service Not Found",
      robots: { index: false, follow: false },
    };
  }
  const baseUrl = getCanonicalSiteUrl();
  const cleanTitle = (service.seo.seoTitle || service.title)
    .replace(/(?:\s*[|—–\-:]\s*OmniFlow(?:\s+Insights)?)+\s*$/i, "")
    .trim();
  return {
    title: cleanTitle || service.title,
    description: service.seo.seoDescription || service.shortSummary,
    alternates: {
      canonical:
        service.seo.canonicalUrl || `${baseUrl}/services/${service.slug}`,
    },
    robots: service.seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailProps) {
  const { slug } = await params;

  const mappedLegacyTarget = LEGACY_SERVICE_SLUG_REDIRECTS[slug.toLowerCase()];
  if (mappedLegacyTarget) {
    permanentRedirect(mappedLegacyTarget);
  }

  const [service, allServices, caseStudies, settings] = await Promise.all([
    getCachedServiceBySlug(slug),
    getCachedPublishedServices(),
    getCachedPublishedCaseStudies(),
    getCachedSiteSettings(),
  ]);

  if (!service || service.status !== "published") {
    const targetPath = `/services/${slug}`.toLowerCase();
    const redirects = await getCachedActiveRedirects();
    const dbRule = redirects.find(
      (r) => r.sourcePath.replace(/\/+$/, "").toLowerCase() === targetPath
    );
    const safeDestination = dbRule && isSafeRedirectRule(dbRule.sourcePath, dbRule.destinationPath)
      ? safeRedirectDestination(dbRule.destinationPath)
      : null;
    if (dbRule && safeDestination) {
      if (dbRule.permanent) permanentRedirect(safeDestination);
      redirect(safeDestination);
    }
    notFound();
  }

  const blueprint = getServiceConversionBlueprint(service);
  const relatedCaseStudies = caseStudies.filter((c) =>
    c.relatedServiceSlugs.includes(service.slug)
  );
  const relatedServices = allServices
    .filter((s) => s.slug !== service.slug)
    .slice(0, 3);

  const discoveryCtaHref = `/contact?service=${encodeURIComponent(
    service.slug
  )}&intent=call&source=service_${encodeURIComponent(service.slug)}`;
  const demoHref = `/demos?tab=${encodeURIComponent(blueprint.demo.tabId)}`;

  const structuredData = [
    buildServiceJsonLd(service, settings),
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
      { name: service.title, path: `/services/${service.slug}` },
    ]),
  ];

  return (
    <div className="bg-canvas text-ink-body">
      <JsonLdScript data={structuredData} />
      <PageHeader
        breadcrumbs={[
          { label: "Services", href: "/services" },
          { label: service.title },
        ]}
        badge={service.badgeLabel}
        title={service.title}
        description={blueprint.outcomeHeadline || service.shortSummary}
        actions={
          <>
            <SoaleArrowButton href={discoveryCtaHref} variant="primary">
              Book a Free Discovery Call
            </SoaleArrowButton>
            <SoaleArrowButton href={demoHref} variant="surface">
              {blueprint.demo.ctaLabel}
            </SoaleArrowButton>
          </>
        }
      />

      <section className="border-b border-line py-16 sm:py-24">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main 10-Part Business & Implementation Breakdown */}
          <div className="space-y-8 lg:col-span-8">
            {/* 1. Business Problem & Proposed Solution */}
            <SoaleCard motionId="app-(website)-services-slug-page.tsx:1" className="p-6 sm:p-9">
              <SoaleEyebrow className="mb-4">
                01 · Business Problem &amp; Proposed Solution
              </SoaleEyebrow>
              <h2 className="soale-h3 text-ink-heading">
                The Business Problem We Eliminate
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-body">
                {service.problemStatement}
              </p>

              <div className="mt-6 rounded-[20px] border border-primary/25 bg-accent-subtle p-5 sm:p-6">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                  Proposed OmniFlow Architecture
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-heading sm:text-base">
                  {service.solutionOverview}
                </p>
              </div>
            </SoaleCard>

            {/* 2. What Gets Automated vs. What Stays With Your Team */}
            <SoaleCard motionId="app-(website)-services-slug-page.tsx:2" className="p-6 sm:p-9">
              <SoaleEyebrow className="mb-4">
                02 · Automation Scope &amp; Human Control
              </SoaleEyebrow>
              <h2 className="soale-h3 text-ink-heading">
                What Gets Automated vs. What Stays With Your Team
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                Repetitive data entry, triage, and status handoffs run
                automatically — while commercial decisions and sensitive client
                judgment always remain in your hands.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-[20px] border border-primary/25 bg-accent-subtle/75 p-5">
                  <div className="flex items-center gap-2 text-primary">
                    <Workflow className="h-4 w-4" />
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider">
                      Automated 24/7 by OmniFlow
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {blueprint.whatGetsAutomated.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-heading sm:text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[20px] border border-line bg-surface-muted p-5">
                  <div className="flex items-center gap-2 text-ink-heading">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-wider">
                      Kept Human-Approved
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {blueprint.staysHumanControlled.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-body sm:text-sm"
                      >
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SoaleCard>

            {/* 3. Step-by-Step System Operation */}
            <SoaleCard motionId="app-(website)-services-slug-page.tsx:3" className="p-6 sm:p-9">
              <SoaleEyebrow className="mb-4">03 · How It Works</SoaleEyebrow>
              <h2 className="soale-h3 text-ink-heading">
                Step-by-Step System Operation
              </h2>
              <ol className="mt-6 space-y-3.5">
                {service.processSteps.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex items-start gap-4 rounded-[18px] border border-line bg-surface-muted/75 p-4 sm:p-5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-semibold text-primary-foreground">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-heading sm:text-base">
                        {step.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-body">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </SoaleCard>

            {/* 4. Relevant Integrations */}
            <SoaleCard motionId="app-(website)-services-slug-page.tsx:4" className="p-6 sm:p-9">
              <SoaleEyebrow className="mb-4">
                04 · Connected Business Systems
              </SoaleEyebrow>
              <h2 className="soale-h3 text-ink-heading">
                Relevant Integrations &amp; Software Ecosystem
              </h2>
              <p className="mt-2 text-sm text-ink-body">
                We connect the platforms your team already relies on — avoiding
                rip-and-replace disruptions or unnecessary SaaS subscriptions.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {blueprint.integrations.map((group) => (
                  <div
                    key={group.category}
                    className="rounded-[18px] border border-line bg-surface-muted/65 p-4"
                  >
                    <p className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                      <Cpu className="h-3.5 w-3.5" />
                      <span>{group.category}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.tools.map((tool) => (
                        <SoaleChip key={tool} className="!bg-surface">
                          {tool}
                        </SoaleChip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SoaleCard>

            {/* 5. Implementation Process */}
            <SoaleCard motionId="app-(website)-services-slug-page.tsx:5" className="p-6 sm:p-9">
              <SoaleEyebrow className="mb-4">
                05 · Implementation Process
              </SoaleEyebrow>
              <h2 className="soale-h3 text-ink-heading">
                How We Scope, Test, and Hand Over Your System
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {blueprint.implementationProcess.map((milestone) => (
                  <div
                    key={milestone.stage}
                    className="flex flex-col justify-between rounded-[18px] border border-line bg-surface-muted/75 p-5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {milestone.stage}
                        </span>
                        <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[0.68rem] text-ink-muted">
                          {milestone.timeframe}
                        </span>
                      </div>
                      <h3 className="mt-2.5 text-sm font-semibold text-ink-heading">
                        {milestone.title}
                      </h3>
                    </div>
                    <p className="mt-3 border-t border-line pt-3 text-xs text-ink-body">
                      <strong className="text-ink-heading">Deliverable:</strong>{" "}
                      {milestone.deliverable}
                    </p>
                  </div>
                ))}
              </div>
            </SoaleCard>

            {/* 6. Expected Outcomes & Sector Use Cases */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <SoaleCard motionId="app-(website)-services-slug-page.tsx:6" className="p-6">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                  06 · Expected Outcomes
                </p>
                <h2 className="mt-2.5 text-lg font-semibold text-ink-heading">
                  Measurable Operational Improvements
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {service.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2.5 text-sm text-ink-body"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </SoaleCard>

              <SoaleCard motionId="app-(website)-services-slug-page.tsx:7" className="p-6">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                  Industry Fit
                </p>
                <h2 className="mt-2.5 text-lg font-semibold text-ink-heading">
                  Real-World Sector Scenarios
                </h2>
                <ul className="mt-4 space-y-3">
                  {service.useCases.map((uc) => (
                    <li
                      key={uc.industry}
                      className="rounded-2xl border border-line bg-surface-muted p-3.5"
                    >
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-heading">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        <span>{uc.industry}</span>
                      </p>
                      <p className="mt-1 text-xs text-ink-body">{uc.scenario}</p>
                      <p className="mt-1 font-mono text-[0.68rem] text-primary">
                        {uc.outcome}
                      </p>
                    </li>
                  ))}
                </ul>
              </SoaleCard>
            </div>

            {/* 7. Live Interactive Demo Card */}
            <SoaleCard motionId="app-(website)-services-slug-page.tsx:8" elevated className="border-primary/30 p-6 sm:p-9">
              <SoaleEyebrow className="mb-4">{blueprint.demo.badge}</SoaleEyebrow>
              <h2 className="soale-h3 text-ink-heading">
                {blueprint.demo.title}
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-body sm:text-base">
                {blueprint.demo.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3.5">
                <SoaleArrowButton href={demoHref} variant="primary">
                  {blueprint.demo.ctaLabel}
                </SoaleArrowButton>
                <SoaleArrowButton href={discoveryCtaHref} variant="surface">
                  Book a Free Discovery Call
                </SoaleArrowButton>
              </div>
            </SoaleCard>

            {/* 8. Service-Specific FAQs */}
            {service.faqs.length > 0 && (
              <SoaleCard motionId="app-(website)-services-slug-page.tsx:9" className="p-6 sm:p-9">
                <SoaleEyebrow className="mb-4">07 · Service FAQ</SoaleEyebrow>
                <h2 className="soale-h3 text-ink-heading">
                  Common Questions About {service.title}
                </h2>
                <div className="mt-6 space-y-3">
                  {service.faqs.map((faq) => (
                    <details
                      key={faq.question}
                      className="more rounded-[18px] border border-line bg-surface-muted/75 px-5 py-4"
                    >
                      <summary className="flex items-center justify-between gap-4 text-left text-sm font-semibold text-ink-heading">
                        <span>{faq.question}</span>
                        <span className="more-icon grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-primary">
                          <Plus className="h-4 w-4" />
                        </span>
                      </summary>
                      <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink-body">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </SoaleCard>
            )}
          </div>

          {/* Right Sticky Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <SoaleCard motionId="app-(website)-services-slug-page.tsx:10" elevated className="p-6 sm:p-7">
                <SoaleChip active>{service.categoryName}</SoaleChip>
                <h2 className="soale-h4 mt-4 text-ink-heading">
                  Book a Free Discovery Call for {service.title}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-body">
                  In 25 minutes we review your current process, show what can be
                  automated reliably, and outline a clear milestone plan.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <SoaleArrowButton
                    href={discoveryCtaHref}
                    variant="primary"
                    className="w-full justify-between"
                  >
                    Book a Free Discovery Call
                  </SoaleArrowButton>
                  <SoaleArrowButton
                    href={demoHref}
                    variant="surface"
                    size="sm"
                    className="w-full justify-between"
                  >
                    {blueprint.demo.ctaLabel}
                  </SoaleArrowButton>
                </div>

                <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-xs text-ink-body">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>100% client ownership of workflows &amp; docs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>Connects to your existing CRM &amp; tools</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>Zero obligation · 1-business-day response</span>
                  </li>
                </ul>

                {relatedCaseStudies.length > 0 && (
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-muted">
                      Reference Blueprints
                    </p>
                    <ul className="mt-2.5 space-y-2">
                      {relatedCaseStudies.map((cs) => (
                        <li key={cs.id}>
                          <Link
                            href={`/case-studies/${cs.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <span>{cs.title}</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </SoaleCard>
            </div>
          </aside>
        </Container>
      </section>

      {/* Related Systems */}
      {relatedServices.length > 0 && (
        <section className="bg-canvas-tertiary/40 py-16 sm:py-20">
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="soale-h3 text-ink-heading">
                Complementary Automation Services
              </h2>
              <SoaleArrowButton href="/services" variant="outline" size="sm">
                All 8 Services
              </SoaleArrowButton>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedServices.map((rel) => (
                <Link key={rel.id} href={`/services/${rel.slug}`} className="group">
                  <SoaleCard motionId={"app-(website)-services-slug-page.tsx:11" + ":" + String(rel.id)} interactive className="h-full p-6">
                    <SoaleChip>{rel.badgeLabel}</SoaleChip>
                    <h3 className="mt-4 text-base font-semibold text-ink-heading group-hover:text-primary">
                      {rel.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-body">
                      {rel.shortSummary}
                    </p>
                  </SoaleCard>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <PageConversionBanner
        eyebrow="Ready to Automate This Workflow?"
        title={`Eliminate manual busywork with ${service.title}`}
        description="Book a free 25-minute discovery call to review your current tools, see what gets automated, and get a clear milestone plan with zero obligation."
        primaryLabel="Book a Free Discovery Call"
        primaryHref={discoveryCtaHref}
        secondaryLabel={blueprint.demo.ctaLabel}
        secondaryHref={demoHref}
      />
    </div>
  );
}
