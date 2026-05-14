const extractM3U8FromText = (text) => {
    const regex = /(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i;
    const match = text.match(regex);
    return match ? match[1] : null;
};

const extractMP4FromText = (text) => {
    const regex = /(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i;
    const match = text.match(regex);
    return match ? match[1] : null;
};

module.exports = {
    extractM3U8FromText,
    extractMP4FromText
};
