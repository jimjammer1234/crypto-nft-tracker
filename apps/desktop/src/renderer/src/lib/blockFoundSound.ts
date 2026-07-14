import blockFoundUrl from "../assets/block-found.wav";

/** "YEAAAAAA!" played when a block_found alert arrives. */
export function playBlockFoundSound() {
  new Audio(blockFoundUrl).play().catch(() => {
    // Autoplay can be blocked before the user has interacted with the window at all; not worth surfacing.
  });
}
