
(function () {
  var q = document.getElementById('q'), out = document.getElementById('results');
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/j/g, 'i').replace(/v/g, 'u'); }
  function run() {
    var t = norm(q.value.trim()); out.innerHTML = '';
    if (t.length < 3) return;
    var n = 0;
    for (var i = 0; i < SEARCH.length && n < 200; i++) {
      var r = SEARCH[i], la = norm(r.la), en = norm(r.en), k = en.indexOf(t), side = r.en;
      if (k < 0) { k = la.indexOf(t); side = r.la; }
      if (k < 0) continue;
      n++;
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = r.p + '.html#' + r.id; a.textContent = r.l;
      var c = document.createElement('div'); c.className = 'ctx';
      c.textContent = (k > 60 ? '…' : '') + side.substr(Math.max(0, k - 60), 200) + '…';
      li.appendChild(a); li.appendChild(c); out.appendChild(li);
    }
    if (!n) out.innerHTML = '<li>No results.</li>';
  }
  q.addEventListener('input', run);
})();
