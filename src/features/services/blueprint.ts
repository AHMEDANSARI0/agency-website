import type { ServiceItem } from "@/types/content";

export interface ServiceIntegrationGroup {
  category: string;
  tools: string[];
}

export interface ServiceImplementationMilestone {
  stage: string;
  timeframe: string;
  title: string;
  deliverable: string;
}

export interface ServiceInteractiveDemoLink {
  tabId:
    | "lead-qualification"
    | "support-generator"
    | "workflow-builder"
    | "savings-calculator"
    | "readiness-assessment";
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export interface ServiceConversionBlueprint {
  outcomeHeadline: string;
  whatGetsAutomated: string[];
  staysHumanControlled: string[];
  integrations: ServiceIntegrationGroup[];
  implementationProcess: ServiceImplementationMilestone[];
  demo: ServiceInteractiveDemoLink;
}

const DEFAULT_IMPLEMENTATION_PROCESS: ServiceImplementationMilestone[] = [
  {
    stage: "Phase 01",
    timeframe: "Days 1–3",
    title: "Workflow & Bottleneck Discovery",
    deliverable: "Current-state process map, scope boundaries & cost estimate",
  },
  {
    stage: "Phase 02",
    timeframe: "Days 4–7",
    title: "Rules, Schemas & Guardrails",
    deliverable: "Validation rules, duplicate checks & human escalation matrix",
  },
  {
    stage: "Phase 03",
    timeframe: "Week 2–3",
    title: "Staged Build & Edge-Case QA",
    deliverable: "Sandbox-tested integration across your existing business tools",
  },
  {
    stage: "Phase 04",
    timeframe: "Launch & Handover",
    title: "Team Walkthrough & 100% Ownership",
    deliverable: "Admin credentials, plain-English runbooks & optional post-launch support",
  },
];

const BLUEPRINTS_BY_SLUG: Record<string, Omit<ServiceConversionBlueprint, "implementationProcess">> = {
  "lead-management": {
    outcomeHeadline: "Respond to every enquiry in seconds, prioritize high-fit buyers, and eliminate manual CRM data entry.",
    whatGetsAutomated: [
      "24/7 structured capture across website forms, landing pages, and booking requests",
      "Instant qualification scoring by service line, urgency, region, and scope clarity",
      "Automatic CRM contact & deal creation with duplicate email detection",
      "Immediate WhatsApp, Slack, or email owner brief + tailored prospect confirmation",
      "Scheduled follow-up task creation so high-intent leads never go cold",
    ],
    staysHumanControlled: [
      "Discovery call conversations and relationship building",
      "Custom pricing quotes, commercial negotiation, and contract sign-off",
      "Handling nuanced partnership or enterprise custom requests",
    ],
    integrations: [
      { category: "CRM & Pipeline", tools: ["HubSpot", "Pipedrive", "Salesforce", "OmniFlow CRM"] },
      { category: "Instant Alerts", tools: ["Slack", "WhatsApp Business API", "Microsoft Teams", "Transactional Email"] },
      { category: "Scheduling & Forms", tools: ["Cal.com", "Calendly", "Webhooks", "Custom Next.js Forms"] },
      { category: "Data & Enrichment", tools: ["PostgreSQL / Supabase", "Airtable", "Google Sheets"] },
    ],
    demo: {
      tabId: "lead-qualification",
      badge: "Live Interactive Demo · 01",
      title: "Test the Lead Qualification & Routing Scorer",
      description:
        "Adjust enquiry volume, urgency, and budget inputs to see how OmniFlow calculates fit scores, SLA targets, and pre-call owner briefs in real time.",
      ctaLabel: "Try Lead Qualification Demo",
    },
  },
  "ai-customer-support": {
    outcomeHeadline: "Deliver instant, accurate answers to routine client questions 24/7 while escalating sensitive cases to your team.",
    whatGetsAutomated: [
      "Immediate answers to approved FAQs, turnaround times, onboarding steps, and policies",
      "Automatic intent classification (billing, scheduling, technical support, urgent escalation)",
      "Policy-grounded drafting strictly restricted to your verified SOP documents",
      "Structured conversation summary attached when escalating to a human specialist",
    ],
    staysHumanControlled: [
      "Refund approvals, billing disputes, and contract exceptions",
      "Complex advisory, legal, or bespoke troubleshooting judgements",
      "Any question outside your approved knowledge base (zero AI guessing)",
    ],
    integrations: [
      { category: "Helpdesk & Inbox", tools: ["Intercom", "Zendesk", "Help Scout", "Shared Gmail / Microsoft 365"] },
      { category: "Knowledge Sources", tools: ["Notion SOPs", "Approved FAQ Packs", "Internal Markdown Docs"] },
      { category: "Team Escalation", tools: ["Slack Channels", "CRM Case Logs", "Priority Email Alerts"] },
      { category: "Scheduling", tools: ["Cal.com", "Calendly", "Service Dispatch Queues"] },
    ],
    demo: {
      tabId: "support-generator",
      badge: "Live Interactive Demo · 02",
      title: "Test Policy-Grounded Support & Escalation Guardrails",
      description:
        "Send routine questions vs. out-of-scope or discount requests to see how approved answers are generated and when mandatory human escalation triggers.",
      ctaLabel: "Try Support Triage Demo",
    },
  },
  "workflow-automation": {
    outcomeHeadline: "Connect your forms, CRM, project boards, and billing so multi-step operations run without manual copy-paste.",
    whatGetsAutomated: [
      "Client onboarding folder, workspace, and welcome checklist provisioning on deal-won",
      "Cross-system synchronization across CRM, project management, accounting, and Slack",
      "Automated status updates, document collection reminders, and milestone handoffs",
      "Fail-safe database queuing and owner alerts if a third-party API temporarily goes offline",
    ],
    staysHumanControlled: [
      "Milestone quality review and client deliverable sign-off",
      "Exception approvals when a client requests non-standard scope changes",
      "Strategic account management and kickoff calls",
    ],
    integrations: [
      { category: "Project & Docs", tools: ["Notion", "Linear", "Asana", "ClickUp", "Google Drive"] },
      { category: "Billing & Contracts", tools: ["Stripe", "QuickBooks", "Xero", "DocuSign / PandaDoc"] },
      { category: "CRM & Messaging", tools: ["HubSpot", "Pipedrive", "Slack", "Email Notifications"] },
      { category: "Orchestration", tools: ["TypeScript Webhooks", "n8n", "PostgreSQL / Supabase", "REST APIs"] },
    ],
    demo: {
      tabId: "workflow-builder",
      badge: "Live Interactive Demo · 03",
      title: "Simulate End-to-End Execution & Outage Resilience",
      description:
        "Trigger a multi-step onboarding or lead workflow—and toggle an external email outage—to verify zero lost records and automatic retry queuing.",
      ctaLabel: "Run Workflow Simulator",
    },
  },
  "ai-sales-intelligence": {
    outcomeHeadline: "Give sales and partners clean pipeline context, faster speed-to-lead, and structured follow-up discipline.",
    whatGetsAutomated: [
      "Inbound channel & campaign source attribution across every enquiry touchpoint",
      "Automated pre-call briefing notes summarizing company profile, bottleneck, and timeline",
      "Pipeline stage hygiene, duplicate contact flagging, and overdue follow-up reminders",
      "Routing high-priority opportunities to the right partner or territory owner",
    ],
    staysHumanControlled: [
      "Consultative discovery calls and solution scoping",
      "Proposal pricing strategy and executive relationship closing",
    ],
    integrations: [
      { category: "Sales CRM", tools: ["HubSpot", "Pipedrive", "Salesforce", "Close", "OmniFlow CRM"] },
      { category: "Booking & Calendar", tools: ["Cal.com", "Calendly", "Google Calendar", "Outlook"] },
      { category: "Alerts & Briefs", tools: ["Slack", "WhatsApp", "Email Dossiers"] },
      { category: "Analytics", tools: ["UTM Attribution", "SQL Reporting", "CSV Exports"] },
    ],
    demo: {
      tabId: "lead-qualification",
      badge: "Live Interactive Demo · 01",
      title: "Explore Sales Qualification & Pre-Call Brief Generation",
      description:
        "See how raw inbound form submissions turn into scored pipeline records and structured partner briefs in under a second.",
      ctaLabel: "Open Sales Qualification Lab",
    },
  },
  "ai-customer-experience": {
    outcomeHeadline: "Guide clients smoothly from first question through onboarding without inbox bottlenecks or robotic replies.",
    whatGetsAutomated: [
      "Guided client intake questionnaires that validate required files and details upfront",
      "24/7 answers to common onboarding, preparation, and scheduling questions across time zones",
      "Proactive milestone and appointment confirmation messages in your brand tone",
      "Seamless context handoff to account managers whenever personal attention is needed",
    ],
    staysHumanControlled: [
      "Bespoke client onboarding consultations and strategy sessions",
      "Sensitive account escalations or scope adjustments",
    ],
    integrations: [
      { category: "Client Channels", tools: ["Website Chat / Intake", "Email", "WhatsApp", "Client Portals"] },
      { category: "Knowledge & SOPs", tools: ["Notion", "Google Workspace", "Approved Policy Docs"] },
      { category: "CRM & Ticketing", tools: ["HubSpot", "Intercom", "Zendesk", "Help Scout"] },
    ],
    demo: {
      tabId: "support-generator",
      badge: "Live Interactive Demo · 02",
      title: "Inspect Guided Support & Human Handoff Flows",
      description:
        "Test how client questions receive verified answers or clean human escalations without ever fabricating promises.",
      ctaLabel: "Test Customer Experience Demo",
    },
  },
  "ai-operations": {
    outcomeHeadline: "Reclaim weekly billable hours by removing manual admin glue across your internal delivery tools.",
    whatGetsAutomated: [
      "Standardized task lists, folder structures, and internal handoffs when projects start",
      "Automated chasing for missing client inputs, approvals, and recurring deliverables",
      "Cross-tool status syncing so operations trackers stay accurate without Friday copy-pasting",
      "Audit logs and exception alerts whenever a workflow step requires attention",
    ],
    staysHumanControlled: [
      "Core client delivery, creative/advisory execution, and quality assurance",
      "Approving operational exceptions or timeline changes",
    ],
    integrations: [
      { category: "Delivery & Ops", tools: ["Notion", "Asana", "ClickUp", "Linear", "Airtable"] },
      { category: "Files & Comms", tools: ["Google Workspace", "Microsoft 365", "Slack", "Teams"] },
      { category: "Finance & Admin", tools: ["Stripe", "QuickBooks", "Xero", "Webhooks"] },
    ],
    demo: {
      tabId: "savings-calculator",
      badge: "Live Interactive Demo · 04",
      title: "Calculate Reclaimed Team Hours (USD / GBP / CAD)",
      description:
        "Model how many repetitive admin hours and workweeks your team can reclaim annually with structured operational automation.",
      ctaLabel: "Calculate Operational Time Savings",
    },
  },
  "ai-analytics": {
    outcomeHeadline: "Replace Friday spreadsheet assembly with accurate, automated visibility into response speed, pipeline conversion, and bottlenecks.",
    whatGetsAutomated: [
      "Scheduled weekly executive digests covering enquiries, response times, and conversion rates",
      "Lead source and service-line demand breakdowns pulled directly from real CRM records",
      "Threshold alerts when unassigned leads or overdue follow-ups exceed your SLA",
      "Clean, exportable operational datasets across CRM and delivery systems",
    ],
    staysHumanControlled: [
      "Quarterly budget allocation, hiring decisions, and strategic planning",
      "Interpreting market shifts and refining service offerings",
    ],
    integrations: [
      { category: "Data Sources", tools: ["PostgreSQL / Supabase", "HubSpot", "Pipedrive", "Stripe"] },
      { category: "Reporting & BI", tools: ["Automated Email Digests", "Slack KPI Summaries", "Google Sheets", "CSV"] },
      { category: "Web & Attribution", tools: ["GA4 Events", "UTM Tracking", "Conversion Funnels"] },
    ],
    demo: {
      tabId: "savings-calculator",
      badge: "Live Interactive Demo · 04",
      title: "Model Operational Capacity & Efficiency Gains",
      description:
        "Benchmark manual reporting and admin hours across USD, GBP, or CAD rates using conservative, transparent formulas.",
      ctaLabel: "Open Efficiency Calculator",
    },
  },
  "custom-ai-systems": {
    outcomeHeadline: "Build focused internal tools, SOP retrieval copilots, and custom API integrations owned 100% by your business.",
    whatGetsAutomated: [
      "Instant internal lookup across approved SOPs, past scopes, and compliance checklists",
      "Structured first-draft generation for routine briefs, summaries, and internal handoffs",
      "Custom webhook bridges between proprietary databases and everyday SaaS tools",
      "Role-restricted admin workflows with complete audit logging",
    ],
    staysHumanControlled: [
      "Final review and approval of client-facing proposals or technical recommendations",
      "Access governance and policy updates via your admin team",
    ],
    integrations: [
      { category: "Databases & Storage", tools: ["PostgreSQL", "Supabase", "REST / GraphQL APIs", "S3 / Cloud Storage"] },
      { category: "Internal Stack", tools: ["Next.js / TypeScript", "Internal Admin Portals", "SSO / RBAC"] },
      { category: "AI & Rules", tools: ["Deterministic Rule Engines", "Bounded LLM APIs (Optional)", "Document Parsers"] },
    ],
    demo: {
      tabId: "readiness-assessment",
      badge: "Live Interactive Demo · 05",
      title: "Run the 2-Minute Custom Automation Readiness Diagnostic",
      description:
        "Evaluate your current SOP clarity, data structure, and workflow volume to generate a practical 3-week pilot roadmap.",
      ctaLabel: "Run Readiness Diagnostic",
    },
  },
};

export function getServiceConversionBlueprint(service: ServiceItem): ServiceConversionBlueprint {
  const bySlug = BLUEPRINTS_BY_SLUG[service.slug];
  if (bySlug) {
    return {
      ...bySlug,
      implementationProcess: DEFAULT_IMPLEMENTATION_PROCESS,
    };
  }

  const byCategory = BLUEPRINTS_BY_SLUG[service.categorySlug];
  if (byCategory) {
    return {
      ...byCategory,
      implementationProcess: DEFAULT_IMPLEMENTATION_PROCESS,
    };
  }

  return {
    outcomeHeadline:
      "Reduce repetitive manual work, respond faster to clients, and connect your everyday business tools reliably.",
    whatGetsAutomated: [
      "Structured data validation, routing, and cross-system record updates",
      "Instant team notifications with clean operational context",
      "Audit logging and fallback alerts so nothing drops silently",
    ],
    staysHumanControlled: [
      "High-value client relationships, custom pricing, and final approvals",
      "Edge-case decisions outside standard operating procedures",
    ],
    integrations: [
      { category: "CRM & Sales", tools: ["HubSpot", "Pipedrive", "Salesforce", "OmniFlow CRM"] },
      { category: "Comms & Ops", tools: ["Slack", "Email", "WhatsApp", "Notion", "Google Workspace"] },
      { category: "Data & APIs", tools: ["PostgreSQL / Supabase", "REST Webhooks", "Calendars"] },
    ],
    implementationProcess: DEFAULT_IMPLEMENTATION_PROCESS,
    demo: {
      tabId: "readiness-assessment",
      badge: "Interactive Diagnostic",
      title: "Test Your Workflow Readiness Live",
      description:
        "Explore OmniFlow's interactive sandbox to benchmark your current bottleneck before scheduling a discovery call.",
      ctaLabel: "Explore Live Demos",
    },
  };
}
