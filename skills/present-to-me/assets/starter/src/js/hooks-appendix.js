/* ===== Appendix: the questions page and the source registry ===== */

/* ---------- questions: the rows are QA in sources.js ---------- */
H.qa = {
  enter() {
    const g = $('#qaGrid'); if (g.childElementCount) return;
    QA.forEach(([q, a]) => { const d = document.createElement('details'), s = document.createElement('summary'), p = document.createElement('p'); s.textContent = q; p.textContent = a; d.append(s, p); g.appendChild(d); });
    const all = [...g.children];
    all.forEach(d => d.addEventListener('toggle', () => { if (d.open) all.forEach(o => { if (o !== d) o.open = false; }); }));
  }
};

/* ---------- sources: the registry, grouped, with the slide numbers that use each entry ---------- */
// a long list steps its type down until it fits its card; below 13px the check reports it and the deck needs a second sources page
function fitList(el) { let size = 18; el.style.fontSize = ''; while (el.scrollHeight > el.clientHeight + 1 && size > 13) el.style.fontSize = --size + 'px'; }
H.sources = {
  enter() {
    const ul = $('#srcReg'), done = ul.childElementCount > 0;
    requestAnimationFrame(() => $$('#sources .srcby, #sources .srcreg').forEach(fitList));
    if (done) return;
    const numOf = id => { const i = Deck.slides.findIndex(s => s.id === id); return i < 0 ? null : i + 1; };
    SOURCE_GROUPS.forEach(([key, name]) => {
      const head = document.createElement('li'); head.className = 'grp'; head.textContent = name; ul.appendChild(head);
      SOURCES.filter(s => s[1] === key).forEach(([, , title, url, used]) => {
        const li = document.createElement('li');
        if (url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = title; li.appendChild(a); } else li.textContent = title;
        const sm = document.createElement('small'); sm.textContent = 'slides ' + used.map(numOf).filter(Boolean).join(', ') + (url ? '' : ' · given to us, no public link'); li.appendChild(sm);
        ul.appendChild(li);
      });
    });
  }
};
