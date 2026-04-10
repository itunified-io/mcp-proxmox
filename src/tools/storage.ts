import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveStorage, PveStorageContent } from "../client/types.js";
import { NodeNameSchema, StorageIdSchema, TimeframeSchema } from "../utils/validation.js";

const StorageStatusSchema = z.object({
  node: NodeNameSchema,
  storage: StorageIdSchema,
});

const StorageContentSchema = z.object({
  node: NodeNameSchema,
  storage: StorageIdSchema,
  content: z.string().optional(),
});

const StorageRrdSchema = z.object({
  node: NodeNameSchema,
  storage: StorageIdSchema,
  timeframe: TimeframeSchema.default("hour"),
});

export const storageToolDefinitions = [
  {
    name: "proxmox_storage_list",
    description: "List all storage configurations in the Proxmox VE cluster",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "proxmox_storage_status",
    description: "Get the status of a specific storage on a node (capacity, usage, availability)",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        storage: { type: "string", description: "Storage identifier (e.g. local, local-lvm)" },
      },
      required: ["node", "storage"],
    },
  },
  {
    name: "proxmox_storage_content",
    description: "List content (volumes, backups, ISOs, templates) in a storage, with optional content type filter",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        storage: { type: "string", description: "Storage identifier (e.g. local, local-lvm)" },
        content: {
          type: "string",
          description: "Optional content type filter (images, backup, iso, rootdir, vztmpl, snippets)",
        },
      },
      required: ["node", "storage"],
    },
  },
  {
    name: "proxmox_storage_rrd",
    description: "Get RRD performance data (read/write throughput, I/O ops) for a storage",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        storage: { type: "string", description: "Storage identifier (e.g. local, local-lvm)" },
        timeframe: {
          type: "string",
          enum: ["hour", "day", "week", "month", "year"],
          description: "Time range for RRD data (default: hour)",
        },
      },
      required: ["node", "storage"],
    },
  },
];

export async function handleStorageTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_storage_list": {
      const data = await client.get<PveStorage[]>("/storage");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_storage_status": {
      const { node, storage } = StorageStatusSchema.parse(args);
      const data = await client.get<unknown>(`/nodes/${node}/storage/${storage}/status`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_storage_content": {
      const { node, storage, content } = StorageContentSchema.parse(args);
      const url = content
        ? `/nodes/${node}/storage/${storage}/content?content=${content}`
        : `/nodes/${node}/storage/${storage}/content`;
      const data = await client.get<PveStorageContent[]>(url);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_storage_rrd": {
      const { node, storage, timeframe } = StorageRrdSchema.parse(args);
      const data = await client.get<unknown[]>(
        `/nodes/${node}/storage/${storage}/rrddata?timeframe=${timeframe}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
