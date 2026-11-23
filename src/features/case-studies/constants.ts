import type { WorkVerificationType } from "@/types/content";

export const WORK_TYPE_META: Record<
  WorkVerificationType,
  { label: string; disclosure: string }
> = {
  verified_client: {
    label: "Verified Client Work",
    disclosure: "Delivered client engagement published with explicit authorization.",
  },
  internal_experiment: {
    label: "Internal Reference Prototype",
    disclosure: "Internal engineering prototype built and validated by OmniFlow.",
  },
  concept_demo: {
    label: "Concept Architecture",
    disclosure:
      "Reference workflow blueprint illustrating OmniFlow system design (not a client claim).",
  },
  planned_project: {
    label: "Planned Architecture",
    disclosure: "Upcoming system specification under active development.",
  },
};
