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
      setMessage("Photo uploaded. Select Save owner values to apply it to the site.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); event.target.value = ""; }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/owner-values", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save owner values.");
      setMessage(data.missing?.length ? `Saved. Launch still needs: ${data.missing.join(", ")}.` : "Owner values saved. Public pages will refresh.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save owner values."); }
    finally { setBusy(false); }
  }
  const inputClass = "mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink-heading";
  return (
    <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="owner-values-title">
      <h2 id="owner-values-title" className="text-xl font-medium text-ink-heading">Owner launch information</h2>
      <p className="mt-2 text-sm text-ink-muted">These details are public. Do not enter passwords or API keys. A published founder is required in <Link className="text-primary underline" href="/admin/cms">Content Studio</Link>.</p>
      <form onSubmit={save} className="mt-4 grid gap-4">
        <label className="text-sm font-medium">Public contact email<input className={inputClass} type="email" required maxLength={140} value={values.contactEmail} onChange={e => setValues({ ...values, contactEmail: e.target.value })} /></label>
        <label className="text-sm font-medium">Starting price and currency<input className={inputClass} required maxLength={90} value={values.priceFrom} onChange={e => setValues({ ...values, priceFrom: e.target.value })} /></label>
        <label className="text-sm font-medium">Founder photo URL<input className={inputClass} required maxLength={2048} value={values.founderPhotoUrl} onChange={e => setValues({ ...values, founderPhotoUrl: e.target.value })} /></label>
        <label className="text-sm font-medium">Or upload founder photo (JPEG, PNG, WebP)<input className="mt-1 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={uploadPhoto} /></label>
        <p className="text-xs text-ink-muted">Uploads require Media Library permission and configured storage. Uploaded files remain in the media library even if you do not save this form.</p>
        <button className="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={busy} type="submit">{busy ? "Working…" : "Save owner values"}</button>
        {message && <p role="status" aria-live="polite" className="text-sm text-ink-heading">{message}</p>}
      </form>
    </section>
  );
}
