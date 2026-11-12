function createFunConversions({ root, items, writeText }) {
  const list = root.querySelector('.fun-fact');
  const title = root.querySelector('.fun-title');
  const owner = root.ownerDocument;
  const entries = [];
  let mounted = false;
  title.setAttribute('data-date-context', '');

  function mount() {
    if (mounted) return;
    const fragment = owner.createDocumentFragment();
    for (const item of items) {
      const node = owner.createElement('span');
      node.className = 'fun-item';
      const icon = owner.createElement('span');
      icon.className = 'fun-icon';
      icon.textContent = item.emoji;
      const copy = owner.createElement('span');
      copy.className = 'fun-copy';
      const countNode = owner.createElement('span');
      countNode.className = 'fun-count';
      countNode.textContent = '0';
      copy.append(countNode, owner.createTextNode(` ${item.name}`));
      node.append(icon, owner.createTextNode(' '), copy);
      entries.push({ countNode, item, count: 0 });
      fragment.appendChild(node);
    }
    list.replaceChildren(fragment);
    mounted = true;
  }

  function update({ income }) {
    for (const entry of entries) {
      const nextCount = Math.floor(income / entry.item.price);
      if (nextCount === entry.count) continue;
      entry.count = nextCount;
      entry.countNode.textContent = String(nextCount);
    }
  }

  function setContext(atLive) {
    writeText(title, atLive ? '今日已赚可买…' : '当日已赚可买…');
  }

  function destroy() {
    entries.length = 0;
    list.replaceChildren();
    mounted = false;
  }

  return Object.freeze({ mount, update, setContext, destroy });
}
