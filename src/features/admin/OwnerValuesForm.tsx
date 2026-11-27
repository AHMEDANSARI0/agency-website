"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { OwnerValues } from "@/lib/owner-config";

export function OwnerValuesForm({ initial }: { initial: OwnerValues }) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Choose a JPEG, PNG or WebP image."); return;
    }
    setBusy(true); setMessage("");
    try {
      const form = new FormData();
      form.set("file", file); form.set("category", "image"); form.set("altText", "Founder portrait");
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || !data.asset?.url) throw new Error(data.error || "Upload failed.");
      setValues(v => ({ ...v, founderPhotoUrl: data.asset.url }));
      setMessage("Photo uploaded. Save a draft or publish it to the site.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); event.target.value = ""; }
  }
  async function save(publish: boolean) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/owner-values", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, publish }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save owner values.");
      const result = data.missing?.length
        ? `${publish ? "Published" : "Draft saved"}. Launch still needs: ${data.missing.join(", ")}.`
        : publish
          ? "Owner values published. Public pages will refresh."
          : "Owner values draft saved.";
      setMessage(result);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save owner values."); }
    finally { setBusy(false); }
  }
  const inputClass = "mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink-heading";
  return (
    <details className="rounded-lg border border-line bg-surface">
      <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span id="owner-values-title" className="text-sm font-semibold text-ink-heading">
          Owner launch information
        </span>
        <span className="mt-1 block text-xs text-ink-muted">
          Public contact, starting price and founder photo
        </span>
      </summary>
      <div className="border-t border-line px-4 pb-4 pt-3">
        <p className="text-xs leading-5 text-ink-muted">
          These details are public. Never enter passwords or API keys. A published
          founder is required in{" "}
          <Link className="underline underline-offset-2" href="/admin/cms">
            Content Studio
          </Link>
          .
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save(false);
          }}
          className="mt-4 grid gap-3"
        >
          <label className="text-xs font-medium text-ink-muted">
            Public contact email
            <input className={inputClass} type="email" required maxLength={140} value={values.contactEmail} onChange={e => setValues({ ...values, contactEmail: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-ink-muted">
            Starting price and currency
            <input className={inputClass} required maxLength={90} value={values.priceFrom} onChange={e => setValues({ ...values, priceFrom: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-ink-muted">
            Founder photo URL
            <input className={inputClass} required maxLength={2048} value={values.founderPhotoUrl} onChange={e => setValues({ ...values, founderPhotoUrl: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-ink-muted">
            Or upload founder photo (JPEG, PNG, WebP)
            <input className="mt-1 block w-full text-sm text-ink-heading" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={uploadPhoto} />
          </label>
          <p className="text-[11px] leading-5 text-ink-muted">
            Uploads require Media Library permission and configured storage. Uploaded
            files remain in the media library even if you do not save this form.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="w-fit rounded-lg border border-line-strong px-3 py-2 text-xs font-medium text-ink-heading hover:bg-surface-muted disabled:opacity-50" disabled={busy} type="submit">{busy ? "Saving…" : "Save draft"}</button>
            <button className="w-fit rounded-lg border border-line-strong bg-ink-heading px-3 py-2 text-xs font-medium text-surface disabled:opacity-50" disabled={busy} type="button" onClick={() => void save(true)}>{busy ? "Publishing…" : "Publish"}</button>
          </div>
          {message && <p role="status" aria-live="polite" className="text-xs text-ink-heading">{message}</p>}
        </form>
      </div>
    </details>
  );
}
