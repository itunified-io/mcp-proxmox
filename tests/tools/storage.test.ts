import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProxmoxClient } from "../../src/client/proxmox-client.js";
import { handleStorageTool } from "../../src/tools/storage.js";

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
} as unknown as ProxmoxClient;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxmox_storage_list", () => {
  it("calls /storage and returns all storages", async () => {
    const storages = [
      { storage: "local", type: "dir", content: "iso,vztmpl,backup" },
      { storage: "local-lvm", type: "lvmthin", content: "images,rootdir" },
    ];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(storages);

    const result = await handleStorageTool("proxmox_storage_list", {}, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/storage");
    expect(JSON.parse(result.content[0].text)).toHaveLength(2);
  });
});

describe("proxmox_storage_status", () => {
  it("calls correct endpoint with node and storage", async () => {
    const status = { storage: "local", total: 100 * 1073741824, used: 30 * 1073741824, avail: 70 * 1073741824 };
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(status);

    const result = await handleStorageTool("proxmox_storage_status", { node: "pve1", storage: "local" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/storage/local/status");
    expect(JSON.parse(result.content[0].text)).toEqual(status);
  });
});

describe("proxmox_storage_content", () => {
  it("calls endpoint without content filter when none specified", async () => {
    const content = [{ volid: "local:iso/debian.iso", format: "iso", size: 1000, content: "iso" }];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(content);

    await handleStorageTool("proxmox_storage_content", { node: "pve1", storage: "local" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/storage/local/content");
  });

  it("appends content type to URL when specified", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleStorageTool("proxmox_storage_content", { node: "pve1", storage: "local", content: "backup" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/storage/local/content?content=backup");
  });

  it("returns the content array", async () => {
    const items = [
      { volid: "local:backup/vzdump-qemu-100.vma.zst", format: "pbs-ct", size: 2 * 1073741824, content: "backup" },
    ];
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(items);

    const result = await handleStorageTool("proxmox_storage_content", { node: "pve1", storage: "local" }, mockClient);

    expect(JSON.parse(result.content[0].text)).toEqual(items);
  });
});

describe("proxmox_storage_rrd", () => {
  it("calls correct endpoint with default timeframe", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleStorageTool("proxmox_storage_rrd", { node: "pve1", storage: "local" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/storage/local/rrddata?timeframe=hour");
  });

  it("passes custom timeframe", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handleStorageTool("proxmox_storage_rrd", { node: "pve1", storage: "local-lvm", timeframe: "month" }, mockClient);

    expect(mockClient.get).toHaveBeenCalledWith("/nodes/pve1/storage/local-lvm/rrddata?timeframe=month");
  });
});

describe("unknown tool", () => {
  it("returns unknown tool message", async () => {
    const result = await handleStorageTool("proxmox_storage_unknown", {}, mockClient);
    expect(result.content[0].text).toBe("Unknown tool: proxmox_storage_unknown");
  });
});
