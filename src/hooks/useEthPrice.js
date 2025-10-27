// /src/hooks/useEthPrice.js
import { useEffect, useState } from "react";

export default function useEthPrice() {
  const [price, setPrice] = useState(null);   // số (vd 3025.73)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const data = await res.json();
        if (data?.ethereum?.usd) setPrice(Number(data.ethereum.usd));
      } catch (e) {
        console.error("Fetch ETH price error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPrice();
    const iv = setInterval(fetchPrice, 10 * 60 * 1000); // 10 phút 1 lần
    return () => clearInterval(iv);
  }, []);

  return { price, loading };
}
