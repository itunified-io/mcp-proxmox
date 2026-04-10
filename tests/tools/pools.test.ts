import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import { poolsToolDefinitions, handlePoolsTool } from "../../src/tools/pools.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

describe("poolsToolDefinitions", () => {
  it("exports 2 tool definitions", () => {
    expect(poolsToolDefinitions).toHaveLength(2);
  });

  it("has correct tool names", () => {
    const names = poolsToolDefinitions.map((t) => t.name);
    expect(names).toContain("proxmox_pool_list");
    expect(names).toContain("proxmox_pool_members");
  });
});

describe("handlePoolsTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxmox_pool_list — calls /pools and returns data", async () => {
    const mockPools = [{ poolid: "mypool", comment: "My resource pool" }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockPools);

    const result = await handlePoolsTool("proxmox_pool_list", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/pools");
    expect(result.content[0].text).toBe(JSON.stringify(mockPools, null, 2));
  });

  it("proxmox_pool_members — calls correct endpoint with poolid", async () => {
    const mockDetail = {
      poolid: "mypool",
      comment: "My resource pool",
      members: [
        { id: "qemu/100", type: "qemu", node: "pve01", vmid: 100 },
      ],
    };
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockDetail);

    const result = await handlePoolsTool(
      "proxmox_pool_members",
      { poolid: "mypool" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/pools/mypool");
    expect(result.content[0].text).toBe(JSON.stringify(mockDetail, null, 2));
  });

  it("proxmox_pool_members — throws on missing poolid", async () => {
    await expect(
      handlePoolsTool("proxmox_pool_members", {}, mockClient),
    ).rejects.toThrow();
  });

  it("returns unknown tool message for unrecognised tool name", async () => {
    const result = await handlePoolsTool("proxmox_pool_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_pool_unknown");
  });
});
