import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { revalidateAllPublicContent } from "@/lib/cache/public-cache";
import { readBoundedJsonBody } from "@/lib/security/request-guards";
import { extractClientIp } from "@/lib/security/rate-limit";
import { CARD_EFFECTS } from "@/features/card-motion/config";
const headers={"Cache-Control":"no-store, max-age=0"};
const schema=z.object({enabled:z.boolean(), defaultEffect:z.enum(CARD_EFFECTS), durationMs:z.number().int().min(200).max(1200), overrides:z.record(z.string().regex(/^c-[0-9a-f]{16}$/),z.enum(CARD_EFFECTS)).refine(v=>Object.keys(v).length<=500), revision:z.string().max(64).regex(/^(?:[a-f0-9-]{1,64})?$/)}).strict();
export async function GET(request: Request) {
  const auth=await requireAdminApiAuth(request,"theme:manage");if(!auth.ok)return auth.response;
  return NextResponse.json({config:await db.getCardMotion()},{headers});
}
export async function PUT(request: Request) {
  const auth=await requireAdminApiAuth(request,"theme:manage");if(!auth.ok)return auth.response;
  const body=await readBoundedJsonBody(request, 48*1024); if(!body.ok)return NextResponse.json({error:body.error},{status:body.status,headers});
  const parsed=schema.safeParse(body.data); if(!parsed.success)return NextResponse.json({error:"Invalid card motion settings."},{status:400,headers});
  const config={...parsed.data,revision:randomUUID()};
  try {
    if (!await db.saveCardMotion(config,parsed.data.revision)) return NextResponse.json({error:"Settings changed in another session. Reload before saving."},{status:409,headers});
    revalidateAllPublicContent();
    let auditRecorded=true;
    try {await db.recordAuditLog({actorId:auth.user.id,actorEmail:auth.user.email,actorRole:auth.user.role,action:"settings.card_motion_updated",entityType:"settings",summary:"Updated public card motion settings.",ipAddress:extractClientIp(request.headers)});} catch {auditRecorded=false;}
    return NextResponse.json({ok:true,config,auditRecorded},{headers});
  } catch {return NextResponse.json({error:"Unable to save card motion settings."},{status:503,headers});}
}
