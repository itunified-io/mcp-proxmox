import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import { handleVmsTool } from "../../src/tools/vms.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxmox_vm_list", () => {
  const resources = [
    { id: "qemu/100", type: "qemu", node: "pve1", vmid: 100, name: "vm-alpha" },
    { id: "lxc/200", type: "lxc", node: "pve1", vmid: 200, name: "ct-beta" },
    { id: "qemu/101", type: "qemu", node: "pve2", vmid: 101, name: "vm-gamma" },
  ];

  it("filters to qemu type only", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(resources);

    const result = await handleVmsTool("proxmox_vm_list", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/resources?type=vm");
    const vms = JSON.parse(result.content[0].text);
    expect(vms).toHaveLength(2);
    expect(vms.every((v: { type: string }) => v.type === "qemu")).toBe(true);
  });

  it("filters by node when node is provided", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(resources);

    const result = await handleVmsTool("proxmox_vm_list", { node: "pve1" }, mockClient);

    const vms = JSON.parse(result.content[0].text);
    expect(vms).toHaveLength(1);
    expect(vms[0].name).toBe("vm-alpha");
  });
});

describe("proxmox_vm_status", () => {
  it("calls correct endpoint with node and vmid", async () => {
    const status = { vmid: 100, name: "vm-alpha", status: "running", cpu: 0.1 };
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(status);

    const result = await handleVmsTool("proxmox_vm_status", { node: "pve1", vmid: 100 }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/qemu/100/status/current");
    expect(JSON.parse(result.content[0].text)).toEqual(status);
  });

  it("rejects vmid below 100", async () => {
    await expect(
      handleVmsTool("proxmox_vm_status", { node: "pve1", vmid: 99 }, mockClient),
    ).rejects.toThrow();
  });
});

describe("proxmox_vm_config", () => {
  it("calls correct endpoint", async () => {
    const config = { name: "vm-alpha", memory: 2048, cores: 2, ostype: "l26" };
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(config);

    const result = await handleVmsTool("proxmox_vm_config", { node: "pve1", vmid: 100 }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/qemu/100/config");
    expect(JSON.parse(result.content[0].text)).toEqual(config);
  });
});

describe("proxmox_vm_snapshots", () => {
  it("calls correct endpoint", async () => {
    const snapshots = [{ name: "snap1", snaptime: 1712700000 }, { name: "current", parent: "snap1" }];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(snapshots);

    const result = await handleVmsTool("proxmox_vm_snapshots", { node: "pve1", vmid: 100 }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/qemu/100/snapshot");
    expect(JSON.parse(result.content[0].text)).toHaveLength(2);
  });
});

describe("proxmox_vm_rrd", () => {
  it("calls correct endpoint with default timeframe", async () => {
    const rrd = [{ time: 1712700000, cpu: 0.1 }];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(rrd);

    const result = await handleVmsTool("proxmox_vm_rrd", { node: "pve1", vmid: 100 }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/qemu/100/rrddata?timeframe=hour");
    expect(JSON.parse(result.content[0].text)).toEqual(rrd);
  });

  it("passes custom timeframe", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleVmsTool("proxmox_vm_rrd", { node: "pve1", vmid: 100, timeframe: "day" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/qemu/100/rrddata?timeframe=day");
  });

  it("rejects invalid timeframe", async () => {
    await expect(
      handleVmsTool("proxmox_vm_rrd", { node: "pve1", vmid: 100, timeframe: "decade" }, mockClient),
    ).rejects.toThrow();
  });
});

describe("unknown tool", () => {
  it("returns unknown tool message", async () => {
    const result = await handleVmsTool("proxmox_vm_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_vm_unknown");
  });
});
