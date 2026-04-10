import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import { handleContainersTool } from "../../src/tools/containers.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxmox_ct_list", () => {
  const resources = [
    { id: "lxc/200", type: "lxc", node: "pve1", vmid: 200, name: "ct-alpha" },
    { id: "qemu/100", type: "qemu", node: "pve1", vmid: 100, name: "vm-beta" },
    { id: "lxc/201", type: "lxc", node: "pve2", vmid: 201, name: "ct-gamma" },
  ];

  it("filters to lxc type only", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(resources);

    const result = await handleContainersTool("proxmox_ct_list", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/resources?type=vm");
    const cts = JSON.parse(result.content[0].text);
    expect(cts).toHaveLength(2);
    expect(cts.every((c: { type: string }) => c.type === "lxc")).toBe(true);
  });

  it("filters by node when provided", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(resources);

    const result = await handleContainersTool("proxmox_ct_list", { node: "pve2" }, mockClient);

    const cts = JSON.parse(result.content[0].text);
    expect(cts).toHaveLength(1);
    expect(cts[0].name).toBe("ct-gamma");
  });
});

describe("proxmox_ct_status", () => {
  it("calls correct LXC endpoint", async () => {
    const status = { vmid: 200, name: "ct-alpha", status: "running" };
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(status);

    const result = await handleContainersTool("proxmox_ct_status", { node: "pve1", vmid: 200 }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/lxc/200/status/current");
    expect(JSON.parse(result.content[0].text)).toEqual(status);
  });
});

describe("proxmox_ct_config", () => {
  it("calls correct LXC config endpoint", async () => {
    const config = { hostname: "ct-alpha", memory: 512, cores: 1 };
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(config);

    const result = await handleContainersTool("proxmox_ct_config", { node: "pve1", vmid: 200 }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/lxc/200/config");
    expect(JSON.parse(result.content[0].text)).toEqual(config);
  });
});

describe("proxmox_ct_snapshots", () => {
  it("calls correct snapshot endpoint", async () => {
    const snapshots = [{ name: "snap1", snaptime: 1712700000 }];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(snapshots);

    const result = await handleContainersTool("proxmox_ct_snapshots", { node: "pve1", vmid: 200 }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/lxc/200/snapshot");
    expect(JSON.parse(result.content[0].text)).toEqual(snapshots);
  });
});

describe("proxmox_ct_rrd", () => {
  it("calls correct endpoint with default timeframe", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleContainersTool("proxmox_ct_rrd", { node: "pve1", vmid: 200 }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/lxc/200/rrddata?timeframe=hour");
  });

  it("passes custom timeframe", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleContainersTool("proxmox_ct_rrd", { node: "pve1", vmid: 200, timeframe: "week" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/lxc/200/rrddata?timeframe=week");
  });

  it("rejects invalid vmid", async () => {
    await expect(
      handleContainersTool("proxmox_ct_rrd", { node: "pve1", vmid: 50 }, mockClient),
    ).rejects.toThrow();
  });
});

describe("unknown tool", () => {
  it("returns unknown tool message", async () => {
    const result = await handleContainersTool("proxmox_ct_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_ct_unknown");
  });
});
