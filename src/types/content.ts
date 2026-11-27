import type { RolePolicyConfig } from "./auth";

export type PublishStatus = "draft" | "review" | "published" | "scheduled" | "archived";

export type WorkVerificationType =
  | "verified_client"
  | "internal_experiment"
  | "concept_demo"
  | "planned_project";

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Won"
  | "Lost";

export type LeadPriority = "Low" | "Medium" | "High" | "Urgent";

export interface SeoMetadataFields {
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  isVisible: boolean;
  order: number;
}

export interface NavbarStyleSettings {
  topOffset: number;
  sideInset: number;
  maxWidth: number;
  barHeight: number;
  barPaddingX: number;
  barRadius: number;
  borderWidth: number;
  backdropBlur: number;
  barShadowBlur: number;
  barShadowOpacity: number;
  groupGap: number;
  navGap: number;
  brandMarkSize: "sm" | "md" | "lg";
  linkFontSize: number;
  linkFontWeight: "400" | "500" | "600" | "700";
  linkPaddingX: number;
  linkPaddingY: number;
  linkRadius: number;
  buttonFontSize: number;
  buttonFontWeight: "400" | "500" | "600" | "700";
  buttonPaddingX: number;
  buttonPaddingY: number;
  buttonRadius: number;
  buttonIconGap: number;
  controlSize: number;
  dropdownWidth: number;
  dropdownRadius: number;
  dropdownPadding: number;
  mobileDrawerPadding: number;
  hoverLift: number;
  transitionDuration: number;
  shadowOpacity: number;
  accentStart: string;
  accentEnd: string;
  darkBackground: string;
  darkBackgroundOpacity: number;
  darkPanel: string;
  darkText: string;
  darkMutedText: string;
  darkBorder: string;
  darkBorderOpacity: number;
  darkHoverBackground: string;
  darkHoverText: string;
  darkButtonBackground: string;
  darkButtonBackgroundOpacity: number;
  darkButtonText: string;
  darkButtonBorder: string;
  darkButtonBorderOpacity: number;
  darkButtonHoverBackground: string;
  darkButtonHoverText: string;
  lightBackground: string;
  lightBackgroundOpacity: number;
  lightPanel: string;
  lightText: string;
  lightMutedText: string;
  lightBorder: string;
  lightBorderOpacity: number;
  lightHoverBackground: string;
  lightHoverText: string;
  lightButtonBackground: string;
  lightButtonBackgroundOpacity: number;
  lightButtonText: string;
  lightButtonBorder: string;
  lightButtonBorderOpacity: number;
  lightButtonHoverBackground: string;
  lightButtonHoverText: string;
}

export interface PricingPackageItem {
  id: string;
  name: string;
  badge?: string;
  isPopular?: boolean;
  targetAudience: string;
  projectPriceLabel: string;
  retainerPriceLabel: string;
  comingSoonNote: string;
  summary: string;
  deliverables: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface PricingConfig {
  comingSoonMode: boolean;
  sectionEyebrow: string;
  sectionTitle: string;
  sectionSubtitle: string;
  projectToggleLabel: string;
  retainerToggleLabel: string;
  statusBannerText: string;
  packages: PricingPackageItem[];
}

export interface SiteSettings {
  companyName: string;
  positioning: string;
  tagline: string;
  founderName: string;
  targetMarkets: string[];
  targetCustomers: string[];
  contactEmail: string;
  supportHours: string;
  bookingUrl: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  navigation: NavItem[];
  navbarStyle?: NavbarStyleSettings;
  footerLinks: {
    services: NavItem[];
    company: NavItem[];
    legal: NavItem[];
  };
  pricingConfig?: PricingConfig;
  /** Public launch information entered in the owner settings form. */
  ownerValues?: { contactEmail: string; priceFrom: string; founderPhotoUrl: string };
  analytics: {
    ga4MeasurementId: string;
    requireCookieConsent: boolean;
    enabled: boolean;
  };
  rolePolicies: RolePolicyConfig;
  updatedAt: string;
}

export interface ServiceCategoryPillar {
  id: string;
  slug: string;
  number: number;
  name: string;
  shortSummary: string;
  capabilities: string[];
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  isFlagshipPriority: boolean;
  badgeLabel: string;
  shortSummary: string;
  problemStatement: string;
  solutionOverview: string;
  processSteps: { title: string; description: string }[];
  benefits: string[];
  useCases: { industry: string; scenario: string; outcome: string }[];
  faqs: { question: string; answer: string }[];
  ctaLabel: string;
  ctaHref: string;
  status: PublishStatus;
  order: number;
  seo: SeoMetadataFields;
  updatedAt: string;
}

export interface CaseStudyItem {
  id: string;
  slug: string;
  title: string;
  workType: WorkVerificationType;
  clientName: string | null;
  clientPermissionGranted: boolean;
  industry: string;
  businessType: string;
  problemSummary: string;
  manualProcessBefore: string[];
  proposedAutomation: string;
  automatedWorkflowAfter: string[];
  technologiesUsed: string[];
  verifiedResults: string[];
  projectDuration: string | null;
  relatedServiceSlugs: string[];
  testimonialId: string | null;
  status: PublishStatus;
  seo: SeoMetadataFields;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentMarkdown: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  readingTimeMinutes: number;
  showTableOfContents: boolean;
  status: PublishStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
  revisions: { savedAt: string; savedBy: string; title: string; contentMarkdown: string }[];
  seo: SeoMetadataFields;
  updatedAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
}

export interface TestimonialItem {
  id: string;
  authorName: string;
  authorRole: string;
  companyName: string;
  country: string;
  quote: string;
  isAuthorized: boolean;
  isVerified: boolean;
  isPublished: boolean;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  isFounder: boolean;
  bio: string;
  focusAreas: string[];
  regionsServed: string[];
  avatarUrl: string | null;
  linkedinUrl: string | null;
  order: number;
  isPublished: boolean;
}

export type PageSectionType =
  | "hero"
  | "trust_strip"
  | "problems_outcomes"
  | "flagship_systems"
  | "services_overview"
  | "interactive_demos_preview"
  | "workflow_demo"
  | "how_it_works"
  | "industry_use_cases"
  | "architecture_governance"
  | "roi_framing"
  | "case_studies_highlight"
  | "founder_intro"
  | "insights_preview"
  | "testimonials"
  | "faq_section"
  | "cta_banner"
  | "rich_text";

export interface PageSectionBlock {
  id: string;
  type: PageSectionType;
  title: string;
  subtitle?: string;
  isVisible: boolean;
  order: number;
  config: Record<string, unknown>;
}

export interface PageDocument {
  id: string;
  slug: string;
  title: string;
  status: PublishStatus;
  scheduledFor: string | null;
  sections: PageSectionBlock[];
  draftSections: PageSectionBlock[];
  seo: SeoMetadataFields;
  updatedAt: string;
  updatedBy?: string;
}

export interface LeadStatusChange {
  from: LeadStatus | null;
  to: LeadStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface LeadNote {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface LeadRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  website?: string;
  industry: string;
  interestedService: string;
  businessProblem: string;
  budgetRange?: string;
  timeline?: string;
  additionalDetails?: string;
  privacyConsent: boolean;
  status: LeadStatus;
  priority?: LeadPriority;
  proposalValue?: number | null;
  expectedClosingDate?: string | null;
  lostReason?: string | null;
  source: string;
  isDuplicateFlag: boolean;
  followUpDate: string | null;
  emailNotificationStatus: "sent" | "skipped_unconfigured" | "failed";
  notes: LeadNote[];
  statusHistory: LeadStatusChange[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadDashboardMetrics {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  activePipelineLeads: number;
  wonLeads: number;
  lostLeads: number;
  monthlyEnquiries: number;
  conversionRatePercent: number;
  qualificationRatePercent: number;
  dueFollowUps: number;
  totalPipelineValue: number;
  wonRevenueValue: number;
  sourcesBreakdown: Array<{ source: string; count: number; percent: number }>;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  storageProvider: "local" | "supabase";
  altText: string;
  category: "image" | "svg" | "document" | "brand";
  uploadedBy: string;
  usedIn: string[];
  createdAt: string;
}

export interface RedirectRule {
  id: string;
  sourcePath: string;
  destinationPath: string;
  permanent: boolean;
  isActive: boolean;
  createdAt: string;
}
