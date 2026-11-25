"use client";

import React from "react";

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#07030D",
          color: "#F5F0FF",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Inter, sans-serif",
          padding: "24px",
        }}
      >
        <main
          role="alert"
          style={{
            maxWidth: "480px",
            width: "100%",
            backgroundColor: "#120A1F",
            border: "1px solid #2B1B45",
            borderRadius: "20px",
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#B3A5CC",
            }}
          >
            OmniFlow · Temporary Interruption
          </p>
          <h1
            style={{
              marginTop: "12px",
              marginBottom: "12px",
              fontSize: "24px",
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            We ran into an unexpected error.
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#B3A5CC",
            }}
          >
            Please refresh the page or return to the homepage.
          </p>
          {error?.digest ? (
            <p
              style={{
                marginTop: "16px",
                fontSize: "12px",
                color: "#8E7FAA",
                fontFamily: "monospace",
              }}
            >
              Ref: {error.digest}
            </p>
          ) : null}
          <div
            style={{
              marginTop: "28px",
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: "44px",
                padding: "10px 22px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#9333EA",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                minHeight: "44px",
                padding: "10px 22px",
                borderRadius: "999px",
                border: "1px solid #2B1B45",
                backgroundColor: "#160C26",
                color: "#F5F0FF",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Back to Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
