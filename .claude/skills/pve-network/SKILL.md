---
name: pve-network
description: Network topology — bridges, VLANs, and VM/CT assignments
disable-model-invocation: true
---

# pve-network — Proxmox VE Network Topology

Map the network topology including bridges, VLANs, bonds, and which VMs/CTs use each interface.

## Workflow

### Step 1: Collect network config per node (parallel)
For each node (from `proxmox_node_list`):
- `proxmox_node_networks` — all interfaces (bridges, VLANs, bonds, physical)

### Step 2: Collect VM/CT network config (parallel)
- `proxmox_vm_list` — all VMs cluster-wide
- `proxmox_ct_list` — all CTs cluster-wide

For each running VM: `proxmox_vm_config` (to get net0, net1, etc.)
For each running CT: `proxmox_ct_config` (to get net0, net1, etc.)

### Step 3: Parse network assignments

Parse `netN` config strings:
- VM format: `virtio=XX:XX:XX:XX:XX:XX,bridge=vmbr0,tag=10`
- CT format: `name=eth0,bridge=vmbr0,tag=20,ip=dhcp`

Extract: bridge name, VLAN tag (if any), MAC address.

## Output Format

```
NETWORK TOPOLOGY

Node: pve-node1
  Interface   Type    CIDR            Slaves/Parent
  ---------   ------  --------------  -------------
  vmbr0       bridge  10.0.0.1/24     eno1
  vmbr1       bridge  192.168.10.1/24 eno2
  vlan10      vlan    —               vmbr1 (tag 10)

Bridge/VLAN → VM/CT Assignment

Bridge  VLAN  VMID  Name         Type  Node
------  ----  ----  -----------  ----  ---------
vmbr0   —     100   webserver    VM    pve-node1
vmbr0   —     200   nginx-proxy  CT    pve-node1
vmbr1   10    101   database     VM    pve-node1
vmbr1   20    201   monitoring   CT    pve-node1
```

## Notes

- Only include running VMs/CTs in the assignment table (stopped VMs may have stale config)
- Multiple NICs per VM/CT should appear as multiple rows
- Physical interfaces (eno1, eth0) are shown under bridge slaves, not as separate rows
- If a bridge has no assigned VMs/CTs, still show it in the interface table
