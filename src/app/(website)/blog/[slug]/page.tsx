import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { db } from "@/lib/database";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  getCanonicalSiteUrl,
} from "@/features/seo/json-ld";
import {
  extractTableOfContents,
  parseSafeMarkdown,
  tokenizeInlineFormatting,
} from "@/features/blog/markdown";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function InlineFormatted({ text }: { text: string }) {
  const tokens = tokenizeInlineFormatting(text);
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.kind === "strong") {
          return (
            <strong key={i} className="font-semibold text-ink-heading">
              {tok.value}
            </strong>
          );
        }
        if (tok.kind === "code") {
          return (
            <code
              key={i}
              className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-ink-heading"
            >
              {tok.value}
            </code>
          );
        }
        return <React.Fragment key={i}>{tok.value}</React.Fragment>;
      })}
    </>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.getBlogPostBySlug(slug, true);
  if (!post) return { title: "Article Not Found", robots: { index: false, follow: false } };
  const baseUrl = getCanonicalSiteUrl();
  return {
    title: post.seo.seoTitle || post.title,
    description: post.seo.seoDescription || post.excerpt,
    alternates: {
      canonical: post.seo.canonicalUrl || `${baseUrl}/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      title: post.seo.seoTitle || post.title,
      description: post.seo.seoDescription || post.excerpt,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl, alt: post.featuredImageAlt }] : undefined,
    },
    robots: post.seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function BlogPostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, allPosts, settings] = await Promise.all([
    db.getBlogPostBySlug(slug, true),
    db.listBlogPosts(true),
    db.getSiteSettings(),
  ]);

  if (!post) {
    notFound();
  }

  const structuredData = [
    buildArticleJsonLd(post, settings),
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Insights", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ];

  const toc = post.showTableOfContents ? extractTableOfContents(post.contentMarkdown) : [];
  const blocks = parseSafeMarkdown(post.contentMarkdown);
  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 2);
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article>
      <JsonLdScript data={structuredData} />
      <header className="border-b border-line bg-hero-glow py-12 sm:py-16">
        <Container className="max-w-4xl">
          <Breadcrumbs
            items={[
              { label: "Insights", href: "/blog" },
              { label: post.title },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{post.category}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTimeMinutes} min read
            </span>
            {formattedDate && <span className="text-xs text-ink-muted">· {formattedDate}</span>}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-heading sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-body sm:text-lg">{post.excerpt}</p>
          <p className="mt-4 text-xs font-medium text-ink-muted">Written by {post.authorName}</p>
        </Container>
      </header>

      <Container className="max-w-5xl py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {toc.length > 0 && (
            <aside className="lg:col-span-4">
              <div className="sticky top-24 rounded-card border border-[var(--of-border-card)] bg-surface-card p-5 shadow-card">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-heading">
                  On This Page
                </h2>
                <ul className="mt-3 space-y-2 text-xs">
                  {toc.map((heading) => (
                    <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}>
                      <a
                        href={`#${heading.id}`}
                        className="text-ink-body transition-colors hover:text-link-hover"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          <div className={toc.length > 0 ? "lg:col-span-8" : "lg:col-span-12 max-w-3xl mx-auto"}>
            <div className="space-y-5 text-base leading-relaxed text-ink-body">
              {blocks.map((block, index) => {
                if (block.type === "h2") {
                  return (
                    <h2
                      key={index}
                      id={block.id}
                      className="scroll-mt-24 pt-4 text-2xl font-bold text-ink-heading"
                    >
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === "h3") {
                  return (
                    <h3
                      key={index}
                      id={block.id}
                      className="scroll-mt-24 pt-2 text-xl font-semibold text-ink-heading"
                    >
                      {block.text}
                    </h3>
                  );
                }
                if (block.type === "ul") {
                  return (
                    <ul key={index} className="list-disc space-y-2 pl-5">
                      {block.items.map((item, liIdx) => (
                        <li key={liIdx}>
                          <InlineFormatted text={item} />
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === "blockquote") {
                  return (
                    <blockquote
                      key={index}
                      className="border-l-4 border-primary bg-surface-muted px-4 py-3 italic text-ink-heading"
                    >
                      <InlineFormatted text={block.text} />
                    </blockquote>
                  );
                }
                return (
                  <p key={index}>
                    <InlineFormatted text={block.text} />
                  </p>
                );
              })}
            </div>

            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="status">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-10 rounded-card border border-[var(--of-border-card)] bg-surface-muted p-6">
              <h2 className="text-lg font-bold text-ink-heading">
                Evaluating This Workflow for Your Business?
              </h2>
              <p className="mt-1.5 text-sm text-ink-body">
                Share your current tools and bottleneck—OmniFlow will outline a practical approach.
              </p>
              <div className="mt-4">
                <Button href="/contact" size="sm">
                  Request Scoping Advice
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-line pt-12">
            <h2 className="text-xl font-bold text-ink-heading">Related Insights</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-card transition-colors hover:border-primary/40"
                >
                  <Badge>{item.category}</Badge>
                  <h3 className="mt-3 text-lg font-semibold text-ink-heading">{item.title}</h3>
                  <p className="mt-2 text-sm text-ink-body">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </Container>
    </article>
  );
}
