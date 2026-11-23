import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { InitialSetupForm } from "@/features/admin/InitialSetupForm";
import { ThemeToggle } from "@/features/themes/ThemeToggle";
import { db } from "@/lib/database";
import { isProductionEnvironment } from "@/lib/env";

export default async function AdminInitialSetupPage() {
  const userCount = await db.countUsers();
  if (userCount > 0) {
    redirect("/admin/login");
  }

  const [brand, settings] = await Promise.all([
    db.getBrandAssets(),
    db.getSiteSettings(),
  ]);

  return (
    <div className="flex min-h-screen flex-col justify-between bg-canvas px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink-heading"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {settings.companyName}</span>
        </Link>
        <ThemeToggle />
      </div>

      <main className="mx-auto my-auto w-full max-w-md py-10">
        <div className="rounded-card border border-line bg-surface-card p-6 shadow-elevated sm:p-8">
          <div className="mb-6 space-y-2">
            <BrandMark brand={brand} href="/" />
            <h1 className="pt-2 text-2xl font-bold tracking-tight text-ink-heading">
              Initial Administrator Setup
            </h1>
            <p className="text-sm text-ink-muted">
              No staff accounts exist yet. Create the primary Super Admin account to unlock the OmniFlow administration console.
            </p>
          </div>

          <InitialSetupForm requiresSetupToken={isProductionEnvironment()} />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-md text-center text-xs text-ink-muted">
        Zero default passwords · Scrypt hashing · Permanent setup lock after creation
      </footer>
    </div>
  );
}
