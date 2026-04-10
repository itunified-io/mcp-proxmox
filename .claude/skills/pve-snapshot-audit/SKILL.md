---
name: pve-snapshot-audit
description: Audit snapshots across all VMs and containers
disable-model-invocation: true
---

# pve-snapshot-audit — Proxmox VE Snapshot Audit

Audit all snapshots across VMs and LXC containers, sorted by age (oldest first).

## Workflow

### Step 1: Get all VMs and CTs (parallel)
1. `proxmox_vm_list` — all VMs cluster-wide
2. `proxmox_ct_list` — all CTs cluster-wide

### Step 2: Get snapshots per VM/CT (parallel)
For each VM: `proxmox_vm_snapshots` (with node and vmid)
For each CT: `proxmox_ct_snapshots` (with node and vmid)

### Step 3: Filter and sort

- **Exclude** the `current` snapshot entry (it is not a real snapshot)
- Calculate age from `snaptime` (Unix timestamp) to today
- Sort by `snaptime` ascending (oldest first)
- Flag snapshots older than 7 days

## Output Format

```
SNAPSHOT AUDIT — 2026-04-10

VMID  | Name       | Type | Snapshot Name  | Created              | Age      | Status
------|------------|------|----------------|----------------------|----------|--------
101   | database   | VM   | before-upgrade | 2026-03-15 10:00:00  | 26 days  | OLD
100   | webserver  | VM   | post-migration | 2026-04-02 08:00:00  | 8 days   | OLD
200   | nginx      | CT   | pre-patch      | 2026-04-08 12:00:00  | 2 days   | OK

Summary:
  Total snapshots: 3
  OK (<=7 days):   1
  OLD (>7 days):   2

VMs/CTs with no snapshots: database-replica (VMID 102)
```

## Notes

- `snaptime` is a Unix epoch timestamp in the PVE API response
- Age threshold for "OLD" flag: > 7 days
- Old snapshots consume disk space and can slow I/O on some storage types
- Include a recommendation to review and clean up old snapshots
- Snapshots with description should show the description as a note
