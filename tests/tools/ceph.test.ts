import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import { ProxmoxApiError } from "../../src/utils/errors.js";
import { cephToolDefinitions, handleCephTool } from "../../src/tools/ceph.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

describe("cephToolDefinitions", () => {
  it("exports 4 tool definitions", () => {
    expect(cephToolDefinitions).toHaveLength(4);
  });

  it("has correct tool names", () => {
    const names = cephToolDefinitions.map((t) => t.name);
    expect(names).toContain("proxmox_ceph_status");
    expect(names).toContain("proxmox_ceph_osd_list");
    expect(names).toContain("proxmox_ceph_pool_list");
    expect(names).toContain("proxmox_ceph_monitor_list");
  });
});

describe("handleCephTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxmox_ceph_status — calls correct endpoint and returns data", async () => {
    const mockStatus = { health: { status: "HEALTH_OK" } };
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockStatus);

    const result = await handleCephTool(
      "proxmox_ceph_status",
      { node: "pve01" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/ceph/status");
    expect(result.content[0].text).toBe(JSON.stringify(mockStatus, null, 2));
  });

  it("proxmox_ceph_status — returns friendly message on 501", async () => {
    vi.mocked(mockClient.get).mockRejectedValueOnce(
      new ProxmoxApiError("Not implemented", "GET /nodes/pve01/ceph/status", 501),
    );

    const result = await handleCephTool(
      "proxmox_ceph_status",
      { node: "pve01" },
      mockClient,
    );

    expect(result.content[0].text).toContain("Ceph is not available on node 'pve01'");
    expect(result.content[0].text).toContain("Ceph must be installed and configured");
  });

  it("proxmox_ceph_status — returns friendly message on 500 (binary not installed)", async () => {
    vi.mocked(mockClient.get).mockRejectedValueOnce(
      new ProxmoxApiError("binary not installed: /usr/bin/ceph", "GET /nodes/pve01/ceph/status", 500),
    );

    const result = await handleCephTool(
      "proxmox_ceph_status",
      { node: "pve01" },
      mockClient,
    );

    expect(result.content[0].text).toContain("Ceph is not available on node 'pve01'");
  });

  it("proxmox_ceph_status — rethrows non-500/501 errors", async () => {
    vi.mocked(mockClient.get).mockRejectedValueOnce(
      new ProxmoxApiError("Unauthorized", "GET /nodes/pve01/ceph/status", 403),
    );

    await expect(
      handleCephTool("proxmox_ceph_status", { node: "pve01" }, mockClient),
    ).rejects.toThrow(ProxmoxApiError);
  });

  it("proxmox_ceph_osd_list — calls correct endpoint", async () => {
    const mockOsd = { nodes: [] };
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockOsd);

    const result = await handleCephTool(
      "proxmox_ceph_osd_list",
      { node: "pve01" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/ceph/osd");
    expect(result.content[0].text).toBe(JSON.stringify(mockOsd, null, 2));
  });

  it("proxmox_ceph_osd_list — returns friendly message on 501", async () => {
    vi.mocked(mockClient.get).mockRejectedValueOnce(
      new ProxmoxApiError("Not implemented", "GET /nodes/pve01/ceph/osd", 501),
    );

    const result = await handleCephTool(
      "proxmox_ceph_osd_list",
      { node: "pve01" },
      mockClient,
    );

    expect(result.content[0].text).toContain("Ceph is not available on node 'pve01'");
  });

  it("proxmox_ceph_pool_list — calls correct endpoint", async () => {
    const mockPools = [{ pool: "rbd", size: 3 }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockPools);

    const result = await handleCephTool(
      "proxmox_ceph_pool_list",
      { node: "pve01" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/ceph/pool");
    expect(result.content[0].text).toBe(JSON.stringify(mockPools, null, 2));
  });

  it("proxmox_ceph_pool_list — returns friendly message on 501", async () => {
    vi.mocked(mockClient.get).mockRejectedValueOnce(
      new ProxmoxApiError("Not implemented", "GET /nodes/pve01/ceph/pool", 501),
    );

    const result = await handleCephTool(
      "proxmox_ceph_pool_list",
      { node: "pve01" },
      mockClient,
    );

    expect(result.content[0].text).toContain("Ceph is not available on node 'pve01'");
  });

  it("proxmox_ceph_monitor_list — calls correct endpoint", async () => {
    const mockMons = [{ name: "pve01", addr: "10.0.0.1:6789" }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockMons);

    const result = await handleCephTool(
      "proxmox_ceph_monitor_list",
      { node: "pve01" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/ceph/mon");
    expect(result.content[0].text).toBe(JSON.stringify(mockMons, null, 2));
  });

  it("proxmox_ceph_monitor_list — returns friendly message on 501", async () => {
    vi.mocked(mockClient.get).mockRejectedValueOnce(
      new ProxmoxApiError("Not implemented", "GET /nodes/pve01/ceph/mon", 501),
    );

    const result = await handleCephTool(
      "proxmox_ceph_monitor_list",
      { node: "pve01" },
      mockClient,
    );

    expect(result.content[0].text).toContain("Ceph is not available on node 'pve01'");
  });

  it("returns unknown tool message for unrecognised tool name", async () => {
    const result = await handleCephTool("proxmox_ceph_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_ceph_unknown");
  });
});
