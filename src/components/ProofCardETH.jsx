import { QRCodeSVG } from "qrcode.react";
import useEthPrice from "../hooks/useEthPrice";

export default function ProofCardETH({
  username = "Neo",
  amount = "0.124",
  token = "ETH",
  address = "0xABCD...1234",
  theme = "obsidianGold",
  nodeId = "0237",
  rank,
  autoRank = true,
}) {
  // ---- Parse amount ----
  const amountNum = Number.parseFloat(String(amount).replace(/[^\d.]/g, ""));
  const safeAmount =
    Number.isFinite(amountNum) && amountNum > 0 ? amountNum : 0;

  // ---- ETH price realtime ----
  const { price: ethPrice, loading } = useEthPrice();
  const valueInUSDT = ethPrice ? safeAmount * ethPrice : null;
  const valueText =
    valueInUSDT == null
      ? "Updating..."
      : valueInUSDT < 0.01
        ? valueInUSDT.toFixed(4)
        : valueInUSDT.toFixed(2);

  // ---- Auto Rank ----
  const autoRankName =
    safeAmount >= 1
      ? "ELITE"
      : safeAmount >= 0.2
        ? "PRO"
        : safeAmount > 0
          ? "EARLY"
          : "NEW";
  const finalRank = rank || (autoRank ? autoRankName : undefined);

  // ---- Color Palettes ----
  const palettes = {
    // 🔵 Cyber Blue – hiện đại, năng lượng, dễ đọc
    cyberBlue: {
      bg: "linear-gradient(180deg, #030712 0%, #001b3d 100%)",
      shadow:
        "0 0 80px rgba(0,180,255,0.3), inset 0 0 50px rgba(0,180,255,0.15)",
      border: "1px solid rgba(0,200,255,0.3)",
      primary: "#7ed4ff",
      accent: "#00f6ff",
      secondary: "#a8f3ff",
      qr: "#00d0ff",
      badgeBg: "rgba(0,200,255,0.12)",
      badgeStroke: "rgba(0,200,255,0.35)",
      badgeText: "#00d0ff",
    },

    // 🟡 Obsidian Gold – quyền lực, crypto luxury
    obsidianGold: {
      bg: "linear-gradient(180deg, #000000 0%, #1a1205 100%)",
      shadow:
        "0 0 80px rgba(255,215,0,0.28), inset 0 0 50px rgba(255,200,0,0.12)",
      border: "1px solid rgba(255,215,0,0.3)",
      primary: "#ffeb99",
      accent: "#ffd700",
      secondary: "#fff2cc",
      qr: "#ffe066",
      badgeBg: "rgba(255,215,0,0.12)",
      badgeStroke: "rgba(255,215,0,0.35)",
      badgeText: "#ffda66",
    },

    // ✨ Black & Gold Deluxe – đen ánh vàng hồng sang trọng
    blackGoldDeluxe: {
      bg: "linear-gradient(180deg,#000000 0%,#1a0f05 100%)",
      shadow:
        "0 0 90px rgba(255,180,100,0.3), inset 0 0 50px rgba(255,150,80,0.15)",
      border: "1px solid rgba(255,200,120,0.35)",
      primary: "#ffe9c6",
      accent: "#ffcc80",
      secondary: "#fff1d0",
      qr: "#ffbb66",
      badgeBg: "rgba(255,190,100,0.12)",
      badgeStroke: "rgba(255,190,100,0.35)",
      badgeText: "#ffcc80",
    },
  };

  const p = palettes[theme] || palettes.cyberBlue;
  const refLink = `https://bravium.tech/invite?ref=${address}`;

  // ---- Shared Badge Style ----
  const badgeStyle = {
    background: p.badgeBg,
    border: p.badgeStroke,
    borderWidth: "1px",
    color: p.badgeText,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    minWidth: 120,
    padding: "0 8px",
    borderRadius: 6,
    lineHeight: "28px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  return (
    <div
      id="proof-card"
      className="relative w-[380px] h-[420px] md:w-[500px] md:h-[500px] rounded-2xl overflow-hidden flex flex-col items-center justify-center scale-[0.95]"
      style={{
        background: p.bg,
        boxShadow: p.shadow,
        border: p.border,
      }}
    >
      {/* Overlay ring nhẹ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 60%)",
          mixBlendMode: "screen",
        }}
      />

      {/* LEFT BADGE: Rank / Node */}
      <div className="absolute top-5 left-5 flex gap-2">
        <div style={badgeStyle}>{finalRank ? `${finalRank} NODE` : "NODE"}</div>
        <div style={{ ...badgeStyle, minWidth: 70 }}>#{nodeId}</div>
      </div>

      {/* RIGHT BADGE: AI VERIFIED */}
      <div className="absolute top-5 right-5" style={badgeStyle}>
        AI VERIFIED
      </div>

      {/* MAIN NUMBERS */}
      <h1
        className="text-4xl md:text-5xl font-extrabold mb-1"
        style={{
          color: p.primary,
          textShadow: "0 0 14px rgba(126,224,255,0.35)",
        }}
      >
        +{safeAmount} {token}
      </h1>

      <p
        className="text-2xl font-semibold mb-3"
        style={{
          color: p.accent,
          textShadow: "0 0 10px rgba(0,255,224,0.35)",
        }}
      >
        {loading ? "≈ Updating..." : `≈ ${valueText} USDT`}
      </p>

      <p className="text-xl mb-4" style={{ color: p.secondary }}>
        Earned via Bravium AI Node
      </p>

      <img
        src="/assets/bravium-logo.png"
        alt="Bravium"
        className="w-32 opacity-95 mb-4"
        draggable={false}
      />

      {/* QR + Link */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3">
        <QRCodeSVG
          value={refLink}
          size={60}
          bgColor="transparent"
          fgColor={p.qr}
        />
        <div>
          <p className="text-sm" style={{ color: p.secondary }}>
            Proof of Earn — {username}
          </p>
          <p className="text-xs" style={{ color: p.secondary }}>
            {refLink}
          </p>
        </div>
      </div>
    </div>
  );
}
