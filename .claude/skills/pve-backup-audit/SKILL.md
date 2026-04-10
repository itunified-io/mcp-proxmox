---
name: pve-backup-audit
description: Audit backup coverage and freshness across all VMs and containers
disable-model-invocation: true
---

# pve-backup-audit — Proxmox VE Backup Coverage Audit

Audit backup coverage and freshness for all VMs and containers in the cluster.

## Workflow

### Step 1: Collect inventory (parallel)
1. `proxmox_vm_list` — all VMs cluster-wide
2. `proxmox_ct_list` — all CTs cluster-wide
3. `proxmox_node_list` — get all nodes
4. `proxmox_storage_list` — identify storages that hold backups (type = dir, nfs, cifs, pbs)

### Step 2: Collect backups (parallel per storage)
For each storage that supports backups, call:
- `proxmox_backup_list` with the storage name and node

### Step 3: Cross-reference

Build a map of VMID → most recent backup timestamp.

Flag:
- **(A) No backup** — VMID appears in VM/CT list but has zero backup files
- **(B) Stale backup** — most recent backup is older than 7 days from today

## Output Format

```
BACKUP AUDIT — 2026-04-10

VMID  | Name        | Type | Last Backup          | Age     | Status
------|-------------|------|----------------------|---------|--------
100   | webserver   | VM   | 2026-04-09 02:00:00  | 1 day   | OK
101   | database    | VM   | 2026-04-02 02:00:00  | 8 days  | STALE
200   | nginx-proxy | CT   | never                | —       | NO BACKUP

Summary:
  Total VMs/CTs: 3
  Covered:       1 (33%)
  Stale (>7d):   1
  No backup:     1
```

## Notes

- Today's date is available from context; calculate age relative to current date
- Backup file `volid` contains the timestamp — parse `vzdump-qemu-<vmid>-<date>_<time>` format
- For PBS (Proxmox Backup Server) storages, backup listing uses the same `proxmox_backup_list` call
- A VM in "stopped" state should still have backup coverage flagged
