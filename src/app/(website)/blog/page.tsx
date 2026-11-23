import type { Metadata } from "next";
import { db } from "@/lib/database";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { BlogFilterList } from "@/components/sections/BlogFilterList";

export const metadata: Metadata = {
  title: "Insights & Practical Automation Guides",
  description:
    "Practical engineering guides on lead management, policy-grounded AI customer support, and business workflow automation.",
};

export default async function BlogListingPage() {
  const posts = await db.listBlogPosts(true);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Insights" }]}
        badge="Insights & Engineering Notes"
        title="Practical Guides on Business Automation & Guardrailed AI"
        description="Actionable notes for service business owners, consultants, and agency leaders evaluating operational automation."
      />

      <section className="py-14 sm:py-20">
        <Container>
          <BlogFilterList posts={posts} />
        </Container>
      </section>
    </>
  );
}
