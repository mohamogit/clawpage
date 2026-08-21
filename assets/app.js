/* Claw Daily — SPA 加载器：顶栏固定，点击日期只替换下方内容区 */
(function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function contentBox() {
    var box = $('#content');
    if (!box) {
      box = document.createElement('main');
      box.id = 'content';
      var page = $('.page') || document.body;
      page.appendChild(box);
    }
    return box;
  }

  function currentDateFromHash() {
    var m = location.hash.match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  }

  function latestDate() {
    // 从所有 archive 链接里取日期最大者（不依赖 cur，cur 可能过期）
    var links = $all('#claw-drop a[href*="/archive/"]');
    var best = null;
    links.forEach(function (a) {
      var m = a.getAttribute('href').match(/(\d{4}-\d{2}-\d{2})/);
      if (m && (!best || m[1] > best)) best = m[1];
    });
    return best;
  }

  function setActive(date) {
    $all('#claw-drop a[href*="/archive/"]').forEach(function (a) {
      var m = a.getAttribute('href').match(/(\d{4}-\d{2}-\d{2})/);
      a.classList.toggle('cur', !!m && m[1] === date);
      a.classList.toggle('link', !m || m[1] !== date);
    });
  }

  function extractSections(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    // 新版 Paper/Ink: <section class="section">；旧版: <div class="section">，两种都兼容
    var secs = $all('section.section', doc);
    if (!secs.length) secs = $all('div.section', doc);
    // 都找不到（旧整页结构）则取整个 .page 内容
    if (!secs.length) {
      var page = $('.page', doc);
      if (page) secs = $all('section, .section', page);
    }
    return secs;
  }

  function load(date) {
    if (!date) date = latestDate();
    if (!date) return;
    var url = '/clawpage/archive/' + date + '.html';
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
        var secs = extractSections(html);
        if (!secs.length) throw new Error('no sections');
        var box = contentBox();
        box.innerHTML = '';
        secs.forEach(function (s) { box.appendChild(s.cloneNode(true)); });
        setActive(date);
        var foot = $('.foot, footer');
        if (foot) foot.textContent = 'Claw Daily News · ' + date;
        if (location.hash !== '#/' + date) history.replaceState(null, '', '#/' + date);
      })
      .catch(function () {
        // 整页回退，保证能打开
        location.href = url;
      });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('#claw-drop a[href*="/archive/"], a.claw-latest') : null;
    if (!a) return;
    e.preventDefault();
    if (a.classList.contains('claw-latest')) {
      // "最新"：SPA 内加载最新日期，不整页跳转
      load(latestDate());
      return;
    }
    var m = a.getAttribute('href').match(/(\d{4}-\d{2}-\d{2})/);
    if (m) load(m[1]);
  });

  window.addEventListener('hashchange', function () {
    var d = currentDateFromHash();
    if (d) load(d);
  });

  // 初始：hash 有日期则加载；否则保持内嵌内容（archive 页）或加载最新（index 页）
  var init = currentDateFromHash();
  if (init) { load(init); }
  else if (!document.querySelector('#content section.section')) {
    load(latestDate());
  }
})();
