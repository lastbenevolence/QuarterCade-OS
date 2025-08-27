import fs from "node:fs";

let timer = null;
let lastIdle = 0, lastTotal = 0;

function readCPU() {
  const stat = fs.readFileSync("/proc/stat", "utf8").split("\n")[0].trim().split(/\s+/);
  const nums = stat.slice(1).map(Number);
  const idle = nums[3] + nums[4];
  const total = nums.reduce((a, b) => a + b, 0);
  const diffIdle = idle - lastIdle;
  const diffTotal = total - lastTotal;
  const usage = diffTotal > 0 ? (100 * (diffTotal - diffIdle) / diffTotal) : 0;
  lastIdle = idle; lastTotal = total;
  return Math.max(0, Math.min(100, Math.round(usage)));
}

function readRAM() {
  const m = Object.fromEntries(
    fs.readFileSync("/proc/meminfo", "utf8")
      .split("\n").filter(Boolean)
      .map(line => {
        const [k, v] = line.split(":");
        return [k.trim(), parseInt(v)];
      })
  );
  const total = m.MemTotal * 1024;
  const avail = m.MemAvailable * 1024;
  const used = total - avail;
  return {
    totalGiB: +(total / (1024**3)).toFixed(1),
    usedGiB: +(used / (1024**3)).toFixed(1),
    percent: Math.round(100 * used / total)
  };
}

function readGPU() {
  try {
    const p = "/sys/class/drm/card0/device/gpu_busy_percent";
    const val = fs.readFileSync(p, "utf8").trim();
    const n = Number(val);
    if (!Number.isNaN(n)) return Math.max(0, Math.min(100, n));
  } catch {}
  return null;
}

export function startStatsLoop(push) {
  readCPU();
  timer = setInterval(() => {
    const cpu = readCPU();
    const ram = readRAM();
    const gpu = readGPU();
    push({ cpu, gpu, ram });
  }, 1000);
}

export function stopStatsLoop() {
  if (timer) clearInterval(timer);
  timer = null;
}