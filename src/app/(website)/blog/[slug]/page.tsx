import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import {
  getCachedBlogPostBySlug,
  getCachedPublishedBlogPosts,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SoaleArrowButton,
  SoaleCard,
  SoaleChip,
  SoaleEyebrow,
} from "@/components/ui/soale";
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
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const revalidate = 600;

export async function generateStaticParams() {
  const posts = await getCachedPublishedBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

interface BlogPostPageProps {
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
              className="rounded-lg bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-ink-heading"
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

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedBlogPostBySlug(slug);
  if (!post || post.status !== "published") {
    return {
      title: "Article Not Found",
      robots: { index: false, follow: false },
    };
  }
  const baseUrl = getCanonicalSiteUrl();
  const cleanTitle = (post.seo.seoTitle || post.title)
    .replace(/(?:\s*[|—–\-:]\s*OmniFlow(?:\s+Insights)?)+\s*$/i, "")
    .trim();
  return {
    title: cleanTitle || post.title,
    description: post.seo.seoDescription || post.excerpt,
    alternates: {
      canonical: post.seo.canonicalUrl || `${baseUrl}/blog/${post.slug}`,
    },
    robots: post.seo.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function BlogPostDetailPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [post, allPosts, settings] = await Promise.all([
    getCachedBlogPostBySlug(slug),
    getCachedPublishedBlogPosts(),
    getCachedSiteSettings(),
  ]);

  if (!post || post.status !== "published") {
    notFound();
  }

  const blocks = parseSafeMarkdown(post.contentMarkdown);
  const headings = extractTableOfContents(post.contentMarkdown);
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  const structuredData = [
    buildArticleJsonLd(post, settings),
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Insights", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  ];

  return (
    <div className="bg-canvas text-ink-body">
      <JsonLdScript data={structuredData} />
      <PageHeader
        breadcrumbs={[{ label: "Insights", href: "/blog" }, { label: post.title }]}
        badge={post.category}
        title={post.title}
        description={post.excerpt}
      />

      <section className="border-b border-line py-14 sm:py-22">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Editorial Article Reader Card */}
          <SoaleCard as="article" className="p-6 sm:p-10 lg:col-span-8">
            <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-line pb-5 text-xs text-ink-muted">
              <span>
                By{" "}
                <strong className="text-ink-heading">{post.authorName}</strong>
              </span>
              {post.publishedAt && (
                <span>
                  Published{" "}
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {post.readingTimeMinutes} min read
              </span>
            </div>

            <div className="space-y-5 text-base leading-relaxed text-ink-body">
              {blocks.map((block, index) => {
                if (block.type === "h2") {
                  return (
                    <h2
                      key={index}
                      id={block.id}
                      className="soale-h3 scroll-mt-28 pt-5 text-ink-heading"
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
                      className="soale-h4 scroll-mt-28 pt-3 text-ink-heading"
                    >
                      {block.text}
                    </h3>
                  );
                }
                if (block.type === "ul") {
                  return (
                    <ul
                      key={index}
                      className="list-disc space-y-2 pl-6 text-ink-body"
                    >
                      {block.items.map((item, idx) => (
                        <li key={idx}>
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
                      className="rounded-r-2xl border-l-4 border-primary bg-accent-subtle/60 p-5 italic text-ink-heading"
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
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Topics:
                </span>
                {post.tags.map((tag) => (
                  <SoaleChip key={tag}>{tag}</SoaleChip>
                ))}
              </div>
            )}

            <div className="mt-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to all insights
              </Link>
            </div>
          </SoaleCard>

          {/* Table of Contents & Conversion Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              {post.showTableOfContents && headings.length > 0 && (
                <SoaleCard className="p-6">
                  <nav aria-label="Table of contents">
                    <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                      On This Page
                    </p>
                    <ul className="mt-4 space-y-2.5 text-sm">
                      {headings.map((h) => (
                        <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
                          <a
                            href={`#${h.id}`}
                            className="text-ink-body transition-colors hover:text-primary"
                          >
                            {h.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </SoaleCard>
              )}

              <SoaleCard elevated className="p-6">
                <SoaleEyebrow className="mb-4">Practical Next Step</SoaleEyebrow>
                <h2 className="soale-h4 text-ink-heading">
                  Want to Apply This to Your Workflow?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-body">
                  Share your current lead, support, or operational bottleneck
                  and receive a tailored scoping response.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <SoaleArrowButton
                    href={settings.primaryCtaHref}
                    variant="primary"
                    size="sm"
                    className="w-full justify-between"
                  >
                    {settings.primaryCtaLabel}
                  </SoaleArrowButton>
                  <SoaleArrowButton
                    href="/demos"
                    variant="surface"
                    size="sm"
                    className="w-full justify-between"
                  >
                    Try Interactive Demos
                  </SoaleArrowButton>
                </div>
              </SoaleCard>
            </div>
          </aside>
        </Container>
      </section>

      {relatedPosts.length > 0 && (
        <section className="bg-canvas-tertiary/40 py-16">
          <Container>
            <h2 className="soale-h3 text-ink-heading">
              Further Engineering Reading
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {relatedPosts.map((rel) => (
                <Link key={rel.id} href={`/blog/${rel.slug}`} className="group">
                  <SoaleCard interactive className="h-full p-6">
                    <SoaleChip>{rel.category}</SoaleChip>
                    <h3 className="mt-3 text-lg font-semibold text-ink-heading group-hover:text-primary">
                      {rel.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-body">
                      {rel.excerpt}
                    </p>
                  </SoaleCard>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <PageConversionBanner
        eyebrow="Operational Assessment"
        title="Ready to turn manual processes into reliable infrastructure?"
        description="Speak directly with our principal architect about your firm’s intake, support, or internal operations."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </div>
  );
}
