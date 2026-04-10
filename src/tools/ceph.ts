import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveCephStatus } from "../client/types.js";
import { NodeNameSchema } from "../utils/validation.js";
import { ProxmoxApiError } from "../utils/errors.js";

// Zod input schemas
const NodeOnlySchema = z.object({ node: NodeNameSchema });

// Tool definitions array
export const cephToolDefinitions = [
  {
    name: "proxmox_ceph_status",
    description: "Get the Ceph cluster status from a Proxmox VE node. Returns an error message if Ceph is not installed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
  {
    name: "proxmox_ceph_osd_list",
    description: "List all Ceph OSD (Object Storage Daemon) entries from a Proxmox VE node. Returns an error message if Ceph is not installed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
  {
    name: "proxmox_ceph_pool_list",
    description: "List all Ceph storage pools from a Proxmox VE node. Returns an error message if Ceph is not installed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
  {
    name: "proxmox_ceph_monitor_list",
    description: "List all Ceph monitor (MON) daemons from a Proxmox VE node. Returns an error message if Ceph is not installed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
];

// Handler function
export async function handleCephTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_ceph_status": {
      const { node } = NodeOnlySchema.parse(args);
      try {
        const data = await client.get<PveCephStatus>(`/nodes/${node}/ceph/status`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        if (err instanceof ProxmoxApiError && err.status === 501) {
          return {
            content: [
              {
                type: "text",
                text: `Ceph is not available on node '${node}'. Ceph must be installed and configured to use this tool.`,
              },
            ],
          };
        }
        throw err;
      }
    }
    case "proxmox_ceph_osd_list": {
      const { node } = NodeOnlySchema.parse(args);
      try {
        const data = await client.get<Record<string, unknown>>(`/nodes/${node}/ceph/osd`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        if (err instanceof ProxmoxApiError && err.status === 501) {
          return {
            content: [
              {
                type: "text",
                text: `Ceph is not available on node '${node}'. Ceph must be installed and configured to use this tool.`,
              },
            ],
          };
        }
        throw err;
      }
    }
    case "proxmox_ceph_pool_list": {
      const { node } = NodeOnlySchema.parse(args);
      try {
        const data = await client.get<Record<string, unknown>[]>(`/nodes/${node}/ceph/pool`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        if (err instanceof ProxmoxApiError && err.status === 501) {
          return {
            content: [
              {
                type: "text",
                text: `Ceph is not available on node '${node}'. Ceph must be installed and configured to use this tool.`,
              },
            ],
          };
        }
        throw err;
      }
    }
    case "proxmox_ceph_monitor_list": {
      const { node } = NodeOnlySchema.parse(args);
      try {
        const data = await client.get<Record<string, unknown>[]>(`/nodes/${node}/ceph/mon`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        if (err instanceof ProxmoxApiError && err.status === 501) {
          return {
            content: [
              {
                type: "text",
                text: `Ceph is not available on node '${node}'. Ceph must be installed and configured to use this tool.`,
              },
            ],
          };
        }
        throw err;
      }
    }
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
