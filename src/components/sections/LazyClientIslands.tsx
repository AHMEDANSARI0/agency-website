"use client";

import dynamic from "next/dynamic";
import { LazyViewportBlock } from "@/components/ui/LazyViewportBlock";
import type { PricingConfig } from "@/types/content";
import type { FaqItem } from "@/types/content";
import type { DemoTabId } from "@/features/demos/engine";

const BeforeAfterDynamic = dynamic(
  () =>
    import("@/components/sections/BeforeAfterWorkflowCompare").then(
      (m) => m.BeforeAfterWorkflowCompare
    ),
  { ssr: false }
);

const AutomationLabDynamic = dynamic(
  () =>
    import("@/components/sections/HomeAutomationLabPreview").then(
      (m) => m.HomeAutomationLabPreview
    ),
  { ssr: false }
);

const IntegrationEcosystemDynamic = dynamic(
  () =>
    import("@/components/sections/IntegrationEcosystemVisualizer").then(
      (m) => m.IntegrationEcosystemVisualizer
    ),
  { ssr: false }
);

const ProcessSectionDynamic = dynamic(
  () =>
    import("@/components/sections/soale/SoaleProcessSection").then(
      (m) => m.SoaleProcessSection
    ),
  { ssr: false }
);

const PricingSectionDynamic = dynamic(
  () =>
    import("@/components/sections/soale/SoalePricingSection").then(
      (m) => m.SoalePricingSection
    ),
  { ssr: false }
);

const FaqAccordionDynamic = dynamic(
  () =>
    import("@/components/sections/soale/SoaleFaqAccordion").then(
      (m) => m.SoaleFaqAccordion
    ),
  { ssr: false }
);

const WorkflowDiagramDynamic = dynamic(
  () =>
    import("@/components/sections/WorkflowDiagram").then(
      (m) => m.WorkflowDiagram
    ),
  { ssr: false }
);

const InteractiveDemosHubDynamic = dynamic(
  () =>
    import("@/features/demos/InteractiveDemosHub").then(
      (m) => m.InteractiveDemosHub
    ),
  {
    ssr: false,
    loading: () => (
      <div
        aria-busy="true"
        className="min-h-[560px] rounded-[20px] border border-line bg-surface-card p-6 sm:p-8"
      />
    ),
  }
);

export function LazyBeforeAfterWorkflowCompare({
  className = "",
}: {
  className?: string;
}) {
  return (
    <LazyViewportBlock minHeight={420} className={className}>
      <BeforeAfterDynamic />
    </LazyViewportBlock>
  );
}

export function LazyHomeAutomationLabPreview({
  className = "",
}: {
  className?: string;
}) {
  return (
    <LazyViewportBlock minHeight={480} className={className}>
      <AutomationLabDynamic />
    </LazyViewportBlock>
  );
}

export function LazyIntegrationEcosystemVisualizer({
  className = "",
}: {
  className?: string;
}) {
  return (
    <LazyViewportBlock minHeight={420} className={className}>
      <IntegrationEcosystemDynamic />
    </LazyViewportBlock>
  );
}

export function LazySoaleProcessSection({
  className = "",
}: {
  className?: string;
}) {
  return (
    <LazyViewportBlock minHeight={440} className={className}>
      <ProcessSectionDynamic />
    </LazyViewportBlock>
  );
}

export function LazySoalePricingSection({
  pricing,
}: {
  pricing: PricingConfig;
}) {
  return (
    <LazyViewportBlock minHeight={460}>
      <PricingSectionDynamic pricing={pricing} />
    </LazyViewportBlock>
  );
}

export function LazySoaleFaqAccordion({
  faqs,
  contactEmail,
}: {
  faqs: FaqItem[];
  contactEmail: string;
}) {
  return (
    <LazyViewportBlock minHeight={360}>
      <FaqAccordionDynamic faqs={faqs} contactEmail={contactEmail} />
    </LazyViewportBlock>
  );
}

export function LazyWorkflowDiagram() {
  return (
    <LazyViewportBlock minHeight={360}>
      <WorkflowDiagramDynamic />
    </LazyViewportBlock>
  );
}

export function LazyInteractiveDemosHub({
  initialTab,
}: {
  initialTab?: DemoTabId;
}) {
  return <InteractiveDemosHubDynamic initialTab={initialTab} />;
}
