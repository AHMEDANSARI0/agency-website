"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock, Search } from "lucide-react";
import type { BlogPost } from "@/types/content";
import { SoaleCard, SoaleChip } from "@/components/ui/soale";

const PAGE_SIZE = 6;

export function BlogFilterList({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(posts.map((p) => p.category)));
    return ["All", ...unique];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCat =
        selectedCategory === "All" || post.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, query, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIdx = (idx + delta + categories.length) % categories.length;
    const nextCat = categories[nextIdx];
    if (nextCat) {
      setSelectedCategory(nextCat);
      setPage(1);
      tabRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <div>
      {/* Soale Top-Bordered Category Tabs + Rounded Search Input */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div
          role="tablist"
          aria-label="Filter articles by category"
          className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {categories.map((cat, idx) => {
            const active = cat === selectedCategory;
            return (
              <button
                key={cat}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                tabIndex={active ? 0 : -1}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                aria-selected={active}
                data-active={active ? "true" : "false"}
                className="soale-work-tab text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--of-ring-focus)]"
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            aria-label="Search insights articles"
            placeholder="Search guides & topics…"
            className="w-full rounded-full border border-[var(--of-border-input)] bg-surface-input py-2.5 pl-10 pr-4 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* 3-Column Soale 24px Editorial Article Cards with Staggered Card Loading */}
      {paginated.length === 0 ? (
        <SoaleCard motionId="components-sections-BlogFilterList.tsx:1" className="soale-filter-enter mt-10 p-10 text-center">
          <p className="text-sm font-semibold text-ink-heading">
            No articles matched your filter.
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">
            Try clearing your search query or choosing another category.
          </p>
        </SoaleCard>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((post, idx) => (
            <SoaleCard motionId={"components-sections-BlogFilterList.tsx:2" + ":" + String(post.id)}
              key={`${selectedCategory}-${safePage}-${post.id}`}
              as="article"
              interactive
              staggerIndex={idx}
              className="soale-filter-enter group flex flex-col justify-between p-5 sm:p-6"
            >
              <div>
                <div className="soale-media-frame aspect-[16/9] border border-line">
                  <div className="soale-media-zoom flex h-full w-full flex-col justify-between bg-gradient-to-br from-accent-subtle via-surface to-surface-muted p-5">
                    <div className="flex items-center justify-between gap-2">
                      <SoaleChip>{post.category}</SoaleChip>
                      <span className="inline-flex items-center gap-1 font-mono text-[0.68rem] text-ink-muted">
                        <Clock className="h-3 w-3 text-primary" />
                        {post.readingTimeMinutes} min read
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-ink-heading">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{post.authorName}</span>
                    </div>
                  </div>
                </div>

                <h2 className="soale-h4 mt-5 text-ink-heading">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink-body">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs">
                <span className="font-mono text-[0.7rem] text-ink-muted">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : `By ${post.authorName}`}
                </span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 font-semibold text-primary transition-transform group-hover:translate-x-0.5"
                >
                  <span>Read article</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </SoaleCard>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-line bg-surface-card px-4 py-2 text-xs font-semibold text-ink-heading transition-colors hover:border-primary disabled:opacity-40"
          >
            Previous
          </button>
          <span className="font-mono text-xs text-ink-muted">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full border border-line bg-surface-card px-4 py-2 text-xs font-semibold text-ink-heading transition-colors hover:border-primary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
