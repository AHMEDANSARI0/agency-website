import { redirect } from "next/navigation";

export default function AdminPagesRedirect() {
  redirect("/admin/storefront?tab=pages");
}
