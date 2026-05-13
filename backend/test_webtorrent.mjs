import WebTorrent from 'webtorrent';
const client = new WebTorrent();
const t = client.add('magnet:?xt=urn:btih:d23091e4ec6e0e65d72cf603aed29555b15831e5');
console.log('Immediately after add, infoHash is:', t.infoHash);
setTimeout(() => {
    console.log('After 1s, infoHash is:', t.infoHash);
    process.exit(0);
}, 1000);
