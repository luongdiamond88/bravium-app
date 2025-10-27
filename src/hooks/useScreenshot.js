import html2canvas from "html2canvas";
import { useState } from "react";

export default function useScreenshot() {
  const [loading, setLoading] = useState(false);

  const capture = async (elementId) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const target = document.getElementById(elementId);
    console.log("🎯 Capturing:", target);

    if (!target) {
      alert("Không tìm thấy phần tử để chụp: " + elementId);
      setLoading(false);
      return null;
    }

    try {
      const cloned = target.cloneNode(true);
      cloned.id = "capture-temp";
      cloned.style.position = "absolute";
      cloned.style.left = "-9999px";
      cloned.style.top = "0";
      cloned.style.opacity = "1";
      cloned.style.boxShadow = "none";
      cloned.style.filter = "none";
      cloned.style.background = "#0b0912";
      document.body.appendChild(cloned);

      const canvas = await html2canvas(cloned, {
        useCORS: true,
        backgroundColor: "#0b0912",
        scale: 2,
        logging: false,
        onclone: (doc) => {
          const el = doc.getElementById("capture-temp");
          if (el) {
            el.style.background = "linear-gradient(180deg, #0b0912 0%, #1b0c2e 100%)";
            el.style.boxShadow = "none";
          }
        },
      });

      document.body.removeChild(cloned);

      const dataUrl = canvas.toDataURL("image/png");
      console.log("✅ Capture OK!");
      setLoading(false);
      return dataUrl;
    } catch (err) {
      console.error("❌ Lỗi khi chụp:", err);
      alert("Không thể chụp hình — kiểm tra console để xem chi tiết.");
      setLoading(false);
      return null;
    }
  };

  return { capture, loading };
}
