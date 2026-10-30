(() => {
const D = window.JAVA_DATA, V = document.getElementById('view'), $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY = 'javadrill.v1';
let S = {done:{}, star:{}};
try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const total = D.reduce((n, t) => n + t.items.length, 0);
const doneIn = ti => D[ti].items.filter((_, i) => S.done[ti + ':' + i]).length;
const head = () => { $('#overall').textContent = Object.keys(S.done).length + ' of ' + total + ' solved'; };

/* theme */
const root = document.documentElement;
let theme = null; try { theme = localStorage.getItem('javadrill.theme'); } catch (e) {}
root.dataset.theme = theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
$('#theme').onclick = () => {
  const n = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = n; try { localStorage.setItem('javadrill.theme', n); } catch (e) {}
};

/* tiny Java highlighter */
const KW = 'abstract|assert|boolean|break|byte|case|catch|char|class|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|new|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|try|var|void|volatile|while|true|false|null';
const TOK = new RegExp('(\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/)|("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')|\\b(' + KW + ')\\b|\\b(\\d+(?:\\.\\d+)?[LlFfDd]?)\\b|\\b([A-Z]\\w*)\\b', 'g');
function hl(src) {
  let out = '', last = 0, m; TOK.lastIndex = 0;
  while ((m = TOK.exec(src))) {
    out += esc(src.slice(last, m.index));
    out += '<span class="' + (m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : 't') + '">' + esc(m[0]) + '</span>';
    last = TOK.lastIndex;
  }
  return out + esc(src.slice(last));
}

/* home */
function home() {
  V.innerHTML = `<section class="hero"><h1>Simple Java practice questions</h1>
  <p class="lede">Pick a topic below, or search every question at once. Press / to jump to search.</p>
  <div class="find"><input id="q" type="search" placeholder="Search all programs, for example “palindrome”" autocomplete="off" aria-label="Search all programs"><ul id="hits" hidden></ul></div></section>
  <ul class="topics">${D.map((t, ti) => { const d = doneIn(ti), n = t.items.length;
    return `<li><a class="row" href="#/t/${ti}/0"><div><h2>${esc(t.name)}</h2><p>${esc(t.blurb)}</p></div><div class="prog"><b>${d} of ${n} solved</b><i><span style="width:${d / n * 100}%"></span></i></div></a></li>`; }).join('')}</ul>
  <p class="note">Your progress and stars are saved in this browser only.</p>`;
  const q = $('#q'), hits = $('#hits');
  q.oninput = () => {
    const s = q.value.trim().toLowerCase();
    if (!s) { hits.hidden = true; return; }
    const r = []; D.forEach((t, ti) => t.items.forEach((it, i) => { if (it.q.toLowerCase().includes(s)) r.push([ti, i, it.q]); }));
    hits.hidden = false;
    hits.innerHTML = r.length
      ? r.slice(0, 8).map(([ti, i, x]) => `<li><a href="#/t/${ti}/${i}">${esc(x)}<small>${esc(D[ti].name)}</small></a></li>`).join('') + (r.length > 8 ? `<li class="more">${r.length - 8} more. Keep typing to narrow the list.</li>` : '')
      : '<li class="more">No program matches that. Try a shorter word.</li>';
  };
}

/* topic workspace */
let cur = {t: -1, i: 0, show: false, ran: false}, flt = 'all';
function draw(focus) {
  const ti = cur.t, i = cur.i, T = D[ti], it = T.items[i], k = ti + ':' + i, n = T.items.length;
  const pal = T.items.map((x, j) => { const kk = ti + ':' + j;
    if (!(flt === 'all' || (flt === 'todo' && !S.done[kk]) || (flt === 'star' && S.star[kk]))) return '';
    return `<a class="pk${j === i ? ' on' : ''}${S.done[kk] ? ' ok' : ''}${S.star[kk] ? ' st' : ''}" href="#/t/${ti}/${j}" title="${esc(x.q)}" aria-label="Question ${j + 1}${S.done[kk] ? ', solved' : ''}">${j + 1}</a>`; }).join('') || '<p class="none">No questions match this filter yet.</p>';
  const prev = i > 0 ? `#/t/${ti}/${i - 1}` : null;
  const next = i < n - 1 ? `#/t/${ti}/${i + 1}` : (ti < D.length - 1 ? `#/t/${ti + 1}/0` : null);
  V.innerHTML = `<a class="back" href="#/">Back to all topics</a><h1 class="th">${esc(T.name)}</h1>
  <div class="wrap"><aside><div class="seg" role="group" aria-label="Filter questions">${[['all','All'],['todo','Unsolved'],['star','Starred']].map(([v, l]) => `<button data-f="${v}" aria-pressed="${flt === v}">${l}</button>`).join('')}</div>
  <nav class="pal" aria-label="Questions">${pal}</nav><p class="tally">${doneIn(ti)} of ${n} solved</p></aside>
  <article class="work"><p class="meta">Question ${i + 1} of ${n}</p><h2>${esc(it.q)}</h2>
  <div class="acts"><button class="btn pri" id="rv">${cur.show ? 'Hide solution' : 'Reveal solution'}</button><button class="btn" id="dn" aria-pressed="${!!S.done[k]}">${S.done[k] ? 'Solved' : 'Mark as solved'}</button><button class="btn" id="sr" aria-pressed="${!!S.star[k]}">${S.star[k] ? 'Starred' : 'Star for later'}</button></div>
  ${cur.show ? `<div class="win"><div class="wh"><span>Main.java</span><span><button id="cp">Copy</button><button id="dl">Download</button></span></div><pre><code>${hl(it.code)}</code></pre></div>
  <p class="why">${esc(it.why)}</p><button class="btn" id="rn">${cur.ran ? 'Run again' : 'Run program'}</button>
  ${cur.ran ? `<div class="term"><p>$ javac Main.java &amp;&amp; java Main</p><pre>${esc(it.out)}</pre><small>Sample output. It changes if you change the input values.</small></div>` : ''}`
  : '<p class="hint">Write it yourself first. The solution is one click away when you need it. Shortcut: press R.</p>'}
  <div class="pn"><a class="btn${prev ? '' : ' off'}" href="${prev || '#/'}">Previous</a><a class="btn${next ? '' : ' off'}" href="${next || '#/'}">${i === n - 1 && next ? 'Next topic' : 'Next'}</a></div></article></div>`;
  V.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { flt = b.dataset.f; draw(); });
  $('#rv').onclick = () => { cur.show = !cur.show; if (!cur.show) cur.ran = false; draw('rv'); };
  $('#dn').onclick = () => { S.done[k] ? delete S.done[k] : S.done[k] = 1; save(); head(); draw('dn'); };
  $('#sr').onclick = () => { S.star[k] ? delete S.star[k] : S.star[k] = 1; save(); draw('sr'); };
  if (cur.show) {
    $('#rn').onclick = () => { cur.ran = true; draw('rn'); };
    $('#cp').onclick = e => { navigator.clipboard.writeText(it.code).then(() => e.target.textContent = 'Copied', () => e.target.textContent = 'Copy failed'); };
    $('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([it.code], {type: 'text/plain'})); a.download = 'Main.java'; a.click(); URL.revokeObjectURL(a.href); };
  }
  if (focus) { const f = document.getElementById(focus); if (f) f.focus(); }
}

/* routing + keys */
function route() {
  const p = location.hash.replace(/^#\/?/, '').split('/');
  if (p[0] === 't' && D[+p[1]]) {
    const ti = +p[1], i = Math.min(Math.max(+p[2] || 0, 0), D[ti].items.length - 1);
    if (cur.t !== ti) window.scrollTo(0, 0);
    if (cur.t !== ti || cur.i !== i) { cur = {t: ti, i: i, show: false, ran: false}; if (cur.t !== ti) flt = 'all'; }
    draw();
  } else { cur.t = -1; window.scrollTo(0, 0); home(); }
  head();
}
addEventListener('hashchange', route);
addEventListener('keydown', e => {
  if (e.target.matches('input,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (cur.t < 0) { if (e.key === '/') { e.preventDefault(); const q = $('#q'); if (q) q.focus(); } return; }
  const n = D[cur.t].items.length;
  if (e.key === 'ArrowRight' && cur.i < n - 1) location.hash = `#/t/${cur.t}/${cur.i + 1}`;
  if (e.key === 'ArrowLeft' && cur.i > 0) location.hash = `#/t/${cur.t}/${cur.i - 1}`;
  if (e.key.toLowerCase() === 'r') $('#rv').click();
});
route();
})();
