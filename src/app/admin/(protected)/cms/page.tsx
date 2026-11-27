import { redirect } from "next/navigation";

export default function AdminCmsRedirect() {
  redirect("/admin/storefront?tab=content");
}
