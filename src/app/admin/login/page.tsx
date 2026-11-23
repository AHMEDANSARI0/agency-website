import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { LoginForm } from "@/features/admin/LoginForm";
import { ThemeToggle } from "@/features/themes/ThemeToggle";
import { getCurrentAdminUser } from "@/lib/auth/server";
import { db } from "@/lib/database";

export default async function AdminLoginPage() {
  const existingUser = await getCurrentAdminUser();
  if (existingUser) {
    if (existingUser.mustChangePassword) {
      redirect("/admin/account?forcePasswordChange=1");
    }
    redirect("/admin");
  }

  const [userCount, brand, settings] = await Promise.all([
    db.countUsers(),
    db.getBrandAssets(),
    db.getSiteSettings(),
  ]);

  if (userCount === 0) {
    redirect("/admin/setup");
  }

  return (
    <div className="bg-tech-grid-subtle flex min-h-screen flex-col justify-between bg-canvas px-4 py-8 sm:px-6">
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
        <div className="rounded-card border border-[var(--of-border-card)] bg-surface-card p-6 shadow-elevated sm:p-8">
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <BrandMark brand={brand} href="/" />
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3 w-3" />
                Protected Console
              </span>
            </div>
            <h1 className="pt-2 text-2xl font-bold tracking-tight text-ink-heading">
              Staff Administration
            </h1>
            <p className="text-sm text-ink-muted">
              Sign in to manage enquiries, content workflows, brand themes, and security logs.
            </p>
          </div>

          <LoginForm />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-md text-center text-xs text-ink-muted">
        Protected by signed HTTP-only sessions, Same-Origin CSRF checks, and rate-limited login guards.
      </footer>
    </div>
  );
}
