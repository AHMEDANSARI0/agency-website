import { ImageResponse } from "next/og";
import { db } from "@/lib/database";

export const runtime = "nodejs";
export const alt = "OmniFlow — AI Automation & Business Solutions";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const settings = await db.getSiteSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F8FAFC",
          backgroundImage:
            "radial-gradient(circle at 18% 15%, rgba(79, 70, 229, 0.14), transparent 52%), radial-gradient(circle at 86% 12%, rgba(37, 99, 235, 0.12), transparent 48%)",
          padding: "68px 76px",
          fontFamily: "sans-serif",
          color: "#0B1120",
        }}
      >
        {/* Top Brand Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #4F46E5, #6366F1, #2563EB)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              O
            </div>
            <span
              style={{
                fontSize: "30px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#0B1120",
              }}
            >
              {settings.companyName}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: "#EEF2FF",
              border: "1px solid #C7D2FE",
              color: "#3730A3",
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {settings.targetMarkets.join(" · ")}
          </div>
        </div>

        {/* Center Narrative */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#4F46E5",
            }}
          >
            {settings.positioning}
          </div>
          <div
            style={{
              fontSize: "62px",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.038em",
              color: "#0B1120",
              maxWidth: "980px",
            }}
          >
            {settings.tagline}
          </div>
          <div
            style={{
              fontSize: "24px",
              lineHeight: 1.45,
              color: "#334155",
              maxWidth: "900px",
            }}
          >
            Lead qualification, grounded AI customer support, and deterministic workflow automation engineered with human-in-the-loop guardrails.
          </div>
        </div>

        {/* Bottom Architectural Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "24px",
            borderTop: "1px solid #CBD5E1",
            fontSize: "17px",
            color: "#475569",
          }}
        >
          <span>Principal Architect: {settings.founderName}</span>
          <span style={{ color: "#4338CA", fontWeight: 600 }}>
            100% Client IP Ownership · Deterministic Guardrails
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
