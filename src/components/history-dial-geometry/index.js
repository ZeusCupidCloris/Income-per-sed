function point(seconds, radius = 112) {
const angle = seconds / 86400 * Math.PI * 2 - Math.PI / 2;
return [140 + Math.cos(angle) * radius, 140 + Math.sin(angle) * radius];
}
function arc(start, end) {
if (end <= start) return '';
const a = point(start), b = point(Math.min(end, start + 86399.99));
return `M${a[0]} ${a[1]}A112 112 0 ${end - start > 43200 ? 1 : 0} 1 ${b[0]} ${b[1]}`;
}
