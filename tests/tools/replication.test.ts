import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import {
  replicationToolDefinitions,
  handleReplicationTool,
} from "../../src/tools/replication.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

describe("replicationToolDefinitions", () => {
  it("exports 2 tool definitions", () => {
    expect(replicationToolDefinitions).toHaveLength(2);
  });

  it("has correct tool names", () => {
    const names = replicationToolDefinitions.map((t) => t.name);
    expect(names).toContain("proxmox_replication_list");
    expect(names).toContain("proxmox_replication_status");
  });
});

describe("handleReplicationTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxmox_replication_list — calls correct endpoint for node", async () => {
    const mockJobs = [
      {
        id: "100-0",
        type: "local",
        source: "pve01",
        target: "pve02",
        guest: 100,
        jobnum: 0,
      },
    ];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockJobs);

    const result = await handleReplicationTool(
      "proxmox_replication_list",
      { node: "pve01" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/replication");
    expect(result.content[0].text).toBe(JSON.stringify(mockJobs, null, 2));
  });

  it("proxmox_replication_list — throws on missing node", async () => {
    await expect(
      handleReplicationTool("proxmox_replication_list", {}, mockClient),
    ).rejects.toThrow();
  });

  it("proxmox_replication_status — calls correct endpoint with node and id", async () => {
    const mockStatus = {
      id: "100-0",
      last_sync: 1712700000,
      next_sync: 1712703600,
      state: "ok",
    };
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockStatus);

    const result = await handleReplicationTool(
      "proxmox_replication_status",
      { node: "pve01", id: "100-0" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/replication/100-0/status");
    expect(result.content[0].text).toBe(JSON.stringify(mockStatus, null, 2));
  });

  it("proxmox_replication_status — throws on missing id", async () => {
    await expect(
      handleReplicationTool(
        "proxmox_replication_status",
        { node: "pve01" },
        mockClient,
      ),
    ).rejects.toThrow();
  });

  it("returns unknown tool message for unrecognised tool name", async () => {
    const result = await handleReplicationTool(
      "proxmox_replication_unknown",
      {},
      mockClient,
    );
    expect(result.content[0].text).toBe("Unknown tool: proxmox_replication_unknown");
  });
});
