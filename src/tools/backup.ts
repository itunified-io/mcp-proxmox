import { z } from "zod";
import type { ProxmoxClient } from "../client/proxmox-client.js";
import type { PveStorageContent } from "../client/types.js";
import { NodeNameSchema, StorageIdSchema, VolidSchema } from "../utils/validation.js";

const BackupListSchema = z.object({
  node: NodeNameSchema,
  storage: StorageIdSchema,
});

const BackupDetailSchema = z.object({
  node: NodeNameSchema,
  storage: StorageIdSchema,
  volid: VolidSchema,
});

export const backupToolDefinitions = [
  {
    name: "proxmox_backup_list",
    description: "List all backup files in a storage on a node",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        storage: { type: "string", description: "Storage identifier (e.g. local, backup-nas)" },
      },
      required: ["node", "storage"],
    },
  },
  {
    name: "proxmox_backup_detail",
    description: "Get details for a specific backup file identified by its volume ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        node: { type: "string", description: "PVE node name" },
        storage: { type: "string", description: "Storage identifier (e.g. local, backup-nas)" },
        volid: {
          type: "string",
          description: "Volume ID of the backup (e.g. local:backup/vzdump-qemu-100-2026_04_10.vma.zst)",
        },
      },
      required: ["node", "storage", "volid"],
    },
  },
];

export async function handleBackupTool(
  name: string,
  args: Record<string, unknown>,
  client: ProxmoxClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "proxmox_backup_list": {
      const { node, storage } = BackupListSchema.parse(args);
      const data = await client.get<PveStorageContent[]>(
        `/nodes/${node}/storage/${storage}/content?content=backup`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "proxmox_backup_detail": {
      const { node, storage, volid } = BackupDetailSchema.parse(args);
      const data = await client.get<PveStorageContent[]>(
        `/nodes/${node}/storage/${storage}/content?content=backup`,
      );
      const entry = data.find((item) => item.volid === volid) ?? null;
      return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
}
