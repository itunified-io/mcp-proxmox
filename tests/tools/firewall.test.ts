import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import {
  firewallToolDefinitions,
  handleFirewallTool,
} from "../../src/tools/firewall.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

describe("firewallToolDefinitions", () => {
  it("exports 3 tool definitions", () => {
    expect(firewallToolDefinitions).toHaveLength(3);
  });

  it("has correct tool names", () => {
    const names = firewallToolDefinitions.map((t) => t.name);
    expect(names).toContain("proxmox_fw_cluster_rules");
    expect(names).toContain("proxmox_fw_vm_rules");
    expect(names).toContain("proxmox_fw_aliases");
  });
});

describe("handleFirewallTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxmox_fw_cluster_rules — calls correct endpoint and returns data", async () => {
    const mockRules = [{ type: "in", action: "ACCEPT", pos: 0 }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockRules);

    const result = await handleFirewallTool("proxmox_fw_cluster_rules", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/firewall/rules");
    expect(result.content[0].text).toBe(JSON.stringify(mockRules, null, 2));
  });

  it("proxmox_fw_vm_rules — calls correct endpoint with node and vmid", async () => {
    const mockRules = [{ type: "out", action: "DROP", pos: 1 }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockRules);

    const result = await handleFirewallTool(
      "proxmox_fw_vm_rules",
      { node: "pve01", vmid: 100 },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve01/qemu/100/firewall/rules");
    expect(result.content[0].text).toBe(JSON.stringify(mockRules, null, 2));
  });

  it("proxmox_fw_vm_rules — throws on invalid vmid (below 100)", async () => {
    await expect(
      handleFirewallTool("proxmox_fw_vm_rules", { node: "pve01", vmid: 99 }, mockClient),
    ).rejects.toThrow();
  });

  it("proxmox_fw_aliases — calls correct endpoint and returns data", async () => {
    const mockAliases = [{ name: "local-net", cidr: "10.0.0.0/8" }];
    vi.mocked(mockClient.get).mockResolvedValueOnce(mockAliases);

    const result = await handleFirewallTool("proxmox_fw_aliases", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/cluster/firewall/aliases");
    expect(result.content[0].text).toBe(JSON.stringify(mockAliases, null, 2));
  });

  it("returns unknown tool message for unrecognised tool name", async () => {
    const result = await handleFirewallTool("proxmox_fw_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_fw_unknown");
  });
});
