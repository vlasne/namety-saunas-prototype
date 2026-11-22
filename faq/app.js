(() => {
  const en = document.documentElement.lang === 'en';
  const input = document.getElementById('faq-search');
  const clear = document.querySelector('.clear-search');
  const reset = document.querySelector('.reset-search');
  const sections = [...document.querySelectorAll('.faq-section')];
  const items = [...document.querySelectorAll('.faq-item')];
  const topics = [...document.querySelectorAll('.topic-link')];
  const status = document.getElementById('result-status');
  const empty = document.querySelector('.empty-state');
  let category = 'all';
  const normalize = s => s.toLocaleLowerCase().normalize('NFKC').replace(/[’'`ʼ]/g, '').replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim();
  function update() {
    const tokens = normalize(input.value).split(' ').filter(Boolean);
    let count = 0;
    items.forEach(item => {
      const match = (category === 'all' || item.dataset.category === category) && tokens.every(t => normalize(item.textContent + ' ' + item.dataset.keywords).includes(t));
      item.hidden = !match;
      if (match) count++;
      if (tokens.length) item.open = match;
    });
    sections.forEach(s => { s.hidden = ![...s.querySelectorAll('.faq-item')].some(i => !i.hidden); });
    topics.forEach(t => { if (t.dataset.topic === category) t.setAttribute('aria-current','true'); else t.removeAttribute('aria-current'); });
    status.textContent = tokens.length ? (en ? `Found: ${count}` : `Знайдено: ${count}`) : (en ? `Questions: ${count}` : `Запитань: ${count}`);
    empty.hidden = count !== 0;
    clear.hidden = !input.value;
    reset.hidden = category === 'all' && !tokens.length;
  }
  function clearSearch() {
    input.value = ''; category = 'all'; items.forEach(i => i.open = false); update();
  }
  input.addEventListener('input', () => { category='all'; update(); });
  clear.addEventListener('click', () => { clearSearch(); input.focus(); });
  reset.addEventListener('click', () => { clearSearch(); history.replaceState(null,'',location.pathname); input.focus(); });
  topics.forEach(t => t.addEventListener('click', e => {
    e.preventDefault(); input.value=''; category=t.dataset.topic; items.forEach(i=>i.open=false); update();
    history.pushState(null,'',t.getAttribute('href'));
    document.querySelector('.answers').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }));
  function revealHash(scroll=true) {
    let id; try { id=decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id) { clearSearch(); return; }
    const target = document.getElementById(id);
    if (!target) return;
    if (target.matches('.faq-item')) {
      clearSearch(); target.open=true;
      if (scroll) requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
    } else if(target.matches('.faq-section')) {
      input.value=''; category=target.dataset.category; update();
    } else if (id==='questions') { clearSearch(); }
  }
  document.querySelectorAll('.quick-links a,.permalink').forEach(a=>a.addEventListener('click',()=> {
    if(location.hash===a.hash) revealHash();
  }));
  window.addEventListener('hashchange',()=>revealHash());
  window.addEventListener('popstate',()=>revealHash());
  document.querySelectorAll('[data-language-link]').forEach(a=>a.addEventListener('click',()=> {
    a.href=a.dataset.languageLink+location.hash;
  }));
  update(); revealHash();
})();
