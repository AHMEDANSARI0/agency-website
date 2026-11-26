import type { BrandAssetConfig } from "@/types/brand";
import type { AuditLogEntry, DatabaseBackupSummary, UserRecord } from "@/types/auth";
import type {
  BlogPost,
  CaseStudyItem,
  FaqItem,
  LeadRecord,
  MediaAsset,
  PageDocument,
  PageSectionBlock,
  RedirectRule,
  ServiceCategoryPillar,
  ServiceItem,
  SiteSettings,
  TeamMember,
  TestimonialItem,
} from "@/types/content";
import type { CardMotionConfig } from "@/features/card-motion/config";
import type { ThemeConfiguration } from "@/types/theme";
import { createDefaultThemeConfiguration } from "@/features/themes/presets";
import { DEFAULT_PRICING_CONFIG } from "@/features/pricing/default-pricing";
import { isProductionEnvironment } from "@/lib/env";
import { hashPassword, validatePasswordStrength } from "@/lib/security/password";

export const CURRENT_SEED_VERSION = 14;

export const DEFAULT_HOME_SECTIONS: PageSectionBlock[] = [
  { id: "sec-hero", type: "hero", title: "Automate the work. Accelerate the business.", isVisible: true, order: 1, config: {} },
  { id: "sec-flagship", type: "flagship_systems", title: "Three Flagship Automation Services", isVisible: true, order: 2, config: {} },
  { id: "sec-demos-preview", type: "interactive_demos_preview", title: "Interactive Lead Scorer Preview", isVisible: true, order: 3, config: {} },
  { id: "sec-cases", type: "case_studies_highlight", title: "Workflow Blueprints & Founder Accountability", isVisible: true, order: 4, config: {} },
  { id: "sec-how", type: "how_it_works", title: "Four-Phase Delivery Process", isVisible: true, order: 5, config: {} },
  { id: "sec-cta", type: "cta_banner", title: "Start with one bottleneck. Leave with a clear, written automation plan.", isVisible: true, order: 6, config: {} },
];

export interface StoredDatabaseBackup extends DatabaseBackupSummary {
  snapshot: Omit<OmniFlowDatabaseSnapshot, "databaseBackups">;
}

export interface SiteErrorIncident {
  id: string;
  severity: "critical" | "warning";
  source: "client_runtime" | "error_boundary" | "api" | "database";
  route: string;
  message: string;
  digest?: string;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolved: boolean;
}

export interface OmniFlowDatabaseSnapshot {
  schemaVersion: number;
  users: UserRecord[];
  auditLogs: AuditLogEntry[];
  siteSettings: SiteSettings;
  themeConfig: ThemeConfiguration;
  cardMotion?: CardMotionConfig;
  brandAssets: BrandAssetConfig;
  servicePillars: ServiceCategoryPillar[];
  services: ServiceItem[];
  caseStudies: CaseStudyItem[];
  blogPosts: BlogPost[];
  faqs: FaqItem[];
  testimonials: TestimonialItem[];
  teamMembers: TeamMember[];
  pages: PageDocument[];
  leads: LeadRecord[];
  mediaAssets: MediaAsset[];
  redirects: RedirectRule[];
  leadIdempotencyKeys?: Record<
    string,
    { leadId: string; createdAt: string; expiresAt: string }
  >;
  databaseBackups?: StoredDatabaseBackup[];
  siteErrorIncidents?: SiteErrorIncident[];
}

export function buildBootstrapSuperAdmin(nowIso = new Date().toISOString()): UserRecord | null {
  const strictProd = isProductionEnvironment();
  const rawEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase() || "";
  const rawPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() || "";
  const bootstrapName = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Ahmed Ansari";

  if (strictProd) {
    // Production NEVER permits missing, placeholder, or known default passwords.
    if (!rawEmail || rawEmail === "admin@omniflow.example" || !rawPassword) {
      return null;
    }
    const strength = validatePasswordStrength(rawPassword, {
      rejectKnownDefaults: true,
    });
    if (!strength.valid) {
      return null;
    }
    return {
      id: "usr_founder_admin",
      email: rawEmail,
      name: bootstrapName,
      role: "SUPER_ADMIN",
      passwordHash: hashPassword(rawPassword),
      isActive: true,
      mustChangePassword: process.env.ADMIN_FORCE_FIRST_PASSWORD_CHANGE !== "false",
      sessionVersion: 1,
      passwordChangedAt: null,
      recoveryTokenHash: null,
      recoveryExpiresAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: null,
    };
  }

  // Local development & automated tests ONLY
  const devEmail = rawEmail || "admin@omniflow.example";
  const devPassword =
    rawPassword.length >= 10 &&
    validatePasswordStrength(rawPassword).valid
      ? rawPassword
      : "ChangeMe_StrongPass_2026!";

  return {
    id: "usr_founder_admin",
    email: devEmail,
    name: bootstrapName,
    role: "SUPER_ADMIN",
    passwordHash: hashPassword(devPassword),
    isActive: true,
    mustChangePassword: process.env.ADMIN_FORCE_FIRST_PASSWORD_CHANGE === "true",
    sessionVersion: 1,
    passwordChangedAt: null,
    recoveryTokenHash: null,
    recoveryExpiresAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    lastLoginAt: null,
  };
}

export function createInitialSeedSnapshot(): OmniFlowDatabaseSnapshot {
  const now = "2026-11-22T12:00:00.000Z";
  const bootstrapAdmin = buildBootstrapSuperAdmin(now);

  const brandAssets: BrandAssetConfig = {
    brandName: "OmniFlow",
    tagline: "Automate the work. Accelerate the business.",
    altText: "OmniFlow — AI Automation & Business Solutions",
    lightLogoUrl: null,
    darkLogoUrl: null,
    symbolUrl: null,
    faviconUrl: null,
    ogImageUrl: null,
    showTextFallback: true,
    updatedAt: now,
  };

  const siteSettings: SiteSettings = {
    companyName: "OmniFlow",
    positioning: "AI Automation & Business Operations Partner",
    tagline: "Automate the work. Accelerate the business.",
    founderName: "Ahmed Ansari",
    targetMarkets: ["United States", "United Kingdom", "Canada"],
    targetCustomers: ["Service Businesses", "Consultants & Advisory Firms", "Boutique & Small Agencies"],
    contactEmail: "{{CONTACT_EMAIL}}",
    supportHours: "Monday – Friday, aligned with EST / GMT overlapping business hours",
    bookingUrl: "/contact?intent=call",
    primaryCtaLabel: "Book a free workflow review",
    primaryCtaHref: "/contact?intent=call",
    secondaryCtaLabel: "See live demo",
    secondaryCtaHref: "/demos",
    navigation: [
      { id: "nav-services", label: "Services", href: "/services", isVisible: true, order: 1 },
      { id: "nav-solutions", label: "Solutions", href: "/solutions", isVisible: true, order: 2 },
      { id: "nav-cases", label: "Case Studies", href: "/case-studies", isVisible: true, order: 3 },
      { id: "nav-pricing", label: "Pricing", href: "/pricing", isVisible: true, order: 4 },
      { id: "nav-how", label: "How It Works", href: "/how-it-works", isVisible: true, order: 5 },
      { id: "nav-about", label: "About", href: "/about", isVisible: true, order: 6 },
      { id: "nav-demos", label: "Live Demos", href: "/demos", isVisible: false, order: 7 },
      { id: "nav-blog", label: "Insights", href: "/blog", isVisible: false, order: 8 },
    ],
    footerLinks: {
      services: [
        { id: "ft-s1", label: "Lead Management Systems", href: "/services/lead-management", isVisible: true, order: 1 },
        { id: "ft-s2", label: "AI Customer Support", href: "/services/ai-customer-support", isVisible: true, order: 2 },
        { id: "ft-s3", label: "Workflow Automation", href: "/services/workflow-automation", isVisible: true, order: 3 },
        { id: "ft-s4", label: "All 5 Practice Pillars", href: "/services#pillars", isVisible: true, order: 4 },
      ],
      company: [
        { id: "ft-c1", label: "About OmniFlow", href: "/about", isVisible: true, order: 1 },
        { id: "ft-c2", label: "Founder & Team", href: "/team", isVisible: true, order: 2 },
        { id: "ft-c3", label: "How It Works", href: "/how-it-works", isVisible: true, order: 3 },
        { id: "ft-c4", label: "FAQ", href: "/faq", isVisible: true, order: 4 },
      ],
      legal: [
        { id: "ft-l1", label: "Privacy Policy", href: "/privacy-policy", isVisible: true, order: 1 },
        { id: "ft-l2", label: "Terms of Service", href: "/terms-of-service", isVisible: true, order: 2 },
        { id: "ft-l3", label: "Cookie Policy", href: "/cookie-policy", isVisible: true, order: 3 },
      ],
    },
    pricingConfig: structuredClone(DEFAULT_PRICING_CONFIG),
    analytics: {
      ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "",
      requireCookieConsent: true,
      enabled: false,
    },
    rolePolicies: {
      editorCanPublish: true,
      editorCanManageTheme: false,
    },
    updatedAt: now,
  };

  const servicePillars: ServiceCategoryPillar[] = [
    {
      id: "pillar-1",
      slug: "ai-sales-intelligence",
      number: 1,
      name: "AI Sales Intelligence",
      shortSummary: "Structured lead capture, qualification routing, and CRM enrichment so high-intent enquiries never stall.",
      capabilities: ["Inbound Lead Qualification", "CRM Sync & Routing", "Speed-to-Lead Follow-Up"],
    },
    {
      id: "pillar-2",
      slug: "ai-customer-experience",
      number: 2,
      name: "AI Customer Experience",
      shortSummary: "Grounded AI support assistants, triage workflows, and human-handoff guardrails aligned with your policies.",
      capabilities: ["Knowledge-Grounded Support", "Ticket Triage & Escalation", "Appointment & Intake Flows"],
    },
    {
      id: "pillar-3",
      slug: "ai-operations",
      number: 3,
      name: "AI Operations",
      shortSummary: "Cross-tool workflow automation connecting forms, email, project boards, invoicing, and internal notifications.",
      capabilities: ["Client Onboarding Pipelines", "Document & SOP Handoffs", "Cross-App Data Sync"],
    },
    {
      id: "pillar-4",
      slug: "ai-analytics",
      number: 4,
      name: "AI Analytics",
      shortSummary: "Clean operational visibility across pipeline response times, support queues, and workflow bottlenecks.",
      capabilities: ["Pipeline Velocity Reporting", "Support Resolution Tracking", "Executive Weekly Digests"],
    },
    {
      id: "pillar-5",
      slug: "custom-ai-systems",
      number: 5,
      name: "Custom AI Systems",
      shortSummary: "Bespoke internal tools, SOP retrieval systems, and tailored API orchestrations built around your stack.",
      capabilities: ["Internal Knowledge Copilots", "Custom Webhook Orchestration", "Human-in-the-Loop Approvals"],
    },
  ];

  const services: ServiceItem[] = [
    {
      id: "srv-lead-mgmt",
      slug: "lead-management",
      title: "Lead Management & Qualification Systems",
      categorySlug: "ai-sales-intelligence",
      categoryName: "AI Sales Intelligence",
      isFlagshipPriority: true,
      badgeLabel: "Core Priority · Sales Intelligence",
      shortSummary:
        "Capture, score, enrich, and route inbound enquiries automatically so consultants and service teams respond while intent is highest.",
      problemStatement:
        "Service businesses and small agencies frequently lose qualified prospects because enquiries sit in shared inboxes, lack structured qualification context, or require manual copy-pasting into CRM spreadsheets.",
      solutionOverview:
        "OmniFlow designs deterministic + AI-assisted intake pipelines that validate enquiry data, categorize urgency and service fit, log structured CRM records, alert the right owner immediately, and trigger tailored acknowledgement sequences.",
      processSteps: [
        { title: "1. Intake & Funnel Audit", description: "Map every enquiry touchpoint (web forms, booking links, email) and define qualification criteria." },
        { title: "2. Scoring & CRM Schema", description: "Configure structured statuses, duplicate detection, and routing logic tailored to your sales stages." },
        { title: "3. Instant Alerting & Handoff", description: "Connect notifications and follow-up tasks with full context and zero manual re-entry." },
        { title: "4. Validation & Team Handover", description: "Test edge cases, spam protection, and fallback behaviour before going live." },
      ],
      benefits: [
        "Consistent response speed across US, UK, and Canadian time zones",
        "Structured CRM pipeline visibility from first enquiry to proposal",
        "Elimination of manual spreadsheet copying and missed follow-ups",
        "Built-in duplicate flagging and spam protection",
      ],
      useCases: [
        {
          industry: "Management & Tax Consultants",
          scenario: "Prospects submit complex scoping requests outside office hours.",
          outcome: "Enquiries are categorized by practice area and queued with pre-call briefs.",
        },
        {
          industry: "Digital & Creative Agencies",
          scenario: "High volume of mixed-budget leads obscures high-fit retainer enquiries.",
          outcome: "Structured scoring separates qualified retainers from low-fit requests cleanly.",
        },
      ],
      faqs: [
        {
          question: "Does this replace our existing CRM or work alongside it?",
          answer: "Either approach works. We integrate with your existing CRM via webhooks/APIs or configure a clean lightweight pipeline tailored to your team.",
        },
        {
          question: "Will automated responses feel robotic to high-ticket clients?",
          answer: "No. Messages are written in your exact brand voice with clear expectations, and sensitive replies stay human-approved.",
        },
      ],
      ctaLabel: "Scope Your Lead Pipeline",
      ctaHref: "/contact?service=lead-management",
      status: "published",
      order: 1,
      seo: {
        seoTitle: "Lead Management & AI Qualification Systems",
        seoDescription:
          "Automated lead capture, qualification, and CRM routing for service businesses, consultants, and agencies in the USA, UK, and Canada.",
      },
      updatedAt: now,
    },
    {
      id: "srv-ai-support",
      slug: "ai-customer-support",
      title: "AI Customer Support & Triage Workflows",
      categorySlug: "ai-customer-experience",
      categoryName: "AI Customer Experience",
      isFlagshipPriority: true,
      badgeLabel: "Core Priority · Customer Experience",
      shortSummary:
        "Deliver fast, policy-grounded answers to routine client questions while routing nuanced issues directly to your team with full context.",
      problemStatement:
        "Small teams spend hours answering repetitive onboarding, scheduling, billing, and status questions—pulling specialists away from billable client delivery.",
      solutionOverview:
        "We build controlled support workflows grounded strictly in your approved documentation and FAQs, paired with confidence thresholds and seamless human escalation so clients never receive fabricated promises.",
      processSteps: [
        { title: "1. Support Ticket & FAQ Analysis", description: "Identify recurring question categories and strict escalation boundaries." },
        { title: "2. Approved Knowledge Grounding", description: "Structure verified policies, SOPs, and response templates with clear guardrails." },
        { title: "3. Triage & Human Escalation", description: "Route complex or sensitive requests to staff with a concise conversation summary." },
        { title: "4. Quality Monitoring", description: "Review flagged interactions and refine knowledge articles continuously." },
      ],
      benefits: [
        "Immediate answers for routine scheduling, status, and policy enquiries",
        "Strict guardrails preventing unsupported claims or unauthorized commitments",
        "Clear human handoff summaries that save staff reading time",
      ],
      useCases: [
        {
          industry: "Home & Commercial Service Providers",
          scenario: "Customers ask about service areas, preparation checklists, and rescheduling.",
          outcome: "Instant guided answers and structured rescheduling requests routed to dispatch.",
        },
        {
          industry: "B2B Advisory & Accounting Practices",
          scenario: "Clients repeatedly request document upload instructions during peak deadlines.",
          outcome: "Guided checklist responses reduce inbox backlog without compromising compliance.",
        },
      ],
      faqs: [
        {
          question: "How do you prevent the assistant from making inaccurate claims?",
          answer: "Responses are restricted to approved knowledge sources, with deterministic fallback to human team members whenever a question falls outside verified scope.",
        },
      ],
      ctaLabel: "Design Your Support Workflow",
      ctaHref: "/contact?service=ai-customer-support",
      status: "published",
      order: 2,
      seo: {
        seoTitle: "AI Customer Support & Triage Automation",
        seoDescription:
          "Policy-grounded AI customer support and intelligent ticket triage with human handoff guardrails for growing service businesses.",
      },
      updatedAt: now,
    },
    {
      id: "srv-workflow-auto",
      slug: "workflow-automation",
      title: "End-to-End Business Workflow Automation",
      categorySlug: "ai-operations",
      categoryName: "AI Operations",
      isFlagshipPriority: true,
      badgeLabel: "Core Priority · Operations",
      shortSummary:
        "Eliminate repetitive admin handoffs across client onboarding, project setup, reporting, and internal approvals.",
      problemStatement:
        "Disconnected SaaS tools force founders and account managers to act as human glue—manually creating folders, sending welcome checklists, updating trackers, and chasing status updates.",
      solutionOverview:
        "OmniFlow architects reliable event-driven workflows with error handling, audit logging, and human approval checkpoints across your existing business software.",
      processSteps: [
        { title: "1. Bottleneck Mapping", description: "Document current manual SOPs, triggers, exceptions, and failure points." },
        { title: "2. Workflow Architecture", description: "Design modular automations with idempotency, retries, and alert notifications." },
        { title: "3. Staged Testing", description: "Verify workflows with sample payloads before connecting live operations." },
        { title: "4. Documentation & Runbooks", description: "Deliver clear ownership documentation so your team stays in full control." },
      ],
      benefits: [
        "Standardized client onboarding executed cleanly every time",
        "Fewer dropped handoffs between sales and delivery teams",
        "Transparent logs and fallback notifications if an external app changes",
      ],
      useCases: [
        {
          industry: "Small Marketing & Recruiting Agencies",
          scenario: "Signed proposals require 12 manual setup steps across Slack, Drive, PM tools, and billing.",
          outcome: "Single trigger provisions workspace assets and assigns kickoff tasks automatically.",
        },
      ],
      faqs: [
        {
          question: "Do we keep ownership of the workflows you build?",
          answer: "Yes. Workflows are documented clearly and deployed so your business retains full administrative control.",
        },
      ],
      ctaLabel: "Automate Your Operations",
      ctaHref: "/contact?service=workflow-automation",
      status: "published",
      order: 3,
      seo: {
        seoTitle: "Business Workflow Automation for Agencies & Consultants",
        seoDescription:
          "Reliable workflow automation connecting CRM, onboarding, operations, and reporting for US, UK, and Canadian businesses.",
      },
      updatedAt: now,
    },
    {
      id: "srv-ai-analytics",
      slug: "ai-analytics",
      title: "Operational & Pipeline AI Analytics",
      categorySlug: "ai-analytics",
      categoryName: "AI Analytics",
      isFlagshipPriority: false,
      badgeLabel: "Category · AI Analytics",
      shortSummary:
        "Turn scattered CRM, inbox, and delivery data into clear weekly operational digests and bottleneck visibility.",
      problemStatement:
        "Founders often rely on gut feel or manual Friday spreadsheets to understand lead response speed, conversion drop-offs, and delivery capacity.",
      solutionOverview:
        "We consolidate operational events into clean KPI views and automated executive summaries grounded strictly in actual recorded data.",
      processSteps: [
        { title: "1. Metric Definition", description: "Select actionable KPIs tied directly to revenue and delivery health." },
        { title: "2. Data Hygiene & Sync", description: "Normalize statuses across your CRM and project trackers." },
        { title: "3. Automated Reporting", description: "Deliver scheduled summaries and threshold alerts to leadership." },
      ],
      benefits: [
        "Clear visibility into lead response times and stage conversion",
        "Zero manual weekly spreadsheet compilation",
      ],
      useCases: [
        {
          industry: "Multi-Consultant Advisory Firms",
          scenario: "Leadership lacks visibility into enquiry-to-discovery-call conversion.",
          outcome: "Automated weekly digest highlights stalled enquiries and channel quality.",
        },
      ],
      faqs: [
        {
          question: "Do you fabricate predictive scores without historical data?",
          answer: "Never. Reporting is built strictly on verifiable records from your connected systems.",
        },
      ],
      ctaLabel: "Discuss Analytics Setup",
      ctaHref: "/contact?service=ai-analytics",
      status: "published",
      order: 4,
      seo: {
        seoTitle: "Operational & Pipeline AI Analytics",
        seoDescription: "Clean operational reporting and automated executive digests for service businesses.",
      },
      updatedAt: now,
    },
    {
      id: "srv-custom-ai",
      slug: "custom-ai-systems",
      title: "Custom AI Systems & Internal Copilots",
      categorySlug: "custom-ai-systems",
      categoryName: "Custom AI Systems",
      isFlagshipPriority: false,
      badgeLabel: "Category · Custom AI Systems",
      shortSummary:
        "Tailored internal SOP assistants, proposal drafting aids, and custom API integrations designed around proprietary workflows.",
      problemStatement:
        "Off-the-shelf templates fail when your business relies on specialized scoping rules, compliance checks, or custom data formats.",
      solutionOverview:
        "OmniFlow engineers focused internal tools with role-based access, auditability, and modular architecture.",
      processSteps: [
        { title: "1. Technical Discovery", description: "Evaluate feasibility, security requirements, and ROI before writing code." },
        { title: "2. Prototype & Guardrails", description: "Validate accuracy on representative internal workflows." },
        { title: "3. Production Hardening", description: "Deploy with access controls, logging, and clear maintenance guides." },
      ],
      benefits: [
        "Built specifically around your firm's SOPs and data structures",
        "No lock-in to bloated all-in-one SaaS subscriptions",
      ],
      useCases: [
        {
          industry: "Boutique Specialist Agencies",
          scenario: "Account leads spend hours searching past scopes and playbooks.",
          outcome: "Internal SOP lookup tool surfaces approved templates in seconds.",
        },
      ],
      faqs: [
        {
          question: "Are paid AI APIs mandatory for every custom tool?",
          answer: "No. Many workflows run purely on deterministic rules, webhooks, and SQL; LLM APIs are added only where they provide clear, cost-controlled value.",
        },
      ],
      ctaLabel: "Scope a Custom System",
      ctaHref: "/contact?service=custom-ai-systems",
      status: "published",
      order: 5,
      seo: {
        seoTitle: "Custom AI Systems & Internal Workflow Tools",
        seoDescription: "Bespoke internal AI tools, SOP assistants, and custom API orchestrations by OmniFlow.",
      },
      updatedAt: now,
    },
    {
      id: "srv-cat-sales",
      slug: "ai-sales-intelligence",
      title: "AI Sales Intelligence & Pipeline Systems",
      categorySlug: "ai-sales-intelligence",
      categoryName: "AI Sales Intelligence",
      isFlagshipPriority: false,
      badgeLabel: "Category · AI Sales Intelligence",
      shortSummary:
        "Structured inbound qualification, pre-call prospect briefs, and automated follow-up tracking across your sales pipeline.",
      problemStatement:
        "Unstructured enquiries and inconsistent follow-up rhythms cause qualified prospects in competitive US, UK, and Canadian markets to choose faster-responding competitors.",
      solutionOverview:
        "OmniFlow structures every inbound touchpoint into clean qualification rules, CRM stage transitions, and context-rich sales alerts.",
      processSteps: [
        { title: "1. Channel & Form Review", description: "Audit inbound forms, referral touchpoints, and response bottlenecks." },
        { title: "2. Qualification Rules", description: "Configure deterministic scoring by service line, timeline, and fit." },
        { title: "3. Pipeline Sync", description: "Route qualified enquiries directly to your CRM with instant owner notifications." },
      ],
      benefits: [
        "Faster response to high-fit inbound enquiries",
        "Consistent pre-call context for discovery conversations",
        "Zero manual inbox-to-CRM copy-pasting",
      ],
      useCases: [
        {
          industry: "Advisory & Consulting Practices",
          scenario: "Partners need structured context before accepting discovery calls.",
          outcome: "Automated intake brief summarizes scope, timeline, and fit automatically.",
        },
      ],
      faqs: [
        {
          question: "How does AI Sales Intelligence relate to Lead Management?",
          answer: "Lead Management is our flagship implementation within the broader AI Sales Intelligence practice pillar.",
        },
      ],
      ctaLabel: "Discuss Sales Intelligence",
      ctaHref: "/contact?service=ai-sales-intelligence",
      status: "published",
      order: 6,
      seo: {
        seoTitle: "AI Sales Intelligence Systems",
        seoDescription: "Inbound qualification, CRM enrichment, and speed-to-lead systems for service businesses.",
      },
      updatedAt: now,
    },
    {
      id: "srv-cat-cx",
      slug: "ai-customer-experience",
      title: "AI Customer Experience & Guided Intake",
      categorySlug: "ai-customer-experience",
      categoryName: "AI Customer Experience",
      isFlagshipPriority: false,
      badgeLabel: "Category · AI Customer Experience",
      shortSummary:
        "Responsive, policy-grounded client support, guided onboarding intake, and clean human escalation workflows.",
      problemStatement:
        "Clients expect timely answers across time zones, yet generic ungrounded chatbots damage trust when they guess policies or pricing.",
      solutionOverview:
        "We design bounded customer experience workflows where routine questions receive verified answers and nuanced requests escalate cleanly to your team.",
      processSteps: [
        { title: "1. Journey Mapping", description: "Pinpoint high-friction client questions from first enquiry through onboarding." },
        { title: "2. Knowledge Guardrails", description: "Connect only approved FAQs, checklists, and policy documents." },
        { title: "3. Human Handoff", description: "Deliver structured summaries to support or account leads when judgement is required." },
      ],
      benefits: [
        "Consistent client communication without unsupported promises",
        "Reduced inbox interruption for delivery specialists",
      ],
      useCases: [
        {
          industry: "Professional Service Firms",
          scenario: "New clients need clear document checklists and status updates.",
          outcome: "Guided intake collects required information cleanly on the first pass.",
        },
      ],
      faqs: [
        {
          question: "Can clients always reach a human person?",
          answer: "Yes. Every customer-facing workflow includes direct human escalation paths.",
        },
      ],
      ctaLabel: "Improve Client Experience",
      ctaHref: "/contact?service=ai-customer-experience",
      status: "published",
      order: 7,
      seo: {
        seoTitle: "AI Customer Experience & Support Workflows",
        seoDescription: "Policy-grounded customer support and guided client onboarding systems.",
      },
      updatedAt: now,
    },
    {
      id: "srv-cat-ops",
      slug: "ai-operations",
      title: "AI Operations & Back-Office Orchestration",
      categorySlug: "ai-operations",
      categoryName: "AI Operations",
      isFlagshipPriority: false,
      badgeLabel: "Category · AI Operations",
      shortSummary:
        "Reliable operational plumbing connecting forms, SOP checklists, project boards, notifications, and internal approvals.",
      problemStatement:
        "Growing service teams lose billable hours every week to manual task creation, status chasing, and repetitive document handoffs.",
      solutionOverview:
        "We standardize back-office operations with auditable, event-driven automations and clear error alerts.",
      processSteps: [
        { title: "1. SOP Audit", description: "Identify recurring admin tasks and manual handoff failures." },
        { title: "2. Event Orchestration", description: "Automate workspace provisioning, task creation, and approval routing." },
        { title: "3. Runbook Handover", description: "Provide complete documentation so your team owns every workflow." },
      ],
      benefits: [
        "Predictable project kickoffs and internal handoffs",
        "Less administrative overhead as client volume grows",
      ],
      useCases: [
        {
          industry: "Small Agencies & Studios",
          scenario: "Project setup and weekly status collection consume account manager Fridays.",
          outcome: "Automated triggers provision tasks and compile status updates reliably.",
        },
      ],
      faqs: [
        {
          question: "What happens if a connected tool's API fails?",
          answer: "Workflows include fallback logging and alert notifications so nothing fails silently.",
        },
      ],
      ctaLabel: "Streamline Operations",
      ctaHref: "/contact?service=ai-operations",
      status: "published",
      order: 8,
      seo: {
        seoTitle: "AI Operations & Back-Office Automation",
        seoDescription: "Cross-system operational orchestration and client onboarding automation.",
      },
      updatedAt: now,
    },
  ];

  // Strictly labeled Concept Demonstrations / Internal Reference Workflows (zero invented client claims!)
  const caseStudies: CaseStudyItem[] = [
    {
      id: "cs-lead-routing-blueprint",
      slug: "b2b-consultancy-lead-triage-blueprint",
      title: "Inbound Lead Qualification & Instant Routing Blueprint",
      workType: "concept_demo",
      clientName: null,
      clientPermissionGranted: false,
      industry: "B2B Advisory & Consulting",
      businessType: "10–25 Person Consultancy",
      problemSummary:
        "Reference architecture addressing delayed inbound enquiry responses, unstructured discovery notes, and manual CRM entry across US/UK time zones.",
      manualProcessBefore: [
        "Website contact submissions arrived as plain-text emails in a shared inbox",
        "Partners manually read, copied details into a spreadsheet, and replied hours later",
        "Duplicate submissions from returning prospects created fragmented notes",
      ],
      proposedAutomation:
        "Structured intake validation, deterministic fit scoring, duplicate email detection, automatic CRM status creation, and immediate owner notification with pre-call context.",
      automatedWorkflowAfter: [
        "Enquiry validated and scored immediately on industry, timeline, and problem clarity",
        "CRM record created under 'New' status with automatic duplicate check",
        "Instant structured brief dispatched to the assigned practice lead",
      ],
      technologiesUsed: ["Next.js Server Actions", "PostgreSQL / Supabase", "Webhook Routing", "Deterministic Scoring Rules"],
      verifiedResults: [
        "Concept Reference Architecture — demonstrates end-to-end deterministic capture and CRM triage without paid API lock-in (not a client ROI claim).",
      ],
      projectDuration: "Reference Implementation",
      relatedServiceSlugs: ["lead-management", "workflow-automation"],
      testimonialId: null,
      status: "published",
      seo: {
        seoTitle: "B2B Consultancy Lead Triage Reference Blueprint",
        seoDescription:
          "Concept demonstration showing how OmniFlow structures automated lead qualification, duplicate checks, and CRM routing.",
      },
      updatedAt: now,
    },
    {
      id: "cs-support-triage-architecture",
      slug: "agency-client-onboarding-and-support-triage",
      title: "Client Onboarding & Policy-Grounded Support Triage",
      workType: "internal_experiment",
      clientName: null,
      clientPermissionGranted: false,
      industry: "Boutique Digital & Operations Agencies",
      businessType: "Small Service Agency",
      problemSummary:
        "Internal workflow prototype designed to eliminate repetitive onboarding status questions and standardize project kickoff checklists.",
      manualProcessBefore: [
        "Account managers manually created onboarding checklists after contract signing",
        "Routine policy and timeline questions interrupted deep delivery blocks",
      ],
      proposedAutomation:
        "Event-driven onboarding provisioning paired with a policy-grounded support triage flow that answers approved FAQs and escalates edge cases to account leads.",
      automatedWorkflowAfter: [
        "Standardized onboarding checklist and welcome packet triggered from status change",
        "Routine FAQ queries answered from approved SOP library; custom requests flagged for human reply",
      ],
      technologiesUsed: ["TypeScript", "Structured Knowledge Guardrails", "Event Webhooks", "Role-Based Escalation"],
      verifiedResults: [
        "Internal Reference Experiment — validates guardrail escalation rules and zero-hallucination fallback patterns.",
      ],
      projectDuration: "Internal Prototype",
      relatedServiceSlugs: ["ai-customer-support", "workflow-automation"],
      testimonialId: null,
      status: "published",
      seo: {
        seoTitle: "Client Onboarding & Support Triage Prototype",
        seoDescription:
          "Internal workflow architecture demonstrating policy-grounded support triage and automated agency onboarding.",
      },
      updatedAt: now,
    },
    {
      id: "cs-service-intake-blueprint",
      slug: "multi-region-service-intake-and-followup-workflow",
      title: "Multi-Region Service Enquiry & Follow-Up Cadence Blueprint",
      workType: "concept_demo",
      clientName: null,
      clientPermissionGranted: false,
      industry: "Commercial & Specialist Service Businesses",
      businessType: "Regional Service Operator",
      problemSummary:
        "Concept blueprint solving missed after-hours web enquiries, incomplete job details, and forgotten follow-up reminders.",
      manualProcessBefore: [
        "Enquiries submitted in the evening waited until the next afternoon for a callback",
        "Missing scope details required multiple back-and-forth emails before quoting",
      ],
      proposedAutomation:
        "Structured scoping form with required field validation, automatic service-line routing, and scheduled follow-up reminders inside the CRM.",
      automatedWorkflowAfter: [
        "Complete scope details captured upfront with clear expectations",
        "CRM follow-up date and owner assigned automatically upon submission",
      ],
      technologiesUsed: ["Next.js", "Zod Validation", "Relational CRM Pipeline", "Optional Email Alerts"],
      verifiedResults: [
        "Concept Demonstration — illustrates structured intake and follow-up tracking for service operators (no fabricated client metrics).",
      ],
      projectDuration: "Reference Blueprint",
      relatedServiceSlugs: ["lead-management", "ai-customer-support"],
      testimonialId: null,
      status: "published",
      seo: {
        seoTitle: "Service Business Intake & Follow-Up Blueprint",
        seoDescription: "Concept architecture for structured service enquiry capture and automated follow-up tracking.",
      },
      updatedAt: now,
    },
  ];

  const blogPosts: BlogPost[] = [
    {
      id: "post-deterministic-vs-ai",
      slug: "when-to-use-deterministic-rules-vs-ai-in-business-workflows",
      title: "When to Use Deterministic Rules vs. AI in Business Workflows",
      excerpt:
        "Why reliable automation starts with structured rules and clear guardrails—and exactly where AI adds genuine operational leverage.",
      contentMarkdown: `## Start With Reliability First\n\nMany small agencies and service businesses assume automation requires complex AI models at every step. In practice, the highest-trust business systems combine **deterministic workflow logic** for routing, validation, and permissions with **targeted AI assistance** only where unstructured language needs classification or summarization.\n\n## Where Deterministic Logic Wins\n\n- Validating contact forms, budgets, and required onboarding fields\n- Enforcing CRM status transitions and role permissions\n- Triggering notifications, invoices, and audit logs predictably\n\n## Where Grounded AI Helps\n\n- Summarizing lengthy prospect problem descriptions before a discovery call\n- Matching incoming customer questions against an approved FAQ library\n- Drafting human-reviewed response suggestions\n\n## Practical Takeaway\n\nBefore paying for recurring AI API usage, map your workflow triggers, exceptions, and handoffs cleanly. A well-structured pipeline costs less to run, is easier to debug, and earns lasting trust from clients.`,
      category: "Workflow Architecture",
      tags: ["Workflow Automation", "Lead Management", "Best Practices"],
      authorId: bootstrapAdmin?.id || "usr_founder_admin",
      authorName: "Ahmed Ansari",
      featuredImageUrl: null,
      featuredImageAlt: "Diagram comparing deterministic workflow rules and AI-assisted steps",
      readingTimeMinutes: 4,
      showTableOfContents: true,
      status: "published",
      publishedAt: now,
      scheduledFor: null,
      revisions: [],
      seo: {
        seoTitle: "Deterministic Rules vs. AI in Business Workflows",
        seoDescription:
          "Learn how service businesses combine deterministic automation with grounded AI to keep operations reliable and cost-effective.",
      },
      updatedAt: now,
    },
    {
      id: "post-grounded-ai-support",
      slug: "designing-ai-customer-support-without-hallucinations",
      title: "Designing AI Customer Support Workflows Without Hallucinations",
      excerpt:
        "A practical framework for service firms to answer routine client questions quickly while keeping pricing, legal, and edge-case replies strictly human-controlled.",
      contentMarkdown: `## Why Generic Chatbots Lose Client Trust\n\nFor consultants, agencies, and high-trust service providers, a single invented policy or inaccurate quote damages credibility. Open-ended chatbots fail when they try to answer every question instead of respecting boundaries.\n\n## The Three-Layer Guardrail Pattern\n\n- **Approved Knowledge Only:** Restrict automated answers to verified FAQs, onboarding guides, and scheduling rules.\n- **Explicit Escalation Triggers:** Route billing disputes, custom scope negotiations, and sensitive requests directly to a human owner.\n- **Structured Handoff Briefs:** Give your team a clean summary so the client never has to repeat their problem twice.\n\n## Measuring What Actually Matters\n\nInstead of chasing full automation percentages, measure whether routine questions are answered accurately and whether your specialists have uninterrupted blocks for client delivery.`,
      category: "Customer Experience",
      tags: ["AI Customer Support", "Guardrails", "Service Businesses"],
      authorId: bootstrapAdmin?.id || "usr_founder_admin",
      authorName: "Ahmed Ansari",
      featuredImageUrl: null,
      featuredImageAlt: "Three-layer guardrail pattern for policy-grounded customer support",
      readingTimeMinutes: 4,
      showTableOfContents: true,
      status: "published",
      publishedAt: "2026-11-20T10:00:00.000Z",
      scheduledFor: null,
      revisions: [],
      seo: {
        seoTitle: "Designing AI Customer Support Without Hallucinations",
        seoDescription:
          "How service businesses deploy policy-grounded AI support triage with reliable human escalation.",
      },
      updatedAt: now,
    },
    {
      id: "post-speed-to-lead-pipeline",
      slug: "structuring-inbound-lead-management-for-small-agencies",
      title: "Structuring Inbound Lead Management for Consultants & Small Agencies",
      excerpt:
        "How replacing shared-inbox guesswork with structured qualification and CRM follow-up tracking prevents missed opportunities across time zones.",
      contentMarkdown: `## The Shared Inbox Bottleneck\n\nWhen website enquiries arrive as unstructured emails, busy founders often delay replies until the end of the week. By then, high-intent prospects in New York, London, or Toronto have already booked calls elsewhere.\n\n## Core Elements of a Clean Lead Pipeline\n\n- **Structured Intake Fields:** Capture company context, primary business bottleneck, and timeline upfront.\n- **Duplicate Awareness:** Flag returning contacts automatically so past conversation history stays unified.\n- **Clear Pipeline Stages:** Track every enquiry cleanly from New and Contacted through Qualified and Proposal Sent.\n\n## Start Lean and Expand\n\nYou do not need an expensive enterprise CRM to run a disciplined pipeline. Start with clean validation, reliable database logging, and clear follow-up ownership.`,
      category: "Lead Management",
      tags: ["Lead Management", "CRM", "Consultants"],
      authorId: bootstrapAdmin?.id || "usr_founder_admin",
      authorName: "Ahmed Ansari",
      featuredImageUrl: null,
      featuredImageAlt: "Structured inbound lead pipeline stages for agencies and consultants",
      readingTimeMinutes: 3,
      showTableOfContents: true,
      status: "published",
      publishedAt: "2026-11-18T09:00:00.000Z",
      scheduledFor: null,
      revisions: [],
      seo: {
        seoTitle: "Structuring Inbound Lead Management for Small Agencies",
        seoDescription:
          "Practical steps to automate lead capture, qualification, and CRM follow-ups without enterprise bloat.",
      },
      updatedAt: now,
    },
  ];

  const faqs: FaqItem[] = [
    {
      id: "faq-1",
      category: "General",
      order: 1,
      isPublished: true,
      question: "Which types of businesses does OmniFlow work with?",
      answer:
        "OmniFlow specializes in service businesses, independent consultants, advisory practices, and small agencies operating across the USA, UK, and Canada.",
    },
    {
      id: "faq-2",
      category: "Technology & Cost",
      order: 2,
      isPublished: true,
      question: "Will I be locked into expensive monthly AI subscriptions?",
      answer:
        "No. We prioritize lean, cost-controlled architectures and deterministic workflows first. Where external APIs are optional or beneficial, we document exact free-tier quotas and costs upfront before implementation.",
    },
    {
      id: "faq-3",
      category: "Process",
      order: 3,
      isPublished: true,
      question: "How does an engagement with OmniFlow start?",
      answer:
        "Every project begins with a focused workflow and bottleneck review. We identify where manual handoffs or slow lead follow-ups cost your team time, define clear scope and guardrails, and build in testable milestones.",
    },
    {
      id: "faq-4",
      category: "Security & Control",
      order: 4,
      isPublished: true,
      question: "How do you prevent AI support workflows from giving wrong answers to our clients?",
      answer:
        "We never deploy ungrounded open-ended bots on client channels. Support workflows are restricted to your approved policies and FAQs, with immediate human escalation whenever a query requires judgement.",
    },
    {
      id: "faq-5",
      category: "General",
      order: 5,
      isPublished: true,
      question: "How do we collaborate across US, UK, and Canadian time zones?",
      answer:
        "OmniFlow aligns discovery calls, milestone reviews, and asynchronous progress updates with overlapping EST and GMT business hours so communication stays fast and predictable.",
    },
    {
      id: "faq-6",
      category: "Security & Control",
      order: 6,
      isPublished: true,
      question: "Who owns the code, prompts, and workflow configurations once delivered?",
      answer:
        "Your business retains full ownership and administrative access to all delivered workflows, documentation, and configurations.",
    },
  ];

  // Strictly NO fabricated testimonials — empty until authorized real client testimonials are added via Admin CMS
  const testimonials: TestimonialItem[] = [];

  const teamMembers: TeamMember[] = [
    {
      id: "team-ahmed-ansari",
      name: "Ahmed Ansari",
      role: "Founder & Principal Automation Architect",
      isFounder: true,
      bio: "Ahmed Ansari founded OmniFlow to help service businesses, consultants, and small agencies replace fragile manual admin work with dependable, transparent automation systems.",
      focusAreas: [
        "Lead Qualification & CRM Architecture",
        "Policy-Grounded AI Customer Support",
        "Cross-System Operational Workflows",
      ],
      regionsServed: ["United States", "United Kingdom", "Canada"],
      avatarUrl: null,
      linkedinUrl: null,
      order: 1,
      isPublished: true,
    },
  ];

  const homeSections: PageSectionBlock[] = structuredClone(DEFAULT_HOME_SECTIONS);

  const pages: PageDocument[] = [
    {
      id: "page-home",
      slug: "home",
      title: "OmniFlow — AI Automation & Business Solutions",
      status: "published",
      scheduledFor: null,
      sections: homeSections,
      draftSections: structuredClone(homeSections),
      seo: {
        seoTitle: "OmniFlow — AI Automation & Business Solutions for US, UK & Canada",
        seoDescription:
          "OmniFlow builds practical lead management, AI customer support, and workflow automation systems for service businesses, consultants, and small agencies.",
      },
      updatedAt: now,
    },
  ];

  return {
    schemaVersion: CURRENT_SEED_VERSION,
    users: bootstrapAdmin ? [bootstrapAdmin] : [],
    auditLogs: [
      {
        id: "aud_initial_seed",
        actorId: "system",
        actorEmail: "system@omniflow.local",
        actorRole: "SUPER_ADMIN",
        action: "SYSTEM_BOOTSTRAP",
        entityType: "database",
        summary: "Initialized OmniFlow baseline schema, theme tokens, and seed records.",
        createdAt: now,
      },
    ],
    siteSettings,
    themeConfig: createDefaultThemeConfiguration(),
    brandAssets,
    servicePillars,
    services,
    caseStudies,
    blogPosts,
    faqs,
    testimonials,
    teamMembers,
    pages,
    leads: [],
    mediaAssets: [],
    redirects: [],
    databaseBackups: [],
  };
}
