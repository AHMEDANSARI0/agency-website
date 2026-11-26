import { describe, expect, it, vi } from "vitest";
import {
  ALLOWED_MEDIA_EXTENSIONS,
  ALLOWED_MEDIA_MIME_TYPES,
  storeMediaFile,
  validateMediaUpload,
} from "@/features/media/storage";

const svgInputs = [
  '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><a href="jav&#x61;script:alert(1)"><text>click</text></a></svg>',
  '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>',
  '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://attacker.invalid/x"/></svg>',
];
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a0sAAAAASUVORK5CYII=", "base64");

describe("SVG upload policy", () => {
  it("removes SVG from the advertised upload allowlist", () => {
    expect(ALLOWED_MEDIA_MIME_TYPES).not.toContain("image/svg+xml");
    expect(ALLOWED_MEDIA_EXTENSIONS).not.toContain("svg");
  });
  it("rejects clean and malicious SVG, regardless of declared XML type or case", () => {
    for (const svg of svgInputs) {
      for (const mime of ["image/svg+xml", "IMAGE/SVG+XML", "application/xml", "text/xml", "image/png"]) {
        expect(validateMediaUpload(mime, Buffer.from(svg), "graphic.svg").valid).toBe(false);
      }
    }
    expect(validateMediaUpload("image/svg+xml", Buffer.from(svgInputs[0]!), "graphic").valid).toBe(false);
    expect(validateMediaUpload("image/svg+xml", Buffer.from(svgInputs[0]!), "graphic.svgz").valid).toBe(false);
  });
  it("still accepts a PNG and rejects mismatched filename or binary header", () => {
    expect(validateMediaUpload("image/png", png, "graphic.png").valid).toBe(true);
    expect(validateMediaUpload("image/png", png, "graphic.svg").valid).toBe(false);
    expect(validateMediaUpload("image/png", Buffer.from(svgInputs[0]!), "graphic.png").valid).toBe(false);
  });
  it("prevents direct storage callers from bypassing the policy", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(storeMediaFile({ originalName: "test.svg", mimeType: "image/svg+xml", ext: "svg", buffer: Buffer.from(svgInputs[0]!) })).rejects.toThrow("rejected");
    await expect(storeMediaFile({ originalName: "test.png", mimeType: "image/png", ext: "svg", buffer: png })).rejects.toThrow("rejected");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
