import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveReplicationJob } from "../client/types.js";
import { NodeNameSchema, ReplicationIdSchema } from "../utils/validation.js";

// Zod input schemas
const NodeOnlySchema = z.object({ node: NodeNameSchema });

const NodeReplicationSchema = z.object({
  node: NodeNameSchema,
  id: ReplicationIdSchema,
});

// Tool definitions array
export const replicationToolDefinitions = [
  {
    name: "proxmox_replication_list",
    description: "List all replication jobs configured on a Proxmox VE node.",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
  {
    name: "proxmox_replication_status",
    description: "Get the current status of a specific replication job on a Proxmox VE node.",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        id: { type: "string", description: "Replication job identifier" },
      },
      required: ["node", "id"],
    },
  },
];

// Handler function
export async function handleReplicationTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_replication_list": {
      const { node } = NodeOnlySchema.parse(args);
      const data = await client.get<PveReplicationJob[]>(`/nodes/${node}/replication`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    case "proxmox_replication_status": {
      const { node, id } = NodeReplicationSchema.parse(args);
      const data = await client.get<Record<string, unknown>>(
        `/nodes/${node}/replication/${id}/status`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
