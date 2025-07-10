import ms from "ms";

export const getFormattedTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days >= 365) {
        return Math.floor(days / 365) + 'y';
      } else if (days >= 30) {
        return Math.floor(days / 30) + 'mo';
      } else {
        return ms(diff);
      }
};
