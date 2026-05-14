import WebTorrent from 'webtorrent';
const client = new WebTorrent();
const magnet1 = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel';
const magnet2 = 'magnet:?xt=urn:btih:9f9165d9a281a9b8e782cd5176bbcc8256fd1871&dn=Tears+of+Steel';
client.add(magnet1);
client.add(magnet2);
setTimeout(() => {
  console.log('Torrents:', client.torrents.map(t => t.infoHash));
  process.exit(0);
}, 2000);
