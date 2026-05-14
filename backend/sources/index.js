const animeflv = require('./animeflv');
const animeav1 = require('./animeav1');

const sources = {
    [animeflv.id]: animeflv,
    [animeav1.id]: animeav1
};

module.exports = {
    getSource: (id) => sources[id || 'animeflv'] || sources['animeflv'],
    getAllSources: () => Object.values(sources)
};
