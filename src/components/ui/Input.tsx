import React from "react";

interface FieldWrapperProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldWrapper({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold tracking-tight text-ink-heading"
        >
          {label}
          {required && <span className="ml-0.5 text-status-error">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-status-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const CONTROL_BASE =
  "w-full rounded-control border border-[var(--of-border-input)] bg-surface-input px-3.5 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted/70 shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)]/25 disabled:cursor-not-allowed disabled:opacity-60";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({
  id,
  label,
  hint,
  error,
  required,
  className = "",
  ...rest
}: InputProps) {
  const resolvedId = id || rest.name || "input-field";
  return (
    <FieldWrapper
      id={resolvedId}
      label={label}
      hint={hint}
      error={error}
      required={required}
    >
      <input
        id={resolvedId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          error ? `${resolvedId}-error` : hint ? `${resolvedId}-hint` : undefined
        }
        className={`${CONTROL_BASE} ${
          error ? "border-status-error focus-visible:border-status-error" : ""
        } ${className}`}
        {...rest}
      />
    </FieldWrapper>
  );
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({
  id,
  label,
  hint,
  error,
  required,
  className = "",
  ...rest
}: TextareaProps) {
  const resolvedId = id || rest.name || "textarea-field";
  return (
    <FieldWrapper
      id={resolvedId}
      label={label}
      hint={hint}
      error={error}
      required={required}
    >
      <textarea
        id={resolvedId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          error ? `${resolvedId}-error` : hint ? `${resolvedId}-hint` : undefined
        }
        className={`${CONTROL_BASE} ${
          error ? "border-status-error focus-visible:border-status-error" : ""
        } ${className}`}
        {...rest}
      />
    </FieldWrapper>
  );
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Select({
  id,
  label,
  hint,
  error,
  required,
  className = "",
  children,
  ...rest
}: SelectProps) {
  const resolvedId = id || rest.name || "select-field";
  return (
    <FieldWrapper
      id={resolvedId}
      label={label}
      hint={hint}
      error={error}
      required={required}
    >
      <select
        id={resolvedId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          error ? `${resolvedId}-error` : hint ? `${resolvedId}-hint` : undefined
        }
        className={`${CONTROL_BASE} ${
          error ? "border-status-error focus-visible:border-status-error" : ""
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}
