/**
 * Devuelve la mejor URL de imagen para el juego
 * @param {string} code - código del juego (p.ej. "PC-AEDE-2019")
 * @param {string[]} files - lista de archivos del juego ["PORTADA.jpg","age3.jpg", ...]
 */
function bestCoverUrl(code, files) {
  if (!files || !files.length) return 'img/placeholder_600x320.png';
  const cover = files.find(f => /portada/i.test(f)) || files[0];
  return `/uploads/${code}/${cover}`;
}
window.bestCoverUrl = bestCoverUrl;

