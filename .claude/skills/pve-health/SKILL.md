---
name: pve-health
description: Quick health check of the Proxmox VE cluster
disable-model-invocation: true
---

# pve-health — Proxmox VE Cluster Health Check

Run a traffic-light health dashboard across all major cluster subsystems.

## Workflow

Run the following tools **in parallel**:

1. `proxmox_node_list` — node online/offline status
2. `proxmox_cluster_status` — quorum status, cluster name
3. `proxmox_storage_list` — storage enabled/disabled
4. `proxmox_ceph_status` — Ceph health (catch 501 = not installed, treat as N/A)
5. `proxmox_diag_services` — system service status on each node
6. `proxmox_node_disks` — disk health indicators

## Output Format

Present a traffic-light dashboard with one row per subsystem:

```
Subsystem      Status   Details
-----------    ------   -------
Nodes          GREEN    3/3 online
Cluster        GREEN    quorum OK, cluster: pve-cluster
Storage        GREEN    5 storages active
Ceph           N/A      Ceph not installed
Services       YELLOW   1 service degraded: pve-ha-lrm
Disks          GREEN    All disks healthy
```

### Traffic Light Rules

- **GREEN** — all checks pass, no issues
- **YELLOW** — minor issues, non-critical (degraded service, storage near capacity)
- **RED** — critical issue (node offline, quorum lost, storage unavailable, disk failure)
- **N/A** — feature not available (e.g., Ceph not installed — 501 response)

## Notes

- If `proxmox_ceph_status` returns a 501 or "not installed" message, display N/A — do not treat as RED
- For `proxmox_storage_list`, check the `enabled` and `active` fields
- For `proxmox_diag_services`, flag any services with state other than `running` or `active`
- Run all tool calls in parallel for speed
