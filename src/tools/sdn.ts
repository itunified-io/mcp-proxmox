import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveSdnZone, PveSdnVnet } from "../client/types.js";
import { VnetIdSchema } from "../utils/validation.js";

// Zod input schemas
const VnetOnlySchema = z.object({ vnet: VnetIdSchema });

// Tool definitions array
export const sdnToolDefinitions = [
  {
    name: "proxmox_sdn_zones",
    description: "List all SDN (Software-Defined Networking) zones configured in the Proxmox VE cluster.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "proxmox_sdn_vnets",
    description: "List all SDN virtual networks (VNets) configured in the Proxmox VE cluster.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "proxmox_sdn_subnets",
    description: "List all subnets defined within a specific SDN VNet.",
    inputSchema: {
      type: "object" as const,
      properties: {
        vnet: { type: "string", description: "SDN VNet identifier" },
      },
      required: ["vnet"],
    },
  },
];

// Handler function
export async function handleSdnTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_sdn_zones": {
      const data = await client.get<PveSdnZone[]>("/cluster/sdn/zones");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    case "proxmox_sdn_vnets": {
      const data = await client.get<PveSdnVnet[]>("/cluster/sdn/vnets");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    case "proxmox_sdn_subnets": {
      const { vnet } = VnetOnlySchema.parse(args);
      const data = await client.get<Record<string, unknown>[]>(
        `/cluster/sdn/vnets/${vnet}/subnets`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
