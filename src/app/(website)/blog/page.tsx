import type { Metadata } from "next";
import {
  getCachedPublishedBlogPosts,
  getCachedSiteSettings,
} from "@/lib/cache/public-cache";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoaleArrowButton } from "@/components/ui/soale";
import { BlogFilterList } from "@/components/sections/BlogFilterList";
import { PageConversionBanner } from "@/components/sections/PageConversionBanner";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Insights & Practical Automation Guides",
  description:
    "Operational articles and implementation guides on lead qualification, policy-grounded AI customer support, and reliable business workflows.",
};

export default async function BlogIndexPage() {
  const [posts, settings] = await Promise.all([
    getCachedPublishedBlogPosts(),
    getCachedSiteSettings(),
  ]);

  return (
    <div className="bg-canvas text-ink-body">
      <PageHeader
        breadcrumbs={[{ label: "Insights" }]}
        badge="Engineering Insights & Playbooks"
        title="Practical Guides on Reliable Business Automation"
        description="Straightforward operational advice for service business owners, consultants, and agency leaders — written without AI hype."
        actions={
          <SoaleArrowButton href="/feed.xml" variant="outline" size="sm">
            Subscribe via RSS
          </SoaleArrowButton>
        }
      />

      <section className="py-16 sm:py-24">
        <Container>
          <BlogFilterList posts={posts} />
        </Container>
      </section>

      <PageConversionBanner
        eyebrow="Put It Into Practice"
        title="Want help implementing one of these playbooks in your firm?"
        description="Tell us about your current tools and workflow bottleneck. We will map out a clean, deterministic implementation plan."
        primaryLabel={settings.primaryCtaLabel}
        primaryHref={settings.primaryCtaHref}
      />
    </div>
  );
}
