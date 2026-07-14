import blockFoundUrl from "../assets/block-found.mp3";

/** "Solo" block-win sound (from mining-dutch.nl's dashboard), played when a block_found alert arrives. */
export function playBlockFoundSound() {
  new Audio(blockFoundUrl).play().catch(() => {
    // Autoplay can be blocked before the user has interacted with the window at all; not worth surfacing.
  });
}
