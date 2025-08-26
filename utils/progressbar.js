module.exports = {
  progressbar: function (player) {
    const size = 15;
    const line = "▬";
    const slider = "🔘";

    if (!player.current) return slider + line.repeat(size - 1);

    const current = player.position || 0;
    const total = player.current.length || 0;

    // Prevent division by zero
    if (total === 0) return slider + line.repeat(size - 1);

    // Calculate bar position (clamped between 0 and size)
    const progress = Math.min(Math.max(0, current / total), 1);
    const bar = Math.floor(progress * size);

    // Return the progress bar string
    return line.repeat(bar) + slider + line.repeat(size - 1 - bar);
  },
};
