import { permanentRedirect } from "next/navigation";

export const revalidate = 600;

/**
 * `/work` permanently consolidates into `/case-studies` (HTTP 308) so all
 * verified client builds, internal prototypes, and reference architectures
 * live in one authoritative, non-duplicated hub.
 */
export default function WorkRedirectPage() {
  permanentRedirect("/case-studies");
}
