import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveFirewallRule } from "../client/types.js";
import { NodeNameSchema, VmidSchema } from "../utils/validation.js";

// Zod input schemas
const NodeVmSchema = z.object({
  node: NodeNameSchema,
  vmid: VmidSchema,
});

// Tool definitions array
export const firewallToolDefinitions = [
  {
    name: "proxmox_fw_cluster_rules",
    description: "List all firewall rules defined at the cluster level in Proxmox VE.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "proxmox_fw_vm_rules",
    description: "List firewall rules for a specific VM (QEMU) on a given node.",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        vmid: { type: "number", description: "VM ID (100 or higher)" },
      },
      required: ["node", "vmid"],
    },
  },
  {
    name: "proxmox_fw_aliases",
    description: "List all firewall aliases defined at the cluster level in Proxmox VE.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// Handler function
export async function handleFirewallTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_fw_cluster_rules": {
      const data = await client.get<PveFirewallRule[]>("/cluster/firewall/rules");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    case "proxmox_fw_vm_rules": {
      const { node, vmid } = NodeVmSchema.parse(args);
      const data = await client.get<PveFirewallRule[]>(
        `/nodes/${node}/qemu/${vmid}/firewall/rules`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    case "proxmox_fw_aliases": {
      const data = await client.get<Record<string, unknown>[]>("/cluster/firewall/aliases");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
