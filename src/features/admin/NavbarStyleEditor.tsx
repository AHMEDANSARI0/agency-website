"use client";

import { useEffect, useState } from "react";
import type { NavbarStyleSettings } from "@/types/content";

type NumericSettingKey = {
  [K in keyof NavbarStyleSettings]: NavbarStyleSettings[K] extends number
    ? K
    : never;
}[keyof NavbarStyleSettings];

type ColorSettingKey = Exclude<
  keyof NavbarStyleSettings,
  NumericSettingKey | "linkFontWeight"
>;

interface NumberFieldConfig {
  key: NumericSettingKey;
  label: string;
  min: number;
  max: number;
  unit?: string;
}

interface ColorFieldConfig {
  key: ColorSettingKey;
  label: string;
  opacityKey?: NumericSettingKey;
}

const layoutFields: NumberFieldConfig[] = [
  { key: "sideInset", label: "Side spacing", min: 0, max: 100, unit: "px" },
  { key: "maxWidth", label: "Maximum width", min: 400, max: 2400, unit: "px" },
  { key: "barHeight", label: "Navbar height", min: 40, max: 160, unit: "px" },
  { key: "barPaddingX", label: "Horizontal padding", min: 0, max: 80, unit: "px" },
  { key: "barRadius", label: "Navbar corner radius", min: 0, max: 80, unit: "px" },
  { key: "borderWidth", label: "Border thickness", min: 0, max: 4, unit: "px" },
  { key: "backdropBlur", label: "Glass blur", min: 0, max: 40, unit: "px" },
  { key: "barShadowBlur", label: "Navbar shadow blur", min: 0, max: 80, unit: "px" },
  { key: "barShadowOpacity", label: "Navbar shadow strength", min: 0, max: 100, unit: "%" },
  { key: "groupGap", label: "Logo / links / actions spacing", min: 0, max: 64, unit: "px" },
  { key: "navGap", label: "Link spacing", min: 0, max: 32, unit: "px" },
  { key: "controlSize", label: "Theme/menu control size", min: 24, max: 64, unit: "px" },
  { key: "dropdownWidth", label: "Dropdown width", min: 160, max: 500, unit: "px" },
  { key: "dropdownRadius", label: "Dropdown corner radius", min: 0, max: 48, unit: "px" },
  { key: "dropdownPadding", label: "Dropdown padding", min: 0, max: 24, unit: "px" },
  { key: "mobileDrawerPadding", label: "Mobile menu padding", min: 0, max: 40, unit: "px" },
];

const interactionFields: NumberFieldConfig[] = [
  { key: "linkFontSize", label: "Link text size", min: 10, max: 24, unit: "px" },
  { key: "linkPaddingX", label: "Link horizontal padding", min: 0, max: 32, unit: "px" },
  { key: "linkPaddingY", label: "Link vertical padding", min: 0, max: 24, unit: "px" },
  { key: "linkRadius", label: "Link corner radius", min: 0, max: 1000, unit: "px" },
  { key: "buttonFontSize", label: "Button text size", min: 10, max: 24, unit: "px" },
  { key: "buttonIconGap", label: "Button icon spacing", min: 0, max: 24, unit: "px" },
  { key: "buttonPaddingX", label: "Button horizontal padding", min: 0, max: 48, unit: "px" },
  { key: "buttonPaddingY", label: "Button vertical padding", min: 0, max: 32, unit: "px" },
  { key: "buttonRadius", label: "Button corner radius", min: 0, max: 1000, unit: "px" },
  { key: "hoverLift", label: "Hover lift", min: 0, max: 12, unit: "px" },
  { key: "transitionDuration", label: "Hover transition", min: 0, max: 1000, unit: "ms" },
  { key: "shadowOpacity", label: "Hover shadow strength", min: 0, max: 100, unit: "%" },
];

const sharedColors: ColorFieldConfig[] = [
  { key: "accentStart", label: "Hover border gradient · start" },
  { key: "accentEnd", label: "Hover border gradient · end" },
];

const darkColors: ColorFieldConfig[] = [
  { key: "darkBackground", label: "Navbar glass background", opacityKey: "darkBackgroundOpacity" },
  { key: "darkPanel", label: "Dropdown / mobile menu background" },
  { key: "darkText", label: "Link and button text" },
  { key: "darkMutedText", label: "Secondary text" },
  { key: "darkBorder", label: "Navbar border", opacityKey: "darkBorderOpacity" },
  { key: "darkHoverBackground", label: "Link hover background" },
  { key: "darkHoverText", label: "Link hover text" },
  { key: "darkButtonBackground", label: "Button background", opacityKey: "darkButtonBackgroundOpacity" },
  { key: "darkButtonText", label: "Button text" },
  { key: "darkButtonBorder", label: "Button border", opacityKey: "darkButtonBorderOpacity" },
  { key: "darkButtonHoverBackground", label: "Button hover background" },
  { key: "darkButtonHoverText", label: "Button hover text" },
];

const lightColors: ColorFieldConfig[] = [
  { key: "lightBackground", label: "Navbar glass background", opacityKey: "lightBackgroundOpacity" },
  { key: "lightPanel", label: "Dropdown / mobile menu background" },
  { key: "lightText", label: "Link and button text" },
  { key: "lightMutedText", label: "Secondary text" },
  { key: "lightBorder", label: "Navbar border", opacityKey: "lightBorderOpacity" },
  { key: "lightHoverBackground", label: "Link hover background" },
  { key: "lightHoverText", label: "Link hover text" },
  { key: "lightButtonBackground", label: "Button background", opacityKey: "lightButtonBackgroundOpacity" },
  { key: "lightButtonText", label: "Button text" },
  { key: "lightButtonBorder", label: "Button border", opacityKey: "lightButtonBorderOpacity" },
  { key: "lightButtonHoverBackground", label: "Button hover background" },
  { key: "lightButtonHoverText", label: "Button hover text" },
];

const fieldClass =
  "mt-1 min-w-0 w-full rounded-control border border-line bg-surface px-2.5 py-2 text-sm text-ink-heading";

function NumberFields({
  fields,
  value,
  onChange,
}: {
  fields: NumberFieldConfig[];
  value: NavbarStyleSettings;
  onChange: (key: NumericSettingKey, next: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((field) => (
        <NumberSettingField
          key={field.key}
          field={field}
          value={value[field.key]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function NumberSettingField({
  field,
  value,
  onChange,
}: {
  field: NumberFieldConfig;
  value: number;
  onChange: (key: NumericSettingKey, next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [focused, value]);

  return (
    <label className="block min-w-0 text-xs font-medium text-ink-muted">
      {field.label}
      <div className="relative">
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={1}
          value={draft}
          onFocus={() => setFocused(true)}
          onChange={(event) => {
            const rawValue = event.target.value;
            setDraft(rawValue);
            if (rawValue !== "" && Number.isFinite(Number(rawValue))) {
              onChange(field.key, Number(rawValue));
            }
          }}
          onBlur={() => {
            setFocused(false);
            const parsed = Number(draft);
            const next = draft.trim() && Number.isFinite(parsed)
              ? Math.min(field.max, Math.max(field.min, parsed))
              : value;
            setDraft(String(next));
            onChange(field.key, next);
          }}
          className={`${fieldClass} ${field.unit ? "pr-10" : ""}`}
        />
        {field.unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted">
            {field.unit}
          </span>
        )}
      </div>
    </label>
  );
}

function ColorFields({
  fields,
  value,
  onChange,
}: {
  fields: ColorFieldConfig[];
  value: NavbarStyleSettings;
  onChange: (key: keyof NavbarStyleSettings, next: string | number) => void;
}) {
  return (
    <div className="grid gap-3">
      {fields.map((field) => (
        <div key={field.key} className="flex items-end gap-3">
          <label className="block min-w-0 flex-1 text-xs font-medium text-ink-muted">
            {field.label}
            <input
              type="color"
              value={value[field.key]}
              onChange={(event) => onChange(field.key, event.target.value.toUpperCase())}
              className="mt-1 h-10 w-full cursor-pointer rounded-control border border-line bg-surface p-1"
            />
          </label>
          {field.opacityKey && (
            <label className="mb-0.5 block w-24 shrink-0 text-[11px] font-medium text-ink-muted">
              Opacity %
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={value[field.opacityKey]}
                onChange={(event) =>
                  onChange(field.opacityKey!, Number(event.target.value))
                }
                className={fieldClass}
              />
            </label>
          )}
        </div>
      ))}
    </div>
  );
}

export function NavbarStyleEditor({
  value,
  onChange,
}: {
  value: NavbarStyleSettings;
  onChange: (next: NavbarStyleSettings) => void;
}) {
  const [openPanel, setOpenPanel] = useState<
    "layout" | "interactions" | "dark" | "light" | null
  >("layout");

  function syncOpenPanel(
    panel: "layout" | "interactions" | "dark" | "light",
    isOpen: boolean
  ) {
    setOpenPanel((current) =>
      isOpen ? panel : current === panel ? null : current
    );
  }

  function update(key: keyof NavbarStyleSettings, next: string | number) {
    onChange({ ...value, [key]: next });
  }

  return (
    <section className="space-y-4 rounded-card border border-line bg-surface-card p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold text-ink-heading">
          Navbar Appearance &amp; Behavior
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Tune the header, then check the live preview. Theme colors stay separate.
        </p>
      </div>

      <div className="space-y-4">
        <details
          open={openPanel === "layout"}
          onToggle={(event) =>
            syncOpenPanel("layout", event.currentTarget.open)
          }
          className="rounded-control border border-line bg-surface p-4"
        >
          <summary className="cursor-pointer text-xs font-semibold text-ink-heading">
            Layout &amp; spacing
          </summary>
          <div className="mt-3">
            <NumberFields fields={layoutFields} value={value} onChange={update} />
          </div>
        </details>

        <details
          open={openPanel === "interactions"}
          onToggle={(event) =>
            syncOpenPanel("interactions", event.currentTarget.open)
          }
          className="rounded-control border border-line bg-surface p-4"
        >
          <summary className="cursor-pointer text-xs font-semibold text-ink-heading">
            Links, buttons &amp; hover
          </summary>
          <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-ink-muted">
              Brand mark size
              <select
                value={value.brandMarkSize}
                onChange={(event) => update("brandMarkSize", event.target.value)}
                className={fieldClass}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-ink-muted">
              Link font weight
              <select
                value={value.linkFontWeight}
                onChange={(event) => update("linkFontWeight", event.target.value)}
                className={fieldClass}
              >
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-ink-muted">
              Button font weight
              <select
                value={value.buttonFontWeight}
                onChange={(event) => update("buttonFontWeight", event.target.value)}
                className={fieldClass}
              >
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </label>
          </div>
          <NumberFields fields={interactionFields} value={value} onChange={update} />
          <ColorFields fields={sharedColors} value={value} onChange={update} />
          </div>
        </details>

        <details
          open={openPanel === "dark"}
          onToggle={(event) => syncOpenPanel("dark", event.currentTarget.open)}
          className="rounded-control border border-line bg-surface p-4"
        >
          <summary className="cursor-pointer text-xs font-semibold text-ink-heading">
            Dark theme colors
          </summary>
          <div className="mt-3">
            <ColorFields fields={darkColors} value={value} onChange={update} />
          </div>
        </details>

        <details
          open={openPanel === "light"}
          onToggle={(event) => syncOpenPanel("light", event.currentTarget.open)}
          className="rounded-control border border-line bg-surface p-4"
        >
          <summary className="cursor-pointer text-xs font-semibold text-ink-heading">
            Light theme colors
          </summary>
          <div className="mt-3">
            <ColorFields fields={lightColors} value={value} onChange={update} />
          </div>
        </details>
      </div>
    </section>
  );
}
