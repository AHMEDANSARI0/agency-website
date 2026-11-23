"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Search } from "lucide-react";
import type { BlogPost } from "@/types/content";
import { Badge } from "@/components/ui/Badge";

const PAGE_SIZE = 6;

export function BlogFilterList({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(posts.map((p) => p.category)));
    return ["All", ...unique];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCat = selectedCategory === "All" || post.category === selectedCategory;
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
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      {/* Search & Category Controls */}
      <div className="flex flex-col justify-between gap-4 rounded-card border border-[var(--of-border-card)] bg-surface-card p-4 shadow-card sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter articles by category">
          {categories.map((cat) => {
            const active = cat === selectedCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                aria-pressed={active}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-muted text-ink-body hover:text-ink-heading"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            aria-label="Search insights articles"
            placeholder="Search insights…"
            className="w-full rounded-control border border-[var(--of-border-input)] bg-surface-input py-2 pl-9 pr-3 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Article Cards */}
      {paginated.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-surface-card p-10 text-center">
          <p className="text-sm font-medium text-ink-heading">No articles matched your filter.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Try clearing your search query or choosing another category.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((post) => (
            <article
              key={post.id}
              className="flex flex-col justify-between rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge>{post.category}</Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTimeMinutes} min read
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-semibold leading-snug text-ink-heading">
                  <Link href={`/blog/${post.slug}`} className="hover:text-link-hover">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-body">{post.excerpt}</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs">
                <span className="text-ink-muted">By {post.authorName}</span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 font-semibold text-link hover:text-link-hover"
                >
                  Read article
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-control border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-heading disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-ink-muted">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-control border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-heading disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
