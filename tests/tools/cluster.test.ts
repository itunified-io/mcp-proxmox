import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import { handleClusterTool } from "../../src/tools/cluster.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxmox_cluster_status", () => {
  it("calls /cluster/status and returns results", async () => {
    const status = [
      { type: "cluster", id: "cluster", name: "pve-cluster" },
      { type: "node", id: "node/pve1", name: "pve1", online: 1 },
    ];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(status);

    const result = await handleClusterTool("proxmox_cluster_status", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/status");
    expect(JSON.parse(result.content[0].text)).toEqual(status);
  });
});

describe("proxmox_cluster_resources", () => {
  it("calls /cluster/resources without filter when no type specified", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleClusterTool("proxmox_cluster_resources", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/resources");
  });

  it("appends type filter to URL when specified", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleClusterTool("proxmox_cluster_resources", { type: "vm" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/resources?type=vm");
  });

  it("returns resources array", async () => {
    const resources = [
      { id: "qemu/100", type: "qemu", node: "pve1" },
      { id: "storage/local", type: "storage", node: "pve1" },
    ];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(resources);

    const result = await handleClusterTool("proxmox_cluster_resources", {}, mockClient);

    expect(JSON.parse(result.content[0].text)).toHaveLength(2);
  });
});

describe("proxmox_cluster_tasks", () => {
  it("calls correct endpoint with default limit", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleClusterTool("proxmox_cluster_tasks", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/tasks?limit=50");
  });

  it("passes custom limit", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleClusterTool("proxmox_cluster_tasks", { limit: 100 }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/tasks?limit=100");
  });

  it("rejects limit above 500", async () => {
    await expect(
      handleClusterTool("proxmox_cluster_tasks", { limit: 501 }, mockClient),
    ).rejects.toThrow();
  });

  it("returns tasks array", async () => {
    const tasks = [
      { upid: "UPID:pve1:0000A1B2:00001234:6617A210:vzdump:100:root@pam:", node: "pve1", type: "vzdump", starttime: 1712700000, user: "root@pam" },
    ];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(tasks);

    const result = await handleClusterTool("proxmox_cluster_tasks", {}, mockClient);

    expect(JSON.parse(result.content[0].text)).toEqual(tasks);
  });
});

describe("proxmox_cluster_log", () => {
  it("calls correct endpoint with default max", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleClusterTool("proxmox_cluster_log", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/log?max=50");
  });

  it("passes custom max", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleClusterTool("proxmox_cluster_log", { max: 200 }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/log?max=200");
  });
});

describe("unknown tool", () => {
  it("returns unknown tool message", async () => {
    const result = await handleClusterTool("proxmox_cluster_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_cluster_unknown");
  });
});
