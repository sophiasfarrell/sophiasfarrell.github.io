# Reboot Rush

Retro top-down pixel-art arcade game. You are the only IT technician in a huge server room, and the internet is down. Beat three levels, one outage at a time:

1. **Outlook Mail** (2 servers)
2. **Banking Websites** (3 servers)
3. **FAA Network** (4 servers)

You get 3:00 in total, plus 25 seconds each time you clear a level.

- Move: WASD / arrow keys, or on-screen D-pad on phones. Fix: E / Space, or the A button.
- Collect network cables and RAM chips. Each repair costs 1 RAM chip + 2 cables.
- At a server, match each colored cable to its port (shapes help colorblind players). Wrong port = -2s.
- Dodge angry people (mad about the outage) and zap plates: -5s per hit. Later levels have more people, faster zaps and bigger puzzles.

No build step. Live at https://sophiasfarrell.github.io/Reboot_Rush/
Add `?debug=1` to expose game state as `window.__s` for testing.
