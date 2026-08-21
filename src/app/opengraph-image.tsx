import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ARTIST } from "@/data/artist";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

export const dynamic = "force-static";
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const iconBuffer = await readFile(join(process.cwd(), "src/app/icon.png"));
  const iconSrc = `data:image/png;base64,${iconBuffer.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background:
          "linear-gradient(135deg, #000000 0%, #1a0b2e 55%, #411d63 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          marginBottom: 40,
        }}
      >
        <img
          src={iconSrc}
          alt=""
          width={96}
          height={96}
          style={{ borderRadius: 24 }}
        />
        <div
          style={{
            display: "flex",
            padding: "8px 22px",
            borderRadius: 999,
            border: "1px solid rgba(225,71,191,0.5)",
            color: "#f2a6df",
            fontSize: 26,
            letterSpacing: 4,
          }}
        >
          UNOFFICIAL FAN GUIDE
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 76, fontWeight: 800 }}>
        {ARTIST.name.jp}
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 34,
          marginTop: 16,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        {ARTIST.name.kr} · {ARTIST.name.en}
      </div>

      <div
        style={{
          display: "flex",
          maxWidth: 900,
          fontSize: 28,
          marginTop: 48,
          color: "#c294f0",
        }}
      >
        {SITE_DESCRIPTION}
      </div>
    </div>,
    { ...size },
  );
}
