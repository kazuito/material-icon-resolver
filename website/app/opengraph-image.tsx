import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background:
          "radial-gradient(circle at 20% 0%, #1a1a1a 0%, #0a0a0a 60%), #0a0a0a",
        color: "#fafafa",
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 22,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(250, 250, 250, 0.55)",
        }}
      >
        <span
          style={{
            display: "flex",
            width: 10,
            height: 10,
            background: "#b6f045",
            borderRadius: 2,
          }}
        />
        material-icon-theme · resolver
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            color: "#fafafa",
          }}
        >
          material-icon-resolver
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            lineHeight: 1.35,
            color: "rgba(250, 250, 250, 0.7)",
            maxWidth: 980,
          }}
        >
          Resolve Material Icon Theme icon names, filenames, and CDN URLs from
          any file path, folder path, or language id.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: 24,
          color: "rgba(250, 250, 250, 0.55)",
        }}
      >
        <div style={{ display: "flex", gap: 28 }}>
          <span style={{ color: "#b6f045" }}>$ npm i material-icon-resolver</span>
        </div>
        <div style={{ display: "flex", color: "rgba(250, 250, 250, 0.45)" }}>
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
