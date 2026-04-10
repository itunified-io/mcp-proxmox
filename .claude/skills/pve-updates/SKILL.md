---
name: pve-updates
description: Check for available APT updates and subscription status across all nodes
disable-model-invocation: true
---

# pve-updates — Proxmox VE Update Check

Check for available APT updates, current PVE version, and subscription status across all nodes.

## Workflow

### Step 1: Get all nodes
1. `proxmox_node_list` — list all nodes

### Step 2: Per-node checks (parallel for each node)
For each node:
- `proxmox_node_apt_updates` — list available APT packages with pending updates
- `proxmox_diag_version` — current PVE API and build version
- `proxmox_diag_subscription` — subscription level and expiry status

## Output Format

```
PVE UPDATE STATUS — 2026-04-10

Node        | PVE Version          | Subscription      | Updates
------------|----------------------|-------------------|---------
pve-node1   | 8.2.2 (2024-11-12)  | Enterprise (OK)   | 3
pve-node2   | 8.2.2 (2024-11-12)  | Community         | 3

Available Updates on pve-node1:
  Package                  Current    Available
  -----------------------  ---------  ---------
  proxmox-ve               8.2.2      8.2.4
  pve-kernel-6.8           6.8.4-2    6.8.8-1
  libpve-storage-perl      8.2.1      8.2.3

WARNINGS:
  pve-node2: No active subscription — only community repositories available
```

### Subscription Status Codes

- **Enterprise** — valid subscription, enterprise repositories active
- **Community** — no subscription, community-only repositories
- **Expired** — subscription expired, treat as WARN
- **Invalid** — subscription key invalid, treat as WARN

## Notes

- `proxmox_diag_subscription` returns `status` field: `Active`, `Expired`, `Invalid`, or `NotFound`
- Security updates (kernel, pve packages) should be highlighted separately if identifiable
- If a node has 0 updates available, still show it in the table with "Up to date"
- Run all per-node checks in parallel for speed
