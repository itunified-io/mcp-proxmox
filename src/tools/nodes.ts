import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveNode, PveNodeStatus, PveNetworkInterface, PveDisk } from "../client/types.js";
import { NodeNameSchema, TimeframeSchema } from "../utils/validation.js";

const NodeStatusSchema = z.object({
  node: NodeNameSchema,
});

const NodeNetworksSchema = z.object({
  node: NodeNameSchema,
  type: z.string().optional(),
});

const NodeDisksSchema = z.object({
  node: NodeNameSchema,
});

const NodeAptUpdatesSchema = z.object({
  node: NodeNameSchema,
});

const NodeRrdSchema = z.object({
  node: NodeNameSchema,
  timeframe: TimeframeSchema.default("hour"),
});

export const nodesToolDefinitions = [
  {
    name: "proxmox_node_list",
    description: "List all nodes in the Proxmox VE cluster with their status, CPU, and memory info",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "proxmox_node_status",
    description: "Get detailed status of a specific Proxmox VE node including CPU, memory, swap, rootfs, and kernel info",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
  {
    name: "proxmox_node_resources",
    description: "Get computed resource utilization percentages for a node (CPU%, memory%, disk%) with human-readable GB values",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
  {
    name: "proxmox_node_networks",
    description: "List network interfaces on a Proxmox VE node with optional type filter (bridge, bond, vlan, etc.)",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        type: { type: "string", description: "Optional interface type filter (e.g. bridge, bond, vlan, eth)" },
      },
      required: ["node"],
    },
  },
  {
    name: "proxmox_node_disks",
    description: "List physical disks on a Proxmox VE node with model, size, serial, and health info",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
  {
    name: "proxmox_node_apt_updates",
    description: "List available APT package updates on a Proxmox VE node",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
      },
      required: ["node"],
    },
  },
];

export async function handleNodesTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_node_list": {
      const data = await client.get<PveNode[]>("/nodes");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_node_status": {
      const { node } = NodeStatusSchema.parse(args);
      const data = await client.get<PveNodeStatus>(`/nodes/${node}/status`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_node_resources": {
      const { node } = NodeStatusSchema.parse(args);
      const status = await client.get<PveNodeStatus>(`/nodes/${node}/status`);

      const memUsed = status.memory?.used ?? 0;
      const memTotal = status.memory?.total ?? 0;
      const rootUsed = status.rootfs?.used ?? 0;
      const rootTotal = status.rootfs?.total ?? 0;

      const resources = {
        node: status.node ?? node,
        cpu_percent: (status.cpu ?? 0) * 100,
        memory_used_gb: memUsed / 1073741824,
        memory_total_gb: memTotal / 1073741824,
        memory_percent: memTotal > 0 ? (memUsed / memTotal) * 100 : 0,
        rootfs_used_gb: rootUsed / 1073741824,
        rootfs_total_gb: rootTotal / 1073741824,
        rootfs_percent: rootTotal > 0 ? (rootUsed / rootTotal) * 100 : 0,
        uptime_hours: (status.uptime ?? 0) / 3600,
        load_average: status.loadavg,
      };

      return { content: [{ type: "text", text: JSON.stringify(resources, null, 2) }] };
    }

    case "proxmox_node_networks": {
      const { node, type } = NodeNetworksSchema.parse(args);
      const data = await client.get<PveNetworkInterface[]>(`/nodes/${node}/network`);
      const filtered = type ? data.filter((iface) => iface.type === type) : data;
      return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
    }

    case "proxmox_node_disks": {
      const { node } = NodeDisksSchema.parse(args);
      const data = await client.get<PveDisk[]>(`/nodes/${node}/disks/list`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_node_apt_updates": {
      const { node } = NodeAptUpdatesSchema.parse(args);
      const data = await client.get<unknown[]>(`/nodes/${node}/apt/update`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
