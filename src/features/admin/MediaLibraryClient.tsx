"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Copy,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Trash2,
  Upload,
} from "lucide-react";
import type { MediaAsset } from "@/types/content";

interface MediaLibraryClientProps {
  initialAssets: MediaAsset[];
  quotaBytes: number;
  maxSingleUploadBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MediaLibraryClient({
  initialAssets,
  quotaBytes,
  maxSingleUploadBytes,
}: MediaLibraryClientProps) {
  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets);
  const [filter, setFilter] = useState<string>("all");
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState<MediaAsset["category"]>("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const usedBytes = assets.reduce((sum, a) => sum + (a.sizeBytes || 0), 0);
  const usedPercent = Math.min(100, (usedBytes / quotaBytes) * 100);

  const filteredAssets =
    filter === "all" ? assets : assets.filter((a) => a.category === filter);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: "error", text: "Choose a file first." });
      return;
    }

    setUploading(true);
    setFeedback(null);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("altText", altText);
      form.append("category", category);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Upload rejected by security validator.",
        });
        return;
      }

      setAssets((prev) => [json.asset, ...prev]);
      setSelectedFile(null);
      setAltText("");
      setFeedback({
        type: "success",
        text: `Uploaded "${json.asset.originalName}" (${json.asset.storageProvider}). URL ready to copy.`,
      });
    } catch {
      setFeedback({ type: "error", text: "Network error during file upload." });
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdateAlt(id: string, nextAlt: string) {
    const res = await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, altText: nextAlt }),
    });
    const json = await res.json();
    if (res.ok && json.asset) {
      setAssets((prev) => prev.map((a) => (a.id === id ? json.asset : a)));
      setFeedback({ type: "success", text: "Updated accessible alt text." });
    }
  }

  async function handleDelete(asset: MediaAsset) {
    const res = await fetch(
      `/api/admin/media?id=${encodeURIComponent(asset.id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      setFeedback({
        type: "success",
        text: `Deleted "${asset.originalName}".`,
      });
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url);
    setFeedback({ type: "success", text: `Copied asset URL: ${url}` });
  }

  return (
    <div className="space-y-6">
      {/* Free-Tier Storage Quota Bar */}
      <div className="rounded-card border border-line bg-surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-heading">
            <HardDrive className="h-4 w-4 text-primary" />
            <span>Free-Tier Storage Quota Monitor</span>
          </div>
          <span className="font-mono text-xs text-ink-muted">
            {formatBytes(usedBytes)} / {formatBytes(quotaBytes)} (Max{" "}
            {formatBytes(maxSingleUploadBytes)} per file)
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.max(1, usedPercent)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Basic file signature checks are active. Allowed: PNG, JPEG, WebP,
          GIF, and PDF. New SVG uploads are disabled; existing SVG files are not inspected.
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2.5 rounded-card border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-ink-heading"
              : "border-red-500/30 bg-red-500/10 text-ink-heading"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Upload Form */}
      <form
        onSubmit={handleUpload}
        className="grid gap-4 rounded-card border border-line bg-surface-card p-5 lg:grid-cols-4 lg:items-end"
      >
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Select File
          </label>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.gif,.pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-xs text-ink-body file:mr-3 file:rounded-full file:border-0 file:bg-accent-subtle file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Accessible Alt Text
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe image for screen readers"
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted">
            Asset Category
          </label>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as MediaAsset["category"])
            }
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-heading"
          >
            <option value="image">Content Image</option>
            <option value="brand">Brand / Logo Asset</option>
            <option value="document">PDF Document</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={uploading || !selectedFile}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>{uploading ? "Uploading..." : "Upload Asset"}</span>
        </button>
      </form>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {["all", "image", "brand", "svg", "document"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`rounded-full px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider ${
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "border border-line bg-surface-card text-ink-muted hover:text-ink-heading"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-surface-card p-10 text-center">
          <ImageIcon className="mx-auto h-8 w-8 text-ink-muted" />
          <p className="mt-2 text-sm font-medium text-ink-heading">
            No media assets in this view yet
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Upload logos, workflow diagrams, blog covers, or PDF briefs above.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col justify-between rounded-card border border-line bg-surface-card p-4"
            >
              <div>
                <div className="flex h-36 items-center justify-center overflow-hidden rounded-control border border-line bg-surface-muted/60 p-3">
                  {asset.mimeType === "application/pdf" ? (
                    <div className="text-center">
                      <FileText className="mx-auto h-10 w-10 text-primary" />
                      <span className="mt-1 block font-mono text-[11px] text-ink-muted">
                        PDF DOCUMENT
                      </span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.url}
                      alt={asset.altText || asset.originalName}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-ink-heading">
                    {asset.originalName}
                  </p>
                  <span className="shrink-0 rounded bg-accent-subtle px-1.5 py-0.5 font-mono text-[10px] text-primary">
                    {formatBytes(asset.sizeBytes)}
                  </span>
                </div>

                <p className="mt-1 truncate font-mono text-[11px] text-ink-muted">
                  {asset.url}
                </p>

                <div className="mt-2">
                  <input
                    type="text"
                    defaultValue={asset.altText}
                    onBlur={(e) => {
                      if (e.target.value !== asset.altText) {
                        handleUpdateAlt(asset.id, e.target.value);
                      }
                    }}
                    placeholder="Alt text..."
                    className="w-full rounded border border-line bg-surface px-2 py-1 text-xs text-ink-heading"
                  />
                </div>

                {asset.usedIn.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {asset.usedIn.map((ref, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-ink-heading"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => copyUrl(asset.url)}
                  className="inline-flex items-center gap-1 rounded-control border border-line px-2.5 py-1 text-xs font-medium text-ink-heading hover:bg-surface-muted"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(asset)}
                  className="inline-flex items-center gap-1 rounded-control border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
