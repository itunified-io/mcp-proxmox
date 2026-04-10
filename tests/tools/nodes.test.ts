import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import { handleNodesTool } from "../../src/tools/nodes.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxmox_node_list", () => {
  it("calls /nodes and returns results", async () => {
    const nodes = [{ node: "pve1", status: "online", cpu: 0.1, maxcpu: 4, mem: 1000, maxmem: 8000, disk: 50, maxdisk: 200, uptime: 3600 }];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(nodes);

    const result = await handleNodesTool("proxmox_node_list", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes");
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(nodes);
  });
});

describe("proxmox_node_status", () => {
  it("calls correct endpoint with node param", async () => {
    const status = { node: "pve1", cpu: 0.2, uptime: 7200, memory: { free: 4000, total: 8000, used: 4000 } };
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(status);

    const result = await handleNodesTool("proxmox_node_status", { node: "pve1" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/status");
    expect(JSON.parse(result.content[0].text)).toEqual(status);
  });

  it("rejects invalid node name", async () => {
    await expect(
      handleNodesTool("proxmox_node_status", { node: "invalid node!" }, mockClient),
    ).rejects.toThrow();
  });
});

describe("proxmox_node_resources", () => {
  it("computes resource percentages from raw status", async () => {
    const status = {
      node: "pve1",
      cpu: 0.5,
      uptime: 7200,
      loadavg: ["0.5", "0.6", "0.7"],
      memory: { free: 2 * 1073741824, total: 8 * 1073741824, used: 6 * 1073741824 },
      rootfs: { avail: 50 * 1073741824, free: 50 * 1073741824, total: 100 * 1073741824, used: 50 * 1073741824 },
    };
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(status);

    const result = await handleNodesTool("proxmox_node_resources", { node: "pve1" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/status");
    const resources = JSON.parse(result.content[0].text);
    expect(resources.cpu_percent).toBeCloseTo(50, 5);
    expect(resources.memory_used_gb).toBeCloseTo(6, 5);
    expect(resources.memory_total_gb).toBeCloseTo(8, 5);
    expect(resources.memory_percent).toBeCloseTo(75, 5);
    expect(resources.rootfs_used_gb).toBeCloseTo(50, 5);
    expect(resources.rootfs_total_gb).toBeCloseTo(100, 5);
    expect(resources.rootfs_percent).toBeCloseTo(50, 5);
    expect(resources.uptime_hours).toBeCloseTo(2, 5);
    expect(resources.node).toBe("pve1");
    expect(resources.load_average).toEqual(["0.5", "0.6", "0.7"]);
  });

  it("handles missing memory/rootfs gracefully with zeros", async () => {
    const status = { node: "pve1", cpu: 0, uptime: 0 };
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(status);

    const result = await handleNodesTool("proxmox_node_resources", { node: "pve1" }, mockClient);
    const resources = JSON.parse(result.content[0].text);

    expect(resources.cpu_percent).toBe(0);
    expect(resources.memory_percent).toBe(0);
    expect(resources.rootfs_percent).toBe(0);
  });
});

describe("proxmox_node_networks", () => {
  it("returns all interfaces without type filter", async () => {
    const ifaces = [
      { iface: "eth0", type: "eth" },
      { iface: "vmbr0", type: "bridge" },
    ];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(ifaces);

    const result = await handleNodesTool("proxmox_node_networks", { node: "pve1" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/network");
    expect(JSON.parse(result.content[0].text)).toHaveLength(2);
  });

  it("filters results by type when type is provided", async () => {
    const ifaces = [
      { iface: "eth0", type: "eth" },
      { iface: "vmbr0", type: "bridge" },
    ];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(ifaces);

    const result = await handleNodesTool("proxmox_node_networks", { node: "pve1", type: "bridge" }, mockClient);

    const filtered = JSON.parse(result.content[0].text);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].iface).toBe("vmbr0");
  });
});

describe("proxmox_node_disks", () => {
  it("calls correct endpoint", async () => {
    const disks = [{ devpath: "/dev/sda", type: "ssd", size: 500 * 1073741824 }];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(disks);

    const result = await handleNodesTool("proxmox_node_disks", { node: "pve1" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/disks/list");
    expect(JSON.parse(result.content[0].text)).toEqual(disks);
  });
});

describe("proxmox_node_apt_updates", () => {
  it("calls correct endpoint", async () => {
    const updates = [{ Package: "pve-kernel", Version: "6.8.12" }];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(updates);

    const result = await handleNodesTool("proxmox_node_apt_updates", { node: "pve1" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/apt/update");
    expect(JSON.parse(result.content[0].text)).toEqual(updates);
  });
});

describe("unknown tool", () => {
  it("returns unknown tool message", async () => {
    const result = await handleNodesTool("proxmox_node_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_node_unknown");
  });
});
