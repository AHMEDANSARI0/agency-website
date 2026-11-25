import React from "react";
import { Container } from "@/components/ui/Container";

const STACK_TOOLS: Array<{
  name: string;
  icon: React.ReactNode;
}> = [
  {
    name: "HubSpot",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <circle cx="10.5" cy="9.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="15.5" cy="4.5" r="1.4" fill="currentColor" />
        <circle cx="4.5" cy="14.5" r="1.5" fill="currentColor" />
        <path
          d="M12.8 7.2L14.5 5.5M8.1 11.9L5.7 13.7M10.5 6.3V3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Slack",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M7.5 3.8v5.4M12.5 10.8v5.4M3.8 12.5h5.4M10.8 7.5h5.4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Notion",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <rect
          x="3.5"
          y="3.5"
          width="13"
          height="13"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M7.2 13.2V6.8l5.6 6.4V6.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Stripe",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M13.2 6.8c0-1.1-1.2-1.8-2.9-1.8-1.8 0-3.1.8-3.1 2.1 0 2.6 6.2 1.8 6.2 4.9 0 1.4-1.4 2.2-3.4 2.2-1.8 0-3.2-.6-3.6-1.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M10 3.2a6.6 6.6 0 0 0-5.7 9.9L3.5 16.5l3.6-.8A6.6 6.6 0 1 0 10 3.2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8 7.8c.2.9.9 2.2 2.1 3 .7.5 1.4.7 1.9.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Google Workspace",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <rect
          x="3.2"
          y="4.5"
          width="13.6"
          height="11"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M4 5.5l6 4.6 6-4.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function StackLogoBar() {
  return (
    <section
      aria-label="Supported business tools"
      className="border-b border-line/60 pb-14 pt-2 sm:pb-16"
    >
      <Container>
        <p className="text-center text-xs font-medium tracking-wide text-ink-muted">
          Works with your stack
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
          {STACK_TOOLS.map((tool) => (
            <li
              key={tool.name}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink-heading"
            >
              <span className="opacity-80">{tool.icon}</span>
              <span>{tool.name}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
