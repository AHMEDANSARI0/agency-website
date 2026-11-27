import { redirect } from "next/navigation";

export default function AdminBrandRedirect() {
  redirect("/admin/storefront?tab=theme");
}
