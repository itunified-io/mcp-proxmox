import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PvePool, PvePoolDetail } from "../client/types.js";
import { PoolIdSchema } from "../utils/validation.js";

// Zod input schemas
const PoolIdOnlySchema = z.object({ poolid: PoolIdSchema });

// Tool definitions array
export const poolsToolDefinitions = [
  {
    name: "proxmox_pool_list",
    description: "List all resource pools defined in the Proxmox VE cluster.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "proxmox_pool_members",
    description: "Get details and member resources for a specific Proxmox VE resource pool.",
    inputSchema: {
      type: "object" as const,
      properties: {
        poolid: { type: "string", description: "Resource pool identifier" },
      },
      required: ["poolid"],
    },
  },
];

// Handler function
export async function handlePoolsTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_pool_list": {
      const data = await client.get<PvePool[]>("/pools");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    case "proxmox_pool_members": {
      const { poolid } = PoolIdOnlySchema.parse(args);
      const data = await client.get<PvePoolDetail>(`/pools/${poolid}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
