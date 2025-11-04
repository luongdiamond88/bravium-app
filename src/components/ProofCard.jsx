// /src/components/ProofCard.jsx
import { QRCodeSVG } from "qrcode.react";

export default function ProofCard({
  username = "Neo",
  amount = "0.127",
  token = "BRC",
  address = "0xABCD...1234",
  theme = "plasma",
  brcPrice, // cho phép cha truyền nhưng ta sẽ ép fallback cứng
}) {
  // 1) Rút số tuyệt đối từ amount, kể cả khi amount là "6.000 BRC" hay "6,000"
  const raw = String(amount).replace(/[^\d.]/g, ""); // chỉ giữ số & dấu .
  const amountNum = Number.parseFloat(raw);
  const safeAmount =
    Number.isFinite(amountNum) && amountNum > 0 ? amountNum : 0;

  // 2) Giá BRC/USDT: ưu tiên prop nếu là số dương, còn lại dùng 0.08 cứng
  const priceNum = Number(brcPrice);
  const price = Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 0.08;

  // 3) Tính USDT an toàn
  const valueInUSDT =
    safeAmount * price < 0.01
      ? (safeAmount * price).toFixed(4)
      : (safeAmount * price).toFixed(2);

  // Debug một lần là biết ngay
  console.log(
    "💰 ProofCard(BRC) → amount:",
    amount,
    "| parsed:",
    safeAmount,
    "| price:",
    price,
    "| usdt:",
    valueInUSDT,
  );

  const refLink = `https://bravium.tech/invite?ref=${address}`;

  const backgroundMap = {
    plasma: "linear-gradient(180deg, #000000 0%, #021c1a 50%, #041a18 100%)",
    obsidian: "linear-gradient(180deg, #0b0f14 0%, #0e0e0f 50%, #0b0f14 100%)",
    genesis: "linear-gradient(180deg, #0b0912 0%, #1b0c2e 100%)",
  };
  const background = backgroundMap[theme] || backgroundMap.genesis;

  return (
    <div
      id="proof-card"
      className="relative w-[380px] h-[420px] md:w-[500px] md:h-[500px] rounded-2xl overflow-hidden flex flex-col items-center justify-center scale-[0.95]"
      style={{
        background,
        boxShadow: "0 0 60px rgba(164,244,217,0.2)",
      }}
    >
      <h1 className="text-4xl md:text-5xl font-bold text-[#a4f4d9] mb-1">
        +{safeAmount} {token}
      </h1>
      <p className="text-[#f9d67a] text-2xl font-semibold mb-3">
        ≈ {valueInUSDT} USDT
      </p>
      <p className="text-[#7ceee0] text-xl mb-4">Earned via Bravium</p>
      <img
        src="/assets/bravium-logo.png"
        alt="Bravium"
        className="w-32 opacity-90 mb-4"
      />
      <div className="absolute bottom-6 left-6 flex items-center gap-3">
        <QRCodeSVG
          value={refLink}
          size={60}
          bgColor="transparent"
          fgColor="#a4f4d9"
        />
        <div>
          <p className="text-[#bdeee0] text-sm">Proof of Earn — {username}</p>
          <p className="text-[#7ceee0] text-xs">{refLink}</p>
        </div>
      </div>
    </div>
  );
}
