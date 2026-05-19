#!/bin/bash

# Security Setup Script for Ubuntu/Debian Servers
# Usage: sudo ./setup_security.sh

# Ensure script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo ./setup_security.sh)"
  exit
fi

echo "Starting Security Setup..."

# ----------------------------------------------------
# 1. Update System & Install Basics
# ----------------------------------------------------
echo "[1/4] Updating System..."
apt update && apt upgrade -y

# ----------------------------------------------------
# 2. ClamAV (Antivirus) Setup
# ----------------------------------------------------
echo "[2/4] Installing & Configuring ClamAV..."
apt install -y clamav clamav-daemon

# Stop daemon to update signatures manually first
systemctl stop clamav-freshclam
echo "Updating Virus Definitions (this may take a while)..."
freshclam
systemctl start clamav-freshclam
systemctl enable clamav-freshclam

# Setup Daily Full Scan Cron Job
echo "Creating Daily Scan Cron Job..."
cat <<EOF > /etc/cron.daily/clamav-scan
#!/bin/bash
LOG_FILE="/var/log/clamav/daily_scan.log"
# Scan entire system excluding virtual filesystems
/usr/bin/clamscan -r / --exclude-dir="^/sys" --exclude-dir="^/dev" --exclude-dir="^/proc" --quiet -l \$LOG_FILE
EOF

chmod +x /etc/cron.daily/clamav-scan
echo "Daily scan scheduled (/etc/cron.daily/clamav-scan)."

# ----------------------------------------------------
# 3. Auto-Updates (Unattended Upgrades)
# ----------------------------------------------------
echo "[3/4] Setting up Automatic Security Updates..."
apt install -y unattended-upgrades
# Enable likely properly via dpkg-reconfigure non-interactive
echo "unattended-upgrades unattended-upgrades/enable_auto_updates boolean true" | debconf-set-selections
dpkg-reconfigure -f noninteractive unattended-upgrades

# ----------------------------------------------------
# 4. Fail2Ban (Intrusion Prevention)
# ----------------------------------------------------
echo "[4/4] Installing Fail2Ban..."
apt install -y fail2ban
# Create local config
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl start fail2ban

echo "----------------------------------------------------"
echo "Security Setup Completed Successfully!"
echo "----------------------------------------------------"
echo "INSTALLED:"
echo " - ClamAV (Antivirus & Daily Scan)"
echo " - Unattended Upgrades (Auto Security Patches)"
echo " - Fail2Ban (Brute Force Protection)"
echo ""
echo "NEXT STEPS:"
echo "1. Verify SSH access matches verified ports."
echo "2. Configure UFW (Firewall) if not already done:"
echo "   sudo ufw allow ssh"
echo "   sudo ufw allow http"
echo "   sudo ufw allow https"
echo "   sudo ufw enable"
echo "----------------------------------------------------"
