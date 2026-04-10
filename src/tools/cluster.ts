import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveClusterStatus, PveClusterResource, PveTask } from "../client/types.js";

const ClusterResourcesSchema = z.object({
  type: z.string().optional(),
});

const ClusterTasksSchema = z.object({
  limit: z.number().int().min(1).max(500).optional().default(50),
});

const ClusterLogSchema = z.object({
  max: z.number().int().min(1).max(500).optional().default(50),
});

export const clusterToolDefinitions = [
  {
    name: "proxmox_cluster_status",
    description: "Get the overall status of the Proxmox VE cluster (quorum, nodes, cluster name)",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "proxmox_cluster_resources",
    description: "List all cluster resources (nodes, VMs, containers, storage) with optional type filter",
    inputSchema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          description: "Optional resource type filter (vm, storage, node, sdn)",
        },
      },
      required: [],
    },
  },
  {
    name: "proxmox_cluster_tasks",
    description: "List recent cluster-wide tasks with their status and timing",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of tasks to return (default: 50, max: 500)",
        },
      },
      required: [],
    },
  },
  {
    name: "proxmox_cluster_log",
    description: "Get the cluster activity log (configuration changes, task events)",
    inputSchema: {
      type: "object" as const,
      properties: {
        max: {
          type: "number",
          description: "Maximum number of log entries to return (default: 50, max: 500)",
        },
      },
      required: [],
    },
  },
];

export async function handleClusterTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_cluster_status": {
      const data = await client.get<PveClusterStatus[]>("/cluster/status");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_cluster_resources": {
      const { type } = ClusterResourcesSchema.parse(args);
      const url = type ? `/cluster/resources?type=${type}` : "/cluster/resources";
      const data = await client.get<PveClusterResource[]>(url);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_cluster_tasks": {
      const { limit } = ClusterTasksSchema.parse(args);
      const data = await client.get<PveTask[]>(`/cluster/tasks?limit=${limit}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_cluster_log": {
      const { max } = ClusterLogSchema.parse(args);
      const data = await client.get<unknown[]>(`/cluster/log?max=${max}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
