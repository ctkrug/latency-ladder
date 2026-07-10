import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/benchmarks/cache", () => ({ benchmarkCache: vi.fn() }));
vi.mock("../src/benchmarks/ram", () => ({ benchmarkRam: vi.fn() }));
vi.mock("../src/benchmarks/indexeddb", () => ({ benchmarkIndexedDb: vi.fn() }));
vi.mock("../src/benchmarks/network", () => ({ benchmarkNetwork: vi.fn() }));

import { benchmarkCache } from "../src/benchmarks/cache";
import { benchmarkIndexedDb } from "../src/benchmarks/indexeddb";
import { benchmarkNetwork } from "../src/benchmarks/network";
import { benchmarkRam } from "../src/benchmarks/ram";
import { runLadder } from "../src/benchmarks";

describe("runLadder", () => {
  beforeEach(() => {
    vi.mocked(benchmarkCache).mockReset();
    vi.mocked(benchmarkRam).mockReset();
    vi.mocked(benchmarkIndexedDb).mockReset();
    vi.mocked(benchmarkNetwork).mockReset();
  });

  it("sorts successful tiers ascending by latency regardless of definition order", async () => {
    vi.mocked(benchmarkCache).mockResolvedValue(50);
    vi.mocked(benchmarkRam).mockResolvedValue(5);
    vi.mocked(benchmarkIndexedDb).mockResolvedValue(5_000_000);
    vi.mocked(benchmarkNetwork).mockResolvedValue(50_000_000);

    const ladder = await runLadder();

    expect(ladder.map((r) => r.label)).toEqual(["RAM", "Cache", "IndexedDB", "Network"]);
    ladder.forEach((r) => expect(r.error).toBeNull());
  });

  it("keeps other tiers rendering when one tier rejects", async () => {
    vi.mocked(benchmarkCache).mockResolvedValue(50);
    vi.mocked(benchmarkRam).mockRejectedValue(new Error("WebAssembly unsupported in this browser"));
    vi.mocked(benchmarkIndexedDb).mockResolvedValue(5_000_000);
    vi.mocked(benchmarkNetwork).mockResolvedValue(50_000_000);

    const ladder = await runLadder();

    const ram = ladder.find((r) => r.label === "RAM")!;
    expect(ram.error).toBe("WebAssembly unsupported in this browser");
    expect(ram.nsPerAccess).toBeNull();

    const ok = ladder.filter((r) => r.error === null);
    expect(ok.map((r) => r.label)).toEqual(["Cache", "IndexedDB", "Network"]);
  });

  it("places all-failed tiers after all successful ones", async () => {
    vi.mocked(benchmarkCache).mockRejectedValue(new Error("cache boom"));
    vi.mocked(benchmarkRam).mockResolvedValue(5);
    vi.mocked(benchmarkIndexedDb).mockRejectedValue(new Error("idb boom"));
    vi.mocked(benchmarkNetwork).mockResolvedValue(50_000_000);

    const ladder = await runLadder();

    expect(ladder[0]!.error).toBeNull();
    expect(ladder[1]!.error).toBeNull();
    expect(ladder[2]!.error).not.toBeNull();
    expect(ladder[3]!.error).not.toBeNull();
  });
});
