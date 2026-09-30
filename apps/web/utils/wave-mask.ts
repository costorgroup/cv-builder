/** Wave paths in a 1440×120 box; the filled side is what stays visible. */
const WAVE_PATHS = {
  bottom: "M0 0H1440V64C1260 118 1080 118 900 82S540 18 360 38 120 104 0 76Z",
  top: "M0 120H1440V56C1260 2 1080 2 900 38S540 102 360 82 120 16 0 44Z",
};

const waveImage = (edge: keyof typeof WAVE_PATHS) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none"><path d="${WAVE_PATHS[edge]}"/></svg>`,
  )}")`;

/**
 * CSS `mask` that cuts a wave into one edge of a block, so whatever is behind
 * it shows through. `height` is the wave's depth; the block needs that much
 * extra padding on the wavy edge.
 */
export const waveMask = (edge: keyof typeof WAVE_PATHS, height: string) => `
  mask:
    linear-gradient(#000, #000) ${edge === "bottom" ? "top" : "bottom"} / 100% calc(100% - ${height} + 1px) no-repeat,
    ${waveImage(edge)} ${edge} / 100% ${height} no-repeat;
`;
