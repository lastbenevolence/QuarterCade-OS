# QuarterCade UI Starter (Arch Linux, Electron + Vite + React + Tailwind)

## Quick start (dev)
```bash
sudo pacman -S --needed xorg-server xorg-xinit nodejs npm
cd quartercade-ui
npm install
npm run dev
```

## Build production AppImage
```bash
npm run build
# Output goes to dist/ and an AppImage via electron-builder
```

## Boot without a desktop (autologin + startx)
1. Create/choose user `qc` and enable TTY1 autologin:
```bash
sudo mkdir -p /etc/systemd/system/getty@tty1.service.d
printf "[Service]\nExecStart=\nExecStart=-/sbin/agetty --autologin qc --noclear %I 38400 linux\n" |         sudo tee /etc/systemd/system/getty@tty1.service.d/override.conf
```
2. Minimal X start for Electron:
```bash
echo '#!/bin/bash
xset -dpms s off s noblank
exec /usr/bin/electron /home/qc/quartercade-ui' > /home/qc/.xinitrc
chmod +x /home/qc/.xinitrc

mkdir -p /home/qc/.config/systemd/user
cat > /home/qc/.config/systemd/user/startx.service <<'EOF'
[Unit]
Description=Start X on login
[Service]
Type=simple
ExecStart=/usr/bin/startx
Restart=always
RestartSec=2
[Install]
WantedBy=default.target
EOF

sudo -u qc systemctl --user enable --now startx.service
```

## Notes
- Router uses HashRouter, so deep links work from file://
- Live system stats read from /proc and amdgpu (if available)
- Tailwind prewired; edit styles in your components or src/index.css
- Replace `src/components/Layout.tsx` with your version if you like