#!/bin/bash
# Configure DNS on EC2 instance to use Google public DNS
# Fixes SERVFAIL errors when instance uses AWS metadata service DNS (100.100.100.100)

set -e

# Update resolv.conf with Google's public DNS servers
cat > /etc/resolv.conf <<EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF

# Configure DHCP client to use Google DNS persistently across reboots
cat > /etc/dhcp/dhclient.conf <<EOF
supersede domain-name-servers 8.8.8.8, 8.8.4.4;
EOF

# Verify DNS is working by resolving www.google.com
/usr/bin/nslookup www.google.com 8.8.8.8 > /dev/null && echo "DNS configured successfully" || echo "DNS configuration failed"

# ---- SWAP CONFIGURATION (2GB) ----
# t3.micro has 1GB RAM; swap absorbs transient spikes from n8n video uploads (~500MB)
# Without swap, the kernel OOM-killer fires and can kill sshd, making the instance unrecoverable
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
fi
swapon /swapfile 2>/dev/null || true
if ! grep -q '/swapfile' /etc/fstab; then
  echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
fi
# Only use swap under real memory pressure (default 60 is too aggressive)
echo 10 > /proc/sys/vm/swappiness
echo 'vm.swappiness=10' >> /etc/sysctl.d/99-swap.conf
# Keep inode/dentry cache in RAM longer
echo 50 > /proc/sys/vm/vfs_cache_pressure
echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.d/99-swap.conf
echo "Swap configured successfully"
