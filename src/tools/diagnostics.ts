import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveService } from "../client/types.js";
import { NodeNameSchema, SyslogLimitSchema } from "../utils/validation.js";

// Zod input schemas
const NodeOnlySchema = z.object({ node: NodeNameSchema });

const SyslogSchema = z.object({
  node: NodeNameSchema,
  limit: SyslogLimitSchema,
});

// Tool definitions array
export const diagnosticsToolDefinitions = [
  {
    name: "proxmox_diag_version",
    description: "Get the Proxmox VE API version information.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "proxmox_diag_subscription",
    description: "Get the subscription status for a Proxmox VE node.",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
  {
    name: "proxmox_diag_services",
    description: "List all system services and their status on a Proxmox VE node.",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
  {
    name: "proxmox_diag_syslog",
    description: "Read recent syslog entries from a Proxmox VE node.",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        limit: {
          type: "number",
          description: "Number of log lines to return (1–5000, default 50)",
        },
      },
      required: ["node"],
    },
  },
];

// Handler function
export async function handleDiagnosticsTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_diag_version": {
      const data = await client.get<Record<string, unknown>>("/version");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    case "proxmox_diag_subscription": {
      const { node } = NodeOnlySchema.parse(args);
      const data = await client.get<Record<string, unknown>>(
        `/nodes/${node}/subscription`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    case "proxmox_diag_services": {
      const { node } = NodeOnlySchema.parse(args);
      const data = await client.get<PveService[]>(`/nodes/${node}/services`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    case "proxmox_diag_syslog": {
      const { node, limit } = SyslogSchema.parse(args);
      const data = await client.get<Record<string, unknown>[]>(
        `/nodes/${node}/syslog?limit=${limit}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
