import { useEffect, useState } from "react";

type Stats = {
  cpu: number;
  gpu: number | null;
  ram: { totalGiB: number; usedGiB: number; percent: number; };
};

export function useSystemStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    if (!('qc' in window)) return;
    // @ts-ignore
    const off = window.qc.onSystemStats((s: Stats) => setStats(s));
    return () => { if (typeof off === 'function') off(); };
  }, []);
  return stats;
}