/* ALMOX — shell de app para celular (<= 768px, via CSS)
   Monta a partir do HTML existente:
   - barra superior com título da tela, voltar e notificações
   - abas fixas embaixo (Início, Itens, Solicitar, Pedidos, Mais)
   - folha "Mais" com os demais itens do menu lateral
   - botão flutuante (+) a partir do botão de ação principal da tela
   - rótulos (data-label) nas células para as tabelas virarem cards
   No desktop os elementos injetados ficam ocultos pelo CSS. */
(function () {
  var sidebar = document.querySelector('.sidebar');
  var topbar = document.querySelector('.topbar');
  if (!sidebar || !topbar) return; // telas públicas (login/cadastro) não têm shell

  var body = document.body;
  var current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  // Tema da barra do navegador no celular
  if (!document.querySelector('meta[name="theme-color"]')) {
    var meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#1b2a47';
    document.head.appendChild(meta);
  }

  /* ---------- 1) Tabelas -> lista nativa de app ----------
     Cada linha vira: [título + subtítulo]  [status]
                      [ações]
     A tabela original continua no HTML (desktop); no celular o CSS a oculta. */
  var TITLE_COL = /^(item|nome|solicitante|categoria|time)$/i;
  var LABELED_COL = /qtd|disp|quant/i;

  Array.prototype.forEach.call(document.querySelectorAll('table'), function (table) {
    var labels = Array.prototype.map.call(table.querySelectorAll('thead th'), function (th) {
      return th.textContent.trim();
    });
    var titleIdx = 0;
    labels.some(function (l, i) { if (TITLE_COL.test(l)) { titleIdx = i; return true; } return false; });

    var list = document.createElement('div');
    list.className = 'm-list';

    Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function (tr) {
      var cells = Array.prototype.slice.call(tr.children);
      var item = document.createElement('div');
      item.className = 'm-item';

      var main = document.createElement('div');
      main.className = 'm-main';
      var title = document.createElement('div');
      title.className = 'm-item-title';
      var meta = [];
      var side = document.createElement('div');
      side.className = 'm-side';
      var actions = document.createElement('div');
      actions.className = 'm-actions';

      cells.forEach(function (td, i) {
        var label = labels[i] || '';
        if (i === titleIdx) { title.innerHTML = td.innerHTML; return; }
        var interactive = td.querySelector('.btn, input, select, a');
        if (interactive) {
          Array.prototype.forEach.call(td.querySelectorAll('.btn, input, select, a'), function (el) {
            actions.appendChild(el.cloneNode(true));
          });
          if (!td.querySelector('.btn, input, select')) {
            // só links simples (editar/ver/remover) -> ficam à direita
            Array.prototype.forEach.call(actions.querySelectorAll('a:not(.btn)'), function (a) {
              a.classList.add('m-link');
              side.appendChild(a);
            });
          }
          return;
        }
        if (td.querySelector('.badge')) { side.insertBefore(td.querySelector('.badge').cloneNode(true), side.firstChild); return; }
        var text = td.textContent.trim();
        if (!text || text === '—') return;
        meta.push(LABELED_COL.test(label) ? label + ': ' + text : text);
      });

      main.appendChild(title);
      if (meta.length) {
        var sub = document.createElement('div');
        sub.className = 'm-item-sub';
        sub.textContent = meta.join(' · ');
        main.appendChild(sub);
      }
      var top = document.createElement('div');
      top.className = 'm-item-top';
      top.appendChild(main);
      if (side.childNodes.length) top.appendChild(side);
      item.appendChild(top);
      if (actions.childNodes.length) item.appendChild(actions);
      list.appendChild(item);
    });

    table.parentNode.insertBefore(list, table.nextSibling);
  });

  /* Filtros (.row.wrap com select) -> busca + chips roláveis */
  Array.prototype.forEach.call(document.querySelectorAll('.content .row.wrap'), function (row) {
    if (!row.querySelector('select')) return;
    row.classList.add('m-filters');
    var q = row.querySelector('input:not([type="date"])');
    var host = row.closest('.card') || row;
    var wrap = document.createElement('div');
    wrap.className = 'm-search';
    var input = q ? q.cloneNode(true) : document.createElement('input');
    input.className = '';
    input.type = 'search';
    input.placeholder = '🔎 Buscar...';
    input.setAttribute('aria-label', 'Buscar');
    wrap.appendChild(input);
    host.parentNode.insertBefore(wrap, host);
  });

  /* ---------- 2) Dados do menu lateral ---------- */
  var links = Array.prototype.map.call(sidebar.querySelectorAll('a'), function (a) {
    var href = a.getAttribute('href');
    return {
      href: href,
      html: a.innerHTML,
      group: (function () {
        // grupo = último .group antes do link
        var n = a.previousElementSibling;
        while (n) { if (n.classList.contains('group')) return n.textContent.trim(); n = n.previousElementSibling; }
        return '';
      })()
    };
  });

  var tabs = [
    { href: 'dashboard.html', ic: '🏠', label: 'Início' },
    { href: 'equipamentos.html', ic: '📦', label: 'Itens' },
    { href: 'solicitar.html', ic: '➕', label: 'Solicitar' },
    { href: 'minhas-solicitacoes.html', ic: '📋', label: 'Pedidos' }
  ];
  var tabHrefs = tabs.map(function (t) { return t.href; });
  var onTab = tabHrefs.indexOf(current) !== -1;

  /* ---------- 3) Barra superior ---------- */
  var h1 = document.querySelector('.pagehead h1');
  var title = h1 ? h1.textContent.trim() : 'ALMOX';
  var avatar = topbar.querySelector('.avatar');

  var bar = document.createElement('header');
  bar.className = 'm-appbar';
  if (!onTab) {
    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'm-btn';
    back.setAttribute('aria-label', 'Voltar');
    back.innerHTML = '&#8592;';
    back.addEventListener('click', function () {
      if (document.referrer && history.length > 1) history.back(); else location.href = 'dashboard.html';
    });
    bar.appendChild(back);
  }
  var t = document.createElement('h1');
  t.className = 'm-title';
  t.textContent = title;
  bar.appendChild(t);

  var bell = document.createElement('a');
  bell.className = 'm-btn';
  bell.href = 'notificacoes.html';
  bell.setAttribute('aria-label', 'Notificações');
  bell.innerHTML = '🔔' + (current === 'notificacoes.html' ? '' : '<span class="m-dot"></span>');
  bar.appendChild(bell);

  var av = document.createElement('div');
  av.className = 'm-avatar';
  av.textContent = avatar ? avatar.textContent.trim() : '';
  bar.appendChild(av);

  body.insertBefore(bar, body.firstChild);

  /* ---------- 4) Abas inferiores + folha "Mais" ---------- */
  var tabbar = document.createElement('nav');
  tabbar.className = 'm-tabbar';
  tabbar.setAttribute('aria-label', 'Navegação principal');
  tabs.forEach(function (tab) {
    var a = document.createElement('a');
    a.href = tab.href;
    a.innerHTML = '<span class="ic">' + tab.ic + '</span>' + tab.label;
    if (tab.href === current) { a.className = 'active'; a.setAttribute('aria-current', 'page'); }
    tabbar.appendChild(a);
  });
  var more = document.createElement('button');
  more.type = 'button';
  more.setAttribute('aria-haspopup', 'dialog');
  more.setAttribute('aria-expanded', 'false');
  more.innerHTML = '<span class="ic">☰</span>Mais';
  if (!onTab && current !== 'index.html') more.className = 'active';
  tabbar.appendChild(more);

  var bg = document.createElement('div');
  bg.className = 'm-sheet-bg';

  var sheet = document.createElement('div');
  sheet.className = 'm-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', 'Mais opções');
  var html = '<div class="grip"></div>';
  var lastGroup = '';
  links.forEach(function (l) {
    if (tabHrefs.indexOf(l.href) !== -1) return;
    if (l.group !== lastGroup) {
      if (l.group) html += '<div class="grp">' + l.group + '</div>';
      lastGroup = l.group;
    }
    html += '<a href="' + l.href + '"' + (l.href === current ? ' class="active"' : '') + '>' + l.html + '</a>';
  });
  html += '<div class="grp">Conta</div><a class="danger" href="login.html">🚪 Sair</a>';
  sheet.innerHTML = html;

  body.appendChild(tabbar);
  body.appendChild(bg);
  body.appendChild(sheet);

  function setSheet(open) {
    body.classList.toggle('sheet-open', open);
    more.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  more.addEventListener('click', function () { setSheet(!body.classList.contains('sheet-open')); });
  bg.addEventListener('click', function () { setSheet(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setSheet(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 768) setSheet(false); });

  /* ---------- 5) Botão flutuante a partir da ação principal da tela ---------- */
  var action = document.querySelector('.pagehead .btn[href]');
  if (action) {
    var fab = document.createElement('a');
    fab.className = 'm-fab';
    fab.href = action.getAttribute('href');
    fab.setAttribute('aria-label', action.textContent.replace(/^[^\wÀ-ú]+/, '').trim());
    fab.textContent = '+';
    body.appendChild(fab);
  }
})();
