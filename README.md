# Minesweeper: Something Moves

A mobile-first Halloween Minesweeper where the mines move. Under the tiles crawl **Mine Monsters**: each one counts as a mine wherever it is, so every time they move, the numbers next to them change. Lure them out, then use TNT to launch them into pumpkins.

**Play:** https://luisca32.github.io/minesweeper-something-moves/

## How to play

- **Goal:** blow up every monster by launching it into a pumpkin (the mines). Clearing every safe tile also counts as a win, but a lesser one.
- **Difficulties:** all 12×12 with 20 pumpkins. Easy has 1 monster and 4 sticks of TNT, Hard has 2 monsters and 6 sticks, Extreme has 4 monsters and 8 sticks.
- **Numbers lie:** revealed numbers count the pumpkins around a tile plus any monster next to it. Every 3 actions the monsters move, and changed numbers flicker red.
- **Stomp** (tap open ground): every monster within 3 tiles takes a step toward you. Stomp right next to one and it lunges onto that tile and scurries on. Stomp *on* one and it gets you.
- **TNT:** arm it, then tap open ground right next to a monster. It flies away from the blast in a straight line (sometimes veering 45°). A pumpkin blows it up and leaves a crater; a flag or the board edge stops it; another monster gets knocked flying like a bowling pin. Hold your finger on the tile to see where it can fly.

## Controls

| Action | Phone / tablet | Desktop |
| --- | --- | --- |
| Reveal | Tap | Left-click |
| Flag / unflag | Long-press, or Flag mode + tap | Right-click (or Ctrl+click) |
| Stomp | Tap open ground | Click open ground |
| Throw TNT | TNT button, then tap next to a monster (hold to aim, slide off to cancel) | `T`, then click |
| Mute / restart / menu | HUD buttons | `M` / `R` / `Esc` |

Everything (pixel art, monsters, sound) is generated in code inside the single `index.html`: no libraries, images or fonts, and nothing is loaded over the network.

## Hosting

GitHub Pages serves this repository from the `main` branch, folder `/ (root)`. Add `?record=1` to the URL for slightly slower monster tells, handy for recording clips.
