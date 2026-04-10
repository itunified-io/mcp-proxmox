import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveClusterResource, PveVmConfig, PveSnapshot } from "../client/types.js";
import { NodeNameSchema, VmidSchema, TimeframeSchema } from "../utils/validation.js";

const VmListSchema = z.object({
  node: NodeNameSchema.optional(),
});

const VmNodeVmidSchema = z.object({
  node: NodeNameSchema,
  vmid: VmidSchema,
});

const VmRrdSchema = z.object({
  node: NodeNameSchema,
  vmid: VmidSchema,
  timeframe: TimeframeSchema.default("hour"),
});

export const vmsToolDefinitions = [
  {
    name: "proxmox_vm_list",
    description: "List all QEMU virtual machines in the cluster, optionally filtered by node",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "Optional PVE node name to filter results" },
      },
      required: [],
    },
  },
  {
    name: "proxmox_vm_status",
    description: "Get the current runtime status of a specific QEMU VM (running, stopped, CPU, memory)",
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
    name: "proxmox_vm_config",
    description: "Get the configuration of a specific QEMU VM (hardware, network, disk, OS settings)",
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
    name: "proxmox_vm_snapshots",
    description: "List all snapshots for a specific QEMU VM",
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
    name: "proxmox_vm_rrd",
    description: "Get RRD performance data (CPU, memory, network, disk I/O) for a QEMU VM",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        vmid: { type: "number", description: "VM ID (100 or higher)" },
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

export async function handleVmsTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_vm_list": {
      const { node } = VmListSchema.parse(args);
      const data = await client.get<PveClusterResource[]>("/cluster/resources?type=vm");
      let vms = data.filter((r) => r.type === "qemu");
      if (node) {
        vms = vms.filter((r) => r.node === node);
      }
      return { content: [{ type: "text", text: JSON.stringify(vms, null, 2) }] };
    }

    case "proxmox_vm_status": {
      const { node, vmid } = VmNodeVmidSchema.parse(args);
      const data = await client.get<unknown>(`/nodes/${node}/qemu/${vmid}/status/current`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_vm_config": {
      const { node, vmid } = VmNodeVmidSchema.parse(args);
      const data = await client.get<PveVmConfig>(`/nodes/${node}/qemu/${vmid}/config`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_vm_snapshots": {
      const { node, vmid } = VmNodeVmidSchema.parse(args);
      const data = await client.get<PveSnapshot[]>(`/nodes/${node}/qemu/${vmid}/snapshot`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_vm_rrd": {
      const { node, vmid, timeframe } = VmRrdSchema.parse(args);
      const data = await client.get<unknown[]>(
        `/nodes/${node}/qemu/${vmid}/rrddata?timeframe=${timeframe}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
