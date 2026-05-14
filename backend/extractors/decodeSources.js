const unpack = (script) => {
    return script;
};

const extractPacked = (html) => {
    const packedRegex = /eval\(function\(p,a,c,k,e,?[d]?\).*?\.split\('\|'\).*?\)/g;
    const matches = html.match(packedRegex);
    return matches || [];
};

module.exports = {
    unpack,
    extractPacked
};
