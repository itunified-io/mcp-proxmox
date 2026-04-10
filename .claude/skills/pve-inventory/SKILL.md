---
name: pve-inventory
description: Full inventory of VMs, containers, and resources
disable-model-invocation: true
---

# pve-inventory — Proxmox VE Full Inventory

Collect and display a complete inventory of all virtual machines, containers, and cluster resources.

## Workflow

Run the following tools **in parallel**:

1. `proxmox_vm_list` — all QEMU VMs (no node filter = cluster-wide)
2. `proxmox_ct_list` — all LXC containers (no node filter = cluster-wide)
3. `proxmox_cluster_resources` — cluster-wide resource summary (use `type=all`)
4. `proxmox_pool_list` — resource pool assignments

## Output Format

Present a unified inventory table sorted by node, then type, then VMID:

```
VMID  | Name          | Type | Status  | Node      | CPU  | RAM (MB) | Pool
------|---------------|------|---------|-----------|------|----------|-------
100   | webserver     | VM   | running | pve-node1 | 4    | 4096     | prod
101   | database      | VM   | running | pve-node1 | 8    | 16384    | prod
200   | nginx-proxy   | CT   | running | pve-node2 | 2    | 512      | web
201   | monitoring    | CT   | stopped | pve-node2 | 1    | 256      | ops
```

## Summary Line

After the table, add a summary:
```
Total: 2 VMs (2 running), 2 CTs (1 running, 1 stopped) across 2 nodes
```

## Notes

- For CPU column, use `cpus` or `cores` from the config/status
- For RAM, use `maxmem` converted to MB
- Pool assignment comes from `proxmox_pool_list` / `proxmox_pool_members` cross-reference
- If a VM/CT has no pool, show `-` in the Pool column
- Stopped VMs/CTs may not have CPU/RAM runtime values — show configured values from config
