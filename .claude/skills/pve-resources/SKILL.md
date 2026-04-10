---
name: pve-resources
description: Resource utilization and overcommit analysis per node
disable-model-invocation: true
---

# pve-resources — Proxmox VE Resource Utilization & Overcommit Analysis

Analyze CPU and RAM utilization and overcommit ratios per node.

## Workflow

### Step 1: Get all nodes (parallel)
1. `proxmox_node_list` — list all nodes
2. `proxmox_vm_list` — all VMs cluster-wide
3. `proxmox_ct_list` — all CTs cluster-wide

### Step 2: Get physical resources per node (parallel)
For each node:
- `proxmox_node_resources` — physical CPU count, total RAM, current utilization

### Step 3: Calculate overcommit per node

For each node:
1. Sum **allocated CPU cores** across all VMs and CTs assigned to that node
2. Sum **allocated RAM** (maxmem) across all VMs and CTs assigned to that node
3. Calculate overcommit ratios:
   - CPU overcommit = allocated vCPUs / physical CPU threads
   - RAM overcommit = allocated RAM / physical RAM

## Output Format

```
NODE RESOURCE ANALYSIS

Node       | Phys CPU | Alloc CPU | CPU OC | Phys RAM | Alloc RAM | RAM OC | CPU% | RAM%
-----------|----------|-----------|--------|----------|-----------|--------|------|------
pve-node1  | 16       | 28        | 1.75x  | 64 GB    | 48 GB     | 0.75x  | 42%  | 71%
pve-node2  | 8        | 22        | 2.75x  | 32 GB    | 52 GB     | 1.63x  | 15%  | 38%

WARNINGS:
  pve-node2: CPU overcommit 2.75x exceeds 2x threshold
  pve-node2: RAM overcommit 1.63x exceeds 1.5x threshold
```

### Thresholds

- **CPU overcommit > 2x** → WARN (flag as yellow/warning)
- **RAM overcommit > 1.5x** → WARN (flag as yellow/warning)
- **CPU utilization > 80%** → WARN
- **RAM utilization > 85%** → WARN

## Notes

- Physical CPU count = `cpuinfo.cpus` from `proxmox_node_status`
- Physical RAM = `memory.total` from `proxmox_node_status`
- Allocated CPU = sum of `cpus` field from all VMs/CTs on that node
- Allocated RAM = sum of `maxmem` from all VMs/CTs on that node
- Run all node resource calls in parallel
