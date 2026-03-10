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
