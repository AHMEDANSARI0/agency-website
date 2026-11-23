"use client";

import React, { useEffect, useState } from "react";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import type { MediaAsset } from "@/types/content";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: { url: string; altText: string }) => void;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/admin/media")
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          assets?: MediaAsset[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Unable to load media assets.");
        } else {
          setAssets(data.assets || []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Network error while loading Media Library.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose image from Media Library"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-card border border-line bg-surface-card shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-ink-heading">
              Select Asset from Media Library
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Media Library picker"
            className="rounded p-1 text-ink-muted hover:text-ink-heading"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading uploaded assets...</span>
            </div>
          ) : error ? (
            <p className="py-8 text-center text-xs text-status-error">{error}</p>
          ) : assets.length === 0 ? (
            <div className="py-10 text-center text-xs text-ink-muted">
              <p className="font-semibold text-ink-heading">
                No uploaded media assets yet
              </p>
              <p className="mt-1">
                Upload images in the{" "}
                <a
                  href="/admin/media"
                  className="font-semibold text-primary underline"
                >
                  Media Library
                </a>{" "}
                first, or paste a relative `/uploads/...` or HTTPS URL directly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect({
                      url: asset.url,
                      altText: asset.altText || asset.originalName,
                    });
                    onClose();
                  }}
                  className="group overflow-hidden rounded-control border border-line bg-surface text-left transition-all hover:border-primary"
                >
                  <div className="flex h-28 items-center justify-center overflow-hidden bg-surface-muted p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={asset.altText || asset.originalName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-semibold text-ink-heading group-hover:text-primary">
                      {asset.originalName}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-ink-muted">
                      {Math.round(asset.sizeBytes / 1024)} KB
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
