import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveClusterResource, PveSnapshot } from "../client/types.js";
import { NodeNameSchema, VmidSchema, TimeframeSchema } from "../utils/validation.js";

const CtListSchema = z.object({
  node: NodeNameSchema.optional(),
});

const CtNodeVmidSchema = z.object({
  node: NodeNameSchema,
  vmid: VmidSchema,
});

const CtRrdSchema = z.object({
  node: NodeNameSchema,
  vmid: VmidSchema,
  timeframe: TimeframeSchema.default("hour"),
});

export const containersToolDefinitions = [
  {
    name: "proxmox_ct_list",
    description: "List all LXC containers in the cluster, optionally filtered by node",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "Optional PVE node name to filter results" },
      },
      required: [],
    },
  },
  {
    name: "proxmox_ct_status",
    description: "Get the current runtime status of a specific LXC container (running, stopped, CPU, memory)",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        vmid: { type: "number", description: "Container ID (100 or higher)" },
      },
      required: ["node", "vmid"],
    },
  },
  {
    name: "proxmox_ct_config",
    description: "Get the configuration of a specific LXC container (rootfs, network, OS, features)",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        vmid: { type: "number", description: "Container ID (100 or higher)" },
      },
      required: ["node", "vmid"],
    },
  },
  {
    name: "proxmox_ct_snapshots",
    description: "List all snapshots for a specific LXC container",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        vmid: { type: "number", description: "Container ID (100 or higher)" },
      },
      required: ["node", "vmid"],
    },
  },
  {
    name: "proxmox_ct_rrd",
    description: "Get RRD performance data (CPU, memory, network, disk I/O) for an LXC container",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        vmid: { type: "number", description: "Container ID (100 or higher)" },
        timeframe: {
          type: "string",
          enum: ["hour", "day", "week", "month", "year"],
          description: "Time range for RRD data (default: hour)",
        },
      },
      required: ["node", "vmid"],
    },
  },
];

export async function handleContainersTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_ct_list": {
      const { node } = CtListSchema.parse(args);
      const data = await client.get<PveClusterResource[]>("/cluster/resources?type=vm");
      let containers = data.filter((r) => r.type === "lxc");
      if (node) {
        containers = containers.filter((r) => r.node === node);
      }
      return { content: [{ type: "text", text: JSON.stringify(containers, null, 2) }] };
    }

    case "proxmox_ct_status": {
      const { node, vmid } = CtNodeVmidSchema.parse(args);
      const data = await client.get<unknown>(`/nodes/${node}/lxc/${vmid}/status/current`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_ct_config": {
      const { node, vmid } = CtNodeVmidSchema.parse(args);
      const data = await client.get<unknown>(`/nodes/${node}/lxc/${vmid}/config`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_ct_snapshots": {
      const { node, vmid } = CtNodeVmidSchema.parse(args);
      const data = await client.get<PveSnapshot[]>(`/nodes/${node}/lxc/${vmid}/snapshot`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_ct_rrd": {
      const { node, vmid, timeframe } = CtRrdSchema.parse(args);
      const data = await client.get<unknown[]>(
        `/nodes/${node}/lxc/${vmid}/rrddata?timeframe=${timeframe}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
