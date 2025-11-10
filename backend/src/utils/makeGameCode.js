export function makeGameCode(platform, title, release_date) {
  const year = new Date(release_date).getFullYear();
  const initials = title
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9\s]/g,'')
    .split(/\s+/).filter(w => w.length >= 3)
    .map(w => w[0].toUpperCase()).join('');
  let abbr = initials.slice(0,5);
  if (abbr.length < 3) {
    const flat = title.replace(/[^a-zA-Z0-9]/g,'').toUpperCase();
    abbr = (abbr + flat).slice(0,5);
  }
  return `${platform}-${abbr}-${year}`;
}
