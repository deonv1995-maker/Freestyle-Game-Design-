# Idea Log

Use this file to preserve experiments without turning every thought into permanent architecture.

## Status labels

- **Seed** — interesting idea, not yet tested.
- **Prototype** — currently being implemented or tested.
- **Keep** — experiment worked and belongs in the evolving project.
- **Rework** — promising, but the implementation or design needs another pass.
- **Park** — not useful now, but worth preserving.
- **Reject** — tested and intentionally abandoned.

## Prototype — Spear Relay traversal

**Status:** Prototype

**Idea:** A 2D character traverses the world by throwing a spear. The player presses and drags to aim and control power, releases to throw, then watches the camera follow the flying spear. Pressing again relocates the character to the spear's current position and immediately starts the next aim.

**Question being tested:** Is repeated throw -> camera chase -> mid-flight relocation -> re-aim satisfying enough to become a core movement mechanic?

**Smallest playable implementation:** One character, one spear, ballistic flight, camera follow, repeated touch relay, simple prototype world reference grid and no collision.

**Result:** Awaiting device playtest.

**Next decision after testing:** Keep, Rework, Park or Reject based on aiming feel, camera readability and whether chaining throws is enjoyable.
