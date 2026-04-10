import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import { handleBackupTool } from "../../src/tools/backup.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleBackups = [
  {
    volid: "local:backup/vzdump-qemu-100-2026_04_10-12_00_00.vma.zst",
    format: "pbs-ct",
    size: 2 * 1073741824,
    content: "backup",
    ctime: 1712700000,
    vmid: 100,
  },
  {
    volid: "local:backup/vzdump-lxc-200-2026_04_10-12_00_00.tar.zst",
    format: "pbs-vm",
    size: 512 * 1048576,
    content: "backup",
    ctime: 1712700060,
    vmid: 200,
  },
];

describe("proxmox_backup_list", () => {
  it("calls correct endpoint with backup content filter", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(sampleBackups);

    const result = await handleBackupTool("proxmox_backup_list", { node: "pve1", storage: "local" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/storage/local/content?content=backup");
    const backups = JSON.parse(result.content[0].text);
    expect(backups).toHaveLength(2);
  });

  it("returns all backup entries", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(sampleBackups);

    const result = await handleBackupTool("proxmox_backup_list", { node: "pve1", storage: "local" }, mockClient);

    const backups = JSON.parse(result.content[0].text);
    expect(backups).toEqual(sampleBackups);
  });

  it("rejects missing node", async () => {
    await expect(
      handleBackupTool("proxmox_backup_list", { storage: "local" }, mockClient),
    ).rejects.toThrow();
  });

  it("rejects missing storage", async () => {
    await expect(
      handleBackupTool("proxmox_backup_list", { node: "pve1" }, mockClient),
    ).rejects.toThrow();
  });
});

describe("proxmox_backup_detail", () => {
  it("filters results by volid", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(sampleBackups);

    const targetVolid = "local:backup/vzdump-qemu-100-2026_04_10-12_00_00.vma.zst";
    const result = await handleBackupTool(
      "proxmox_backup_detail",
      { node: "pve1", storage: "local", volid: targetVolid },
      mockClient,
    );

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/storage/local/content?content=backup");
    const detail = JSON.parse(result.content[0].text);
    expect(detail).not.toBeNull();
    expect(detail.volid).toBe(targetVolid);
    expect(detail.vmid).toBe(100);
  });

  it("returns null when volid not found", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(sampleBackups);

    const result = await handleBackupTool(
      "proxmox_backup_detail",
      { node: "pve1", storage: "local", volid: "local:backup/nonexistent.vma.zst" },
      mockClient,
    );

    const detail = JSON.parse(result.content[0].text);
    expect(detail).toBeNull();
  });

  it("rejects missing volid", async () => {
    await expect(
      handleBackupTool("proxmox_backup_detail", { node: "pve1", storage: "local" }, mockClient),
    ).rejects.toThrow();
  });
});

describe("unknown tool", () => {
  it("returns unknown tool message", async () => {
    const result = await handleBackupTool("proxmox_backup_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_backup_unknown");
  });
});
