import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeCardMotion } from "@/features/card-motion/config";
import { findPublicCards } from "@/features/card-motion/catalog";
import { PUT, GET } from "@/app/api/admin/card-motion/route";
import { requireAdminApiAuth } from "@/lib/auth/server";
import { db } from "@/lib/database";
import { createInitialSeedSnapshot } from "@/lib/database/seed-data";
vi.mock("@/lib/auth/server",()=>({requireAdminApiAuth:vi.fn()}));
vi.mock("@/lib/cache/public-cache",()=>({revalidateAllPublicContent:vi.fn()}));
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
const config={enabled:true, defaultEffect:"random", durationMs:550, overrides:{"c-0123456789abcdef":"from-left"},revision:""};
const req=(body:unknown)=>new Request("http://localhost/api/admin/card-motion",{method:"PUT",headers:{"content-type":"application/json",origin:"http://localhost",host:"localhost"},body:JSON.stringify(body)});
function fakeCards(ids:string[],section="section-1") {
 const nodes=ids.map(id=>({dataset:{cardMotionId:id},closest:()=>({dataset:{veSectionId:section}}),querySelector:()=>({textContent:`title of ${id}`})}));
 return {doc:{getElementById:()=>({querySelectorAll:()=>nodes})} as unknown as Document,nodes};
}
describe("public card motion settings",()=>{
 it("normalizes invalid effects and values",()=>{
  expect(normalizeCardMotion({defaultEffect:"evil",durationMs:40000,overrides:{"bad":"pop","c-0123456789abcdef":"pop"}})).toMatchObject({defaultEffect:"random",durationMs:550,overrides:{"c-0123456789abcdef":"pop"}});
 });
 it("uses explicit card and section identity, independent of position and title; flags duplicates",()=>{
  const first=fakeCards(["record:a","record:b"]),second=fakeCards(["record:b","record:a","record:c"]);
  const a=findPublicCards(first.doc,"/blog"),b=findPublicCards(second.doc,"/blog");
  expect(a[0].id).toBe(b[1].id);expect(a[1].id).toBe(b[0].id);expect(a[0].id).not.toBe(b[0].id);
  expect(findPublicCards(fakeCards(["record:a"],"section-2").doc,"/blog")[0].id).not.toBe(a[0].id);
  expect(findPublicCards(fakeCards(["record:a"]).doc,"/work")[0].id).not.toBe(a[0].id);
  expect(findPublicCards(fakeCards(["same","same"]).doc,"/blog").every(x=>x.duplicate)).toBe(true);
 });
 it("requires theme permission, validates input, and detects conflicting saves",async()=>{
  vi.mocked(requireAdminApiAuth).mockResolvedValueOnce({ok:false,response:new Response(null,{status:403})} as never);
  expect((await PUT(req(config))).status).toBe(403);
  const settings=createInitialSeedSnapshot().siteSettings;
  vi.mocked(requireAdminApiAuth).mockResolvedValue({ok:true,user:{id:"u",email:"admin@invalid.test",role:"SUPER_ADMIN"},settings} as never);
  const save=vi.spyOn(db,"saveCardMotion").mockResolvedValue(false);
  expect((await PUT(req({...config,durationMs:9999}))).status).toBe(400);expect(save).not.toHaveBeenCalled();
  expect((await PUT(req(config))).status).toBe(409);
  save.mockResolvedValue(true);vi.spyOn(db,"recordAuditLog").mockRejectedValue(new Error("audit unavailable"));
  const response=await PUT(req(config));expect(response.status).toBe(200);expect((await response.json()).auditRecorded).toBe(false);
  vi.spyOn(db,"getCardMotion").mockResolvedValue(normalizeCardMotion(config));
  expect((await GET(new Request("http://localhost/api/admin/card-motion"))).status).toBe(200);
 });
 it("stores independently, preserves settings and backup export, rejects stale revision in local dev",async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"card-motion-"));
  try{
   vi.stubEnv("OMNIFLOW_LOCAL_DB_PATH",path.join(dir,"db.json"));vi.stubEnv("DATABASE_URL","");vi.stubEnv("NODE_ENV","test");
   const old=await db.getSiteSettings();const value=normalizeCardMotion({...config,revision:"abcd"});
   expect(await db.saveCardMotion(value,"")).toBe(true);
   expect(await db.getCardMotion()).toEqual(value);expect(await db.getSiteSettings()).toEqual(old);
   expect(await db.saveCardMotion({...value,revision:"beef"},"")).toBe(false);
   expect((await db.exportSnapshot()).snapshot.cardMotion).toEqual(value);
   const backup = await db.createBackup({label:"motion test",createdBy:"test"});
   expect(await db.saveCardMotion({...value,defaultEffect:"none",revision:"beef"},"abcd")).toBe(true);
   await db.restoreBackup(backup.id,"test");
   const restored = await db.getCardMotion();
   expect(restored.defaultEffect).toBe("random");
   expect(restored.revision).not.toBe("abcd");
   expect(await db.saveCardMotion({...value,revision:"eeee"},"abcd")).toBe(false);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
 });
});
