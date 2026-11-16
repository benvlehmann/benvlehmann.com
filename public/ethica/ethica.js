
(function () {
  var tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip);
  function show(a, html) {
    tip.innerHTML = html; tip.style.display = 'block';
    var r = a.getBoundingClientRect(), w = document.documentElement.clientWidth;
    tip.style.top = (r.bottom + window.scrollY + 6) + 'px';
    tip.style.left = Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + w - tip.offsetWidth - 8)) + 'px';
  }
  document.addEventListener('mouseover', function (e) {
    var a = e.target.closest && e.target.closest('a.xref, a.nref'); if (!a) return;
    if (a.classList.contains('nref')) {
      var li = document.getElementById(a.getAttribute('href').slice(1)); if (!li) return;
      var c = li.cloneNode(true), back = c.querySelector('.back'); if (back) back.remove();
      show(a, c.innerHTML);
    } else if (a.dataset.p) {
      var d = document.createElement('div'); d.textContent = a.dataset.p; show(a, d.innerHTML);
    }
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest && e.target.closest('a.xref, a.nref')) tip.style.display = 'none';
  });
})();
(function () {
  var b = document.body, key = 'ethica-view';
  function set(v) { b.classList.remove('only-la', 'only-en'); if (v !== 'both') b.classList.add('only-' + v);
    document.querySelectorAll('.sw button').forEach(function (x) { x.classList.toggle('on', x.dataset.v === v); });
    try { localStorage.setItem(key, v); } catch (e) {} }
  document.querySelectorAll('.sw button').forEach(function (x) { x.addEventListener('click', function () { set(x.dataset.v); }); });
  var v = 'both'; try { v = localStorage.getItem(key) || 'both'; } catch (e) {}
  set(v);
})();
