# Outage Connect

A Pipe Mania-style puzzle game for The Daily Nebraskan. Rotate network cables to reconnect servers to services (email, banking, airlines, 911 dispatch...) before the timer runs out. Every level is generated from a random spanning tree, so it is always solvable, and levels get bigger, add a second server, and lock some cables.

Files: `index.html`, `style.css`, `game.js` (no build step, no dependencies).

## Publish on GitHub Pages

Push this folder to the `sophiasfarrell.github.io` repo. It will be live at:

    https://sophiasfarrell.github.io/Outage_Connect/

## Embed on dailynebraskan.com

Use the `?embed=1` URL (hides the site header and footer, since the host page already has them):

```html
<iframe src="https://sophiasfarrell.github.io/Outage_Connect/?embed=1"
        title="Outage Connect game" width="100%" height="900"
        style="border:0;max-width:1000px" loading="lazy"></iframe>
```

## Tuning

Level difficulty lives in `levelConfig()` in `game.js` (grid size, servers, services, locked ratio, time). Add or edit services in the `SERVICES` list.

Branding note: the masthead is a text approximation (UnifrakturCook font, Nebraska red). Swap in the official logo image in `index.html` if you have permission and the file.
