import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import { sdnToolDefinitions, handleSdnTool } from "../../src/tools/sdn.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

describe("sdnToolDefinitions", () => {
  it("exports 3 tool definitions", () => {
    expect(sdnToolDefinitions).toHaveLength(3);
  });

  it("has correct tool names", () => {
    const names = sdnToolDefinitions.map((t) => t.name);
    expect(names).toContain("proxmox_sdn_zones");
    expect(names).toContain("proxmox_sdn_vnets");
    expect(names).toContain("proxmox_sdn_subnets");
  });
});

describe("handleSdnTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxmox_sdn_zones — calls correct endpoint and returns data", async () => {
    const mockZones = [{ zone: "localzone", type: "simple" }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockZones);

    const result = await handleSdnTool("proxmox_sdn_zones", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/sdn/zones");
    expect(result.content[0].text).toBe(JSON.stringify(mockZones, null, 2));
  });

  it("proxmox_sdn_vnets — calls correct endpoint and returns data", async () => {
    const mockVnets = [{ vnet: "myvnet", zone: "localzone" }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockVnets);

    const result = await handleSdnTool("proxmox_sdn_vnets", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/sdn/vnets");
    expect(result.content[0].text).toBe(JSON.stringify(mockVnets, null, 2));
  });

  it("proxmox_sdn_subnets — calls correct endpoint with vnet", async () => {
    const mockSubnets = [{ subnet: "10.0.0.0/24", vnet: "myvnet" }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockSubnets);

    const result = await handleSdnTool(
      "proxmox_sdn_subnets",
      { vnet: "myvnet" },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/sdn/vnets/myvnet/subnets");
    expect(result.content[0].text).toBe(JSON.stringify(mockSubnets, null, 2));
  });

  it("proxmox_sdn_subnets — throws on missing vnet", async () => {
    await expect(
      handleSdnTool("proxmox_sdn_subnets", {}, mockClient),
    ).rejects.toThrow();
  });

  it("returns unknown tool message for unrecognised tool name", async () => {
    const result = await handleSdnTool("proxmox_sdn_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_sdn_unknown");
  });
});
