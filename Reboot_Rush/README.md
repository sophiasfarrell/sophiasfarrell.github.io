# Reboot Rush

Retro top-down pixel-art arcade game. You are the only IT technician in a huge server facility. Fix all 8 broken servers (FAA air traffic, banking, Outlook mail, network) in 3:00.

- Move: WASD / arrow keys, or on-screen D-pad on phones. Fix: E / Space, or the A button.
- Collect cables and replacement chips. Each repair costs 1 chip + 2 cables.
- At a server, match each colored cable to its port (shapes help colorblind players). Wrong port = -2s.
- Avoid electrical zap plates and roaming spark bots (-5s). Difficulty rises with each repair: faster bots, quicker zaps, more hazards, bigger puzzles.

No build step. Deploy by pushing to GitHub Pages: https://sophiasfarrell.github.io/Reboot_Rush/
Add `?debug=1` to expose game state as `window.__s` for testing.
