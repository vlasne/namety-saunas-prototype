/* Search is shared by both languages; its pure functions are also used by the focused tests. */
(function (root) {
  'use strict';
  const groups = {
    parking: 'паркування парковка парковки паркінг парковаться паркувати припаркувати стоянка стоянки parking park',
    generator: 'генератор генератора генератори generator generators',
    electricity: 'електрика електрики електроенергія електроенергії електричества электричество электричества світло світла свет света electricity power',
    outage: 'відключення відключень відключенні отключение отключения отключений outage outages blackout blackouts',
    checkin: 'заїзд заїзду заїхати заселення заселенні заезд заезда заехать заселение checkin arrival arriving',
    checkout: 'виїзд виїзду виїхати виселення выезд выезда выселение checkout departure',
    pets: 'улюбленець улюбленцем тварини тварина тваринами тварин собака собакою собакой собаки пес пёс кіт кот котом кішка кошка кошкой животные животными питомец питомцем pets pet dog dogs cat cats',
    children: 'дитина дитиною дитину діти дітей дітям дитячий ребенок ребёнок ребенком ребёнком дети детьми child children kid kids baby babies',
    cot: 'ліжечко ліжечка кроватка кроватки cot cots crib cribs',
    breakfast: 'сніданок сніданку сніданки сніданків завтрак завтрака завтраки breakfast breakfasts',
    meals: 'їжа їжі харчування еда еды питание food meals meal',
    payment: 'оплата оплати оплатити сплатити оплатить платить payment payments pay',
    prepayment: 'передоплата передоплати передплата передплати предоплата предоплаты аванс завдаток prepayment deposit',
    cancellation: 'скасувати скасування скасуванні відмінити відміна отмена отменить отмены cancel cancelled canceled cancelling cancellation',
    refund: 'повернення повернути возврат вернуть refund refunds',
    sauna: 'сауна сауну сауни саун сауні баня баню бане парна парної парну парній sauna saunas',
    tub: 'чан чани чанів чаном чану чані tub tubs ofuro офуро',
    towels: 'рушник рушники рушників полотенце полотенца towels towel',
    robes: 'халат халати халатів халаты robes robe bathrobe bathrobes',
    slippers: 'капці капців тапки тапочки slippers',
    shelter: 'укриття укритті укрытие убежище бомбоубежище shelter shelters',
    alert: 'тривога тривоги тривогу тревога тревоги alert alerts',
    certificate: 'сертифікат сертифіката сертифікати сертифікатом сертификат сертификаты сертификатом certificate certificates voucher vouchers',
    booking: 'бронювання забронювати забронювать бронь бронюванням бронюванні забронировать бронирование booking bookings book reserve reservation',
    price: 'вартість вартості ціна ціни ціну цена цены стоимость price prices cost costs',
    cabin: 'будиночок будиночку будиночка будиночки будиночків домик домика домики домике cabin cabins',
    warm: 'тепло теплий тепла теплої обігрів обігріву опалення отопление отопления warm heating heated',
    winter: 'зима зими взимку зимою зимой winter',
    night: 'ніч вночі ночі ночівля ночівлі ночёвка ночевка ночевки ночівлею ночівлю overnight night nights',
    duration: 'тривалість тривалості продолжительность длительность duration',
    hour: 'година години годин годину час часа часов hours hour',
    location: 'адреса адресу адреси адрес адресом розташований розташування location address',
    directions: 'дістатися доїхати дорога дороги маршрут маршрутом проїзд проезд доехать добраться directions route',
    invoice: 'рахунок рахунком рахунку счет счёт счету счёту invoice invoices'
  };
  const aliases = new Map();
  for (const [key, words] of Object.entries(groups)) for (const word of words.split(' ')) aliases.set(word, key);
  const stopwords = new Set(('чи є як яка який які де коли о котрій та і й або у в на до з із зі за для про це ви ми мені нам нас вас можна потрібно будь ласка а the a an is are do does can could how what when where i we you my our your at to for of in on and or please чи ли есть как какой какая какие где когда во на из с со по для мне нам можно пожалуйста').split(' '));
  function normalize(value) {
    return String(value).normalize('NFKC').toLocaleLowerCase()
      .replace(/[’'`ʼ]/gu, '')
      .replace(/\bcheck[\s-]+in\b/gu, 'checkin').replace(/\bcheck[\s-]+out\b/gu, 'checkout')
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ')
      .replace(/[\p{L}\p{N}]+/gu, word => /[а-яіїєґ]/u.test(word) ? word.replace(/[aceiopxy]/g, c=>({a:'а',c:'с',e:'е',i:'і',o:'о',p:'р',x:'х',y:'у'}[c])) : word);
  }
  const words = value => normalize(value).split(' ').filter(Boolean);
  const canonical = word => aliases.get(word) || word;
  function oneEdit(a, b) {
    if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1 || /\d/.test(a+b)) return false;
    if (a === b) return true;
    let i=0, j=0, edits=0;
    while (i<a.length && j<b.length) {
      if (a[i]===b[j]) { i++; j++; continue; }
      if (++edits>1) return false;
      if (a.length===b.length && a[i]===b[j+1] && a[i+1]===b[j]) { i+=2; j+=2; }
      else if (a.length>b.length) i++;
      else if (b.length>a.length) j++;
      else { i++; j++; }
    }
    return edits + (i<a.length || j<b.length ? 1 : 0) <= 1;
  }
  function wordMatches(queryWord, candidateWord) {
    if (canonical(queryWord)===canonical(candidateWord)) return true;
    // Prefix matching supports inflections without matching short pieces such as "cat" in "location".
    if (/^[а-яіїєґ]+$/u.test(queryWord) && /^[а-яіїєґ]+$/u.test(candidateWord) && Math.min(queryWord.length,candidateWord.length)>=5 && Math.abs(queryWord.length-candidateWord.length)<=3 && (queryWord.startsWith(candidateWord)||candidateWord.startsWith(queryWord))) return true;
    return oneEdit(queryWord,candidateWord) || oneEdit(canonical(queryWord),canonical(candidateWord));
  }
  function queryWords(query) { return [...new Set(words(query).filter(w=>!stopwords.has(w)))]; }
  function index(text) { return [...new Set(words(text))]; }
  function matches(query, candidates) {
    const terms=Array.isArray(query)?query:queryWords(query);
    const haystack=Array.isArray(candidates)?candidates:index(candidates);
    return terms.every(term=>haystack.some(word=>wordMatches(term,word)));
  }
  function relevance(query, fields) {
    const terms=Array.isArray(query)?query:queryWords(query);
    if(!terms.length)return 0;
    const fieldWords=name=>Array.isArray(fields[name])?fields[name]:index(fields[name]||'');
    const title=fieldWords('title'), answer=fieldWords('answer'), keywords=fieldWords('keywords');
    function quality(term, candidates) {
      if(candidates.includes(term))return 4;
      if(candidates.some(word=>canonical(term)===canonical(word)))return 3;
      return candidates.some(word=>wordMatches(term,word))?1:0;
    }
    // A matching visible question is more useful than the same word buried in an answer or metadata.
    const score=terms.reduce((sum,term)=>sum+Math.max(quality(term,title)*10,quality(term,answer)*2,quality(term,keywords)*.5),0);
    return score+(terms.every(term=>quality(term,title)>0)?20:0);
  }
  const search = {normalize, queryWords, index, matches, wordMatches, oneEdit, relevance};
  if (typeof module==='object' && module.exports) { module.exports=search; return; }
  if (!root.document) return;

  const document=root.document;
  const input=document.getElementById('faq-search');
  if (!input) return;
  const en=document.documentElement.lang==='en';
  const clear=document.querySelector('.clear-search');
  const reset=document.querySelector('.reset-search');
  const searchAll=document.querySelector('.search-all');
  const select=document.getElementById('topic-select');
  const sections=[...document.querySelectorAll('.faq-section')];
  const items=[...document.querySelectorAll('details.faq-item')];
  const topics=[...document.querySelectorAll('.topic-link[data-topic]')];
  const status=document.getElementById('result-status');
  const empty=document.querySelector('.empty-state');
  // Keep adjacent fact labels and values separate even when HTML has no whitespace.
  function searchableText(container) {
    if(!container)return '';
    const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);
    const parts=[];
    while(walker.nextNode())parts.push(walker.currentNode.nodeValue);
    return parts.join(' ');
  }
  const records=items.map((item,order)=>{
    const fields={title:index(searchableText(item.querySelector('summary'))),answer:index(searchableText(item.querySelector('.answer-content')||item.querySelector('.answer'))),keywords:index(item.dataset.keywords||'')};
    return {item,order,section:item.closest('.faq-section'),fields,words:[...new Set([...fields.title,...fields.answer,...fields.keywords])],score:0};
  });
  const sectionRecords=sections.map((section,order)=>({section,order,records:records.filter(record=>record.section===section)}));
  let category='all';
  let previousQuery='';
  const copyTimers=new WeakMap();

  function removeHighlights(item) {
    item.querySelectorAll('mark.search-highlight').forEach(mark=>{const parent=mark.parentNode;mark.replaceWith(document.createTextNode(mark.textContent));parent.normalize();});
  }
  function highlight(item, terms) {
    const roots=[item.querySelector('.question-text')||item.querySelector('summary'), item.querySelector('.answer-content')].filter(Boolean);
    roots.forEach(container=>{
      const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);
      const nodes=[];
      while(walker.nextNode()) if(walker.currentNode.nodeValue.trim() && !walker.currentNode.parentElement.closest('button,script,style,mark')) nodes.push(walker.currentNode);
      nodes.forEach(node=>{
        const text=node.nodeValue;
        const tokens=[...text.matchAll(/[\p{L}\p{N}]+(?:[’'ʼ`-][\p{L}\p{N}]+)*/gu)];
        const found=tokens.filter(token=>words(token[0]).some(word=>terms.some(term=>wordMatches(term,word))));
        if(!found.length) return;
        const fragment=document.createDocumentFragment();let start=0;
        found.forEach(token=>{fragment.append(document.createTextNode(text.slice(start,token.index)));const mark=document.createElement('mark');mark.className='search-highlight';mark.textContent=token[0];fragment.append(mark);start=token.index+token[0].length;});
        fragment.append(document.createTextNode(text.slice(start)));node.replaceWith(fragment);
      });
    });
  }
  function update() {
    const terms=queryWords(input.value);let count=0,globalCount=0;
    records.forEach(record=>{
      removeHighlights(record.item);
      const found=matches(terms,record.words);if(found)globalCount++;
      record.score=found?relevance(terms,record.fields):-1;
      const visible=found&&(category==='all'||record.item.dataset.category===category);
      record.item.hidden=!visible;
      if(visible){count++;if(terms.length){record.item.open=true;highlight(record.item,terms);}}
      if(!terms.length&&previousQuery)record.item.open=false;
    });
    previousQuery=terms.join(' ');
    const sectionOrder=sectionRecords.map(group=>{
      const sorted=[...group.records].sort((a,b)=>terms.length?(Number(a.item.hidden)-Number(b.item.hidden)||b.score-a.score||a.order-b.order):a.order-b.order);
      sorted.forEach(record=>group.section.appendChild(record.item));
      const visible=group.records.filter(record=>!record.item.hidden);
      group.section.hidden=visible.length===0;
      return {...group,score:visible.length?Math.max(...visible.map(record=>record.score)):-1};
    }).sort((a,b)=>terms.length?(b.score-a.score||a.order-b.order):a.order-b.order);
    sectionOrder.forEach(group=>empty.parentNode.insertBefore(group.section,empty));
    topics.forEach(topic=>{if(topic.dataset.topic===category)topic.setAttribute('aria-current','true');else topic.removeAttribute('aria-current');});
    if(select)select.value=category;
    status.textContent=terms.length?(en?`Found: ${count}`:`Знайдено: ${count}`):(en?`Questions: ${count}`:`Запитань: ${count}`);
    empty.hidden=count!==0;
    clear.hidden=!input.value;
    reset.hidden=category==='all'&&!input.value;
    if(searchAll){searchAll.hidden=!(count===0&&category!=='all'&&globalCount>0);searchAll.textContent=en?`Search all topics (${globalCount})`:`Шукати в усіх темах (${globalCount})`;}
  }
  function collapse() {items.forEach(item=>item.open=false);}
  function resetAll() {input.value='';category='all';collapse();update();}
  function setCategory(value, navigate=true) {
    category=value;collapse();update();
    if(navigate){history.pushState(null,'','#'+(category==='all'?'questions':category));document.querySelector('.answers').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  }
  input.addEventListener('input',update);
  clear.addEventListener('click',()=>{input.value='';collapse();update();input.focus();});
  reset.addEventListener('click',()=>{resetAll();history.replaceState(null,'',location.pathname+location.search);input.focus();});
  if(searchAll)searchAll.addEventListener('click',()=>{category='all';update();history.replaceState(null,'',location.pathname+location.search+'#questions');});
  topics.forEach(topic=>topic.addEventListener('click',event=>{event.preventDefault();setCategory(topic.dataset.topic);}));
  if(select)select.addEventListener('change',()=>setCategory(select.value));
  function revealHash(scroll=true) {
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    if(id==='planning')id='safety';
    if(!id||id==='questions'){resetAll();return;}
    const target=document.getElementById(id);if(!target)return;
    if(target.matches('.faq-item')){resetAll();target.open=true;if(scroll)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
    else if(target.matches('.faq-section')){input.value='';setCategory(target.dataset.category,false);}
  }
  document.querySelectorAll('.quick-links a,.permalink').forEach(link=>link.addEventListener('click',()=>{if(link.hash&&location.hash===link.hash)revealHash();}));
  root.addEventListener('hashchange',()=>revealHash());
  root.addEventListener('popstate',()=>revealHash());
  document.querySelectorAll('[data-language-link]').forEach(link=>link.addEventListener('click',()=>{link.href=link.dataset.languageLink+location.hash;}));
  document.querySelectorAll('.copy-link').forEach(button=>button.addEventListener('click',async()=>{
    const tools=button.closest('.question-tools');const feedback=tools.querySelector('.copy-status');const fallback=tools.querySelector('.copy-fallback');
    const url=new URL(location.href);url.search='';url.hash=button.dataset.questionId;
    clearTimeout(copyTimers.get(button));if(feedback)feedback.textContent='';
    try{
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url.href);
      if(fallback)fallback.hidden=true;
      if(feedback)feedback.textContent=en?'Link copied':'Посилання скопійовано';
      copyTimers.set(button,setTimeout(()=>{if(feedback)feedback.textContent='';},4000));
    }catch{
      if(fallback){fallback.hidden=false;const field=fallback.querySelector('input');field.value=url.href;field.focus();field.select();}
      if(feedback)feedback.textContent=en?'Select and copy the link below.':'Виділіть і скопіюйте посилання нижче.';
    }
  }));
  update();revealHash();
})(typeof window!=='undefined'?window:globalThis);
