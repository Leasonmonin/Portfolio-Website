/* ══════════════════════════════════════════════════════════
   main.js
   1) 开场：逐字显现 → 向后缩小落到屏幕 → LOG IN 闪动
   2) 点击 LOG IN → CRT 点亮 → 进入桌面
   3) 桌面：左侧标签切换 / 牛皮纸文件夹 / 环绕滚动的胶片
   ══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 开场时间轴（ms，想调快慢改这里） ─────────────────── */
  const T = {
    stagger: 30,   // 每字间隔
    letter : 520,  // 单字上浮时长
    hold   : 200,  // 全部显现后再停一下
    recede : 1450, // 向后缩小时长
    ui     : 300,  // 缩完之后邮箱的延迟
  };

  const TITLE = 'Welcome to my site';

  const welcome  = $('#welcome');
  const wordmark = $('#wordmark');
  const laptop   = $('#laptop');
  const slot     = $('#screenSlot');
  const mail     = $('.screen__mail');
  const loginBtn = $('#loginBtn');
  const desktop  = $('#desktop');


  /* ════════════════════════════════════════════════════════
     1. 逐字拆分
     ════════════════════════════════════════════════════════ */
  [...TITLE].forEach((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch === ' ' ? ' ' : ch;   // nbsp，否则会被折叠
    span.style.setProperty('--i', i);
    span.setAttribute('aria-hidden', 'true');
    wordmark.append(span);
  });


  /* ════════════════════════════════════════════════════════
     2. 把大字从视口中央缩到笔记本屏幕的落点上（FLIP）
     ════════════════════════════════════════════════════════ */

  // 字体没加载完就量 offsetWidth，会拿备用字体的字宽算错缩放比
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, 600)),
  ]);

  async function recede() {
    await fontsReady;
    const box = slot.getBoundingClientRect();
    const w   = wordmark.offsetWidth || 1;   // offsetWidth 不受 transform 影响
    const s   = Math.min(box.width / w, 1);

    const dx = (box.left + box.width / 2) - innerWidth  / 2;
    const dy = (box.top  + box.height / 2) - innerHeight / 2;

    wordmark.style.setProperty('--s',  s.toFixed(4));
    wordmark.style.setProperty('--dx', `${dx.toFixed(1)}px`);
    wordmark.style.setProperty('--dy', `${dy.toFixed(1)}px`);
    wordmark.classList.add('is-receded');
  }


  /* ════════════════════════════════════════════════════════
     3. 时间轴
     ════════════════════════════════════════════════════════ */
  const revealEnd = TITLE.length * T.stagger + T.letter;

  function playIntro() {
    if (reduce) {
      recede();
      laptop.classList.add('is-on');
      mail.classList.add('is-on');
      loginBtn.classList.add('is-on');
      return;
    }

    setTimeout(() => {
      recede();
      laptop.classList.add('is-on');
    }, revealEnd + T.hold);

    setTimeout(() => mail.classList.add('is-on'),
      revealEnd + T.hold + T.recede * 0.72);

    setTimeout(() => loginBtn.classList.add('is-on'),
      revealEnd + T.hold + T.recede + T.ui);
  }


  /* ════════════════════════════════════════════════════════
     4. 登录 → 开机 → 桌面
     ════════════════════════════════════════════════════════ */
  let booted = false;

  function logIn() {
    if (booted) return;
    booted = true;

    welcome.classList.add('is-booting');       // 镜头吸入 + CRT 点亮

    // 桌面要等 CRT 闪白之后再亮，否则会在开场还盖着的时候就已经定格了
    setTimeout(() => {
      desktop.classList.add('is-on');
      desktop.setAttribute('aria-hidden', 'false');
    }, reduce ? 0 : 620);

    setTimeout(() => {
      welcome.setAttribute('aria-hidden', 'true');
      welcome.style.display = 'none';
    }, reduce ? 0 : 1300);
  }

  loginBtn.addEventListener('click', logIn);
  addEventListener('keydown', e => {
    if (e.key === 'Enter' && !booted && document.activeElement !== loginBtn) logIn();
  });


  /* ════════════════════════════════════════════════════════
     4b. 回首页 —— 桌面左上角那个箭头
         反向走一遍，不刷页面，登录屏还是原来那副样子
     ════════════════════════════════════════════════════════ */
  function goHome() {
    if (!booted) return;
    booted = false;                       // 松开，允许再登一次

    desktop.classList.remove('is-on');
    desktop.setAttribute('aria-hidden', 'true');

    welcome.style.display = '';
    welcome.classList.remove('is-booting');   // 镜头缩回去、CRT 关掉
    welcome.setAttribute('aria-hidden', 'false');
    recede();                             // 大字落回屏幕上原来那个位置
    laptop.classList.add('is-on');
    mail.classList.add('is-on');
    loginBtn.classList.add('is-on');
  }

  const backHome = $('.back-home');
  backHome.addEventListener('click', e => {
    e.preventDefault();
    goHome();
    location.hash = 'login';              // 顺带记进 URL，刷新还停在登录屏
  });
  // 直接改地址栏也认
  addEventListener('hashchange', () => { if (location.hash === '#login') goHome(); });


  /* ════════════════════════════════════════════════════════
     5. 左侧栏：图标 + 切换
        细线描边图标。描边色用 currentColor，黑侧栏上是灰的、
        翻成白牌子时跟着文字一起变黑，不需要两套配色
     ════════════════════════════════════════════════════════ */
  const TAB_ART = {
    education:
      '<path d="M3 7.2A2.2 2.2 0 0 1 5.2 5h3.35a2.2 2.2 0 0 1 1.55.64L11.3 7h7.5A2.2 2.2 0 0 1 21 9.2v7.6A2.2 2.2 0 0 1 18.8 19H5.2A2.2 2.2 0 0 1 3 16.8z"/>',
    skills:
      '<path d="M12 3.5 3.5 7.75 12 12l8.5-4.25z"/>' +
      '<path d="M3.5 12 12 16.25 20.5 12"/>' +
      '<path d="M3.5 16.25 12 20.5l8.5-4.25"/>',
    experience:
      '<rect x="3" y="5" width="18" height="14" rx="1.75"/>' +
      '<path d="M7.75 5v14M16.25 5v14"/>' +
      '<path d="M3 9h4.75M3 15h4.75M16.25 9H21M16.25 15H21"/>',
    projects:
      '<path d="M6 3.5h7.5L18.5 8.5V20.5h-12.5z"/>' +
      '<path d="M13.5 3.5V8.5h5"/>' +
      '<path d="M9.25 12.5h5.5M9.25 16h3.5"/>',
  };

  function lineIcon(body) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
      ' stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"' +
      ' xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + '</svg>';
  }

  const tabs   = $$('.tab');
  const side   = $('.side');

  tabs.forEach(tab => {
    const art = TAB_ART[tab.dataset.panel];
    if (art) $('.tab__art', tab).innerHTML = lineIcon(art);
  });

  /* 转轮：中间那条是当前面板，上下两条沿着同一段圆弧往回缩、自转、淡下去。
     diff 走环形最短路径，所以转到底会直接接回开头。
     弧的半径跟侧栏那条弧不是同一个：侧栏那条很缓（1430），标签骑的这条紧得多，
     否则 3 条标签只铺开 160px，用大半径算出来几乎不动，自转也看不出来 */
  const STEP  = 80;             // 相邻两条的间距（px）
  const ARC_R = 470;            // 标签所在圆的半径，越小弯得越明显
  let activeIndex = 0;

  function spin() {
    tabs.forEach((tab, i) => {
      let diff = i - activeIndex;
      const half = Math.floor(tabs.length / 2);
      if (diff >  half) diff -= tabs.length;
      if (diff < -half) diff += tabs.length;

      const dist = Math.abs(diff);
      const dy   = diff * STEP;                        // 离弧顶的竖直距离
      // 圆上那一点的横坐标是 √(R²-dy²)，比弧顶小，差值就是往回缩了多少
      const dx   = Math.sqrt(Math.max(0, ARC_R * ARC_R - dy * dy)) - ARC_R;
      // 半径偏过的角度就是切线偏过的角度，标签跟着倾这一点
      const rot  = Math.asin(Math.max(-1, Math.min(1, dy / ARC_R))) * 180 / Math.PI;

      tab.style.transform =
        `translateX(${dx.toFixed(2)}px) ` +
        `translateY(calc(-50% + ${dy}px)) ` +
        `rotate(${rot.toFixed(2)}deg) ` +
        `scale(${Math.max(.72, 1 - dist * .12).toFixed(3)})`;
      tab.style.opacity = Math.max(0, 1 - dist * .26).toFixed(3);
      tab.style.zIndex  = String(20 - dist);
      tab.classList.toggle('is-active', diff === 0);
      if (diff === 0) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
  }

  function show(id) {
    const changed = activePanel !== id;
    activePanel = id;

    const i = tabs.findIndex(t => t.dataset.panel === id);
    if (i >= 0) activeIndex = i;
    spin();

    if (!changed) return;
    $$('.panel').forEach(p => p.classList.toggle('is-active', p.id === `panel-${id}`));
  }

  function step(dir) {
    show(tabs[(activeIndex + dir + tabs.length) % tabs.length].dataset.panel);
  }

  tabs.forEach(t => {
    t.addEventListener('click', () => show(t.dataset.panel));
    // 用 Tab 键逐个走过去时也跟着转，不然焦点落到看不见的那条上很奇怪
    t.addEventListener('focus', () => { if (t.dataset.panel !== activePanel) show(t.dataset.panel); });
  });

  let lock = false;
  // 挂在整条侧栏上，鼠标在栏里任何位置滚都能转
  side.addEventListener('wheel', e => {
    e.preventDefault();
    if (lock) return;                    // 一次滚动只转一格，不然会连跳
    lock = true;
    step(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => { lock = false; }, 240);
  }, { passive:false });

  side.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') step(-1);
    else return;
    e.preventDefault();
  });

  spin();


  /* ════════════════════════════════════════════════════════
     6. EDUCATION — 文件夹
        没有 PULL 按钮了，封面自己就是开关：点封面 = 纸抽出来
     ════════════════════════════════════════════════════════ */
  const folder = $('#folder');
  const cover  = $('#folderCover');
  const paper  = $('#paper');

  // 封面退场那一路还得裁在舞台里，所以开关都得分两步：
  // 开 —— 先 .is-opening 让封面滑走，落定后换 .is-open 放开裁剪，纸才抽得出来
  // 关 —— 先 .is-closing 留着裁剪把纸收回去，落定后撤掉，封面再落下来
  const COVER_MS = 640;
  let folderOpen = null;
  let coverTimer = 0;

  function setFolder(open) {
    if (open === folderOpen) return;
    // 初始化那一下也要走这里，但它不该播收回动画，否则封面会先弹走再落回来
    const animating = folderOpen !== null;
    folderOpen = open;
    clearTimeout(coverTimer);

    cover.setAttribute('aria-expanded', String(open));
    // 关着的时候纸还在下面，只是被封面盖住：别让它被读到或被 Tab 到
    paper.setAttribute('aria-hidden', String(!open));
    paper.inert = !open;

    if (open) {
      folder.classList.add('is-opening');
      coverTimer = setTimeout(() => {
        if (!folderOpen) return;
        folder.classList.remove('is-opening');
        folder.classList.add('is-open');
      }, COVER_MS);
    } else if (animating) {
      folder.classList.remove('is-opening', 'is-open');
      folder.classList.add('is-closing');
      coverTimer = setTimeout(() => {
        if (folderOpen) return;
        folder.classList.remove('is-closing');
      }, COVER_MS);
    } else {
      folder.classList.remove('is-opening', 'is-open', 'is-closing');
    }
  }

  cover.addEventListener('click', () => setFolder(!folderOpen));
  setFolder(false);


  /* ════════════════════════════════════════════════════════
     7. EXPERIENCE — 3D 环绕环 + 景深
        · 卡片摆成 rotateY(i*SPREAD) translateZ(RADIUS) 的一圈
        · 环整体再往后推 RADIUS，让正前方那张正好落在透视面上
        · 按每张自己的深度写 opacity / blur —— 越靠后越淡越糊
     ════════════════════════════════════════════════════════ */
  const ring    = $('#reelRing');
  const stage   = $('#reelStage');
  const reelNow = $('#reelNow');
  const cells   = $$('.cell', ring);
  const total   = cells.length;
  const SPREAD  = 360 / total;        // 三张就是 120°
  // 半径得够大，两侧那两张才会明显从正前方那张背后探出来。
  // 但 1.5R 不能超过 perspective（1100），否则后面的卡片会跑到镜头后面
  const RADIUS  = 600;

  // 空串起手，这样第一次 show() 一定算「换了面板」，任务栏提示才会跟着写上
  let activePanel = '';
  let angle = 0;                      // 环一共转了多少度
  let front = -1;                     // 现在正前方那张的下标
  let drag  = null;                   // 拖动中的起点信息
  let moved = 0;                      // 这次按下去之后挪了多远（区分点击 / 拖动）
  let draggedAt = 0;                  // 上一次真正拖动结束的时间

  cells.forEach((cell, i) => {
    cell.style.transform = `rotateY(${i * SPREAD}deg) translateZ(${RADIUS}px)`;
  });

  // 把角度折算到 -180..180，好知道往哪边转最近
  function wrap(d) {
    d %= 360;
    if (d >  180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }

  function render() {
    ring.style.transform = `translateZ(${-RADIUS}px) rotateY(${angle}deg)`;

    let f = 0, fDist = Infinity;

    cells.forEach((cell, i) => {
      const d     = wrap(i * SPREAD + angle);
      const depth = (Math.cos(d * Math.PI / 180) + 1) / 2;   // 1 = 正前，0 = 正后
      const blur  = (1 - depth) * 5.5;

      cell.style.opacity = (0.12 + 0.88 * depth).toFixed(3);
      cell.style.filter  = blur > .2 ? `blur(${blur.toFixed(2)}px)` : 'none';
      cell.style.zIndex  = String(Math.round(depth * 100));

      const ad = Math.abs(d);
      if (ad < fDist) { fDist = ad; f = i; }
    });

    cells.forEach((cell, i) => cell.classList.toggle('is-front', i === f));

    if (f !== front) {
      front = f;
      setNow(cells[f]);
    }
  }

  // 把正前方那条的「单位 · 职位」挂到环顶
  function setNow(cell) {
    const org  = $('.cell__org',  cell).textContent.trim();
    const role = $('.cell__role', cell).firstChild.textContent.trim();
    reelNow.textContent = `${org} · ${role}`;

    reelNow.style.animation = 'none';   // 重播一次淡入
    void reelNow.offsetWidth;
    reelNow.style.animation = '';
  }

  // dir=1 是下一条：角度减 SPREAD 就能把下一条送到正前方
  function go(dir) {
    angle -= dir * SPREAD;
    ring.classList.add('is-anim');
    render();
  }

  function focusCell(k) {
    const d = wrap((k - front) * SPREAD);   // 走最近的那一边
    if (!d) return;
    angle -= d;
    ring.classList.add('is-anim');
    render();
  }

  /* 拖动：按住左右拽。拖动过程不加过渡，松手才吸附到最近一格。 */
  stage.addEventListener('pointerdown', e => {
    drag  = { x: e.clientX, base: angle };
    moved = 0;
    ring.classList.remove('is-anim');
  });

  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    moved = Math.max(moved, Math.abs(dx));
    angle = drag.base + dx * .35;         // 往右拖 = 环往右转
    render();
  });

  function endDrag() {
    if (!drag) return;
    drag = null;
    ring.classList.add('is-anim');
    angle = Math.round(angle / SPREAD) * SPREAD;   // 吸附
    render();
    if (moved > 8) draggedAt = performance.now();
  }
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  cells.forEach((cell, i) => {
    cell.addEventListener('click', () => {
      // pointerup 先于 click，所以拖完这一下还会跟一个 click，得挡掉
      if (performance.now() - draggedAt < 350) return;
      if (i === front) openDetail(cell);
      else focusCell(i);                        // 点侧面的：转到正前方来
    });
  });

  let wLock = false;
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    if (wLock) return;                          // 一次滚动只转一格
    wLock = true;
    go(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => { wLock = false; }, 420);
  }, { passive:false });

  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1);
    else return;
    e.preventDefault();
  });

  $('#reelPrev').addEventListener('click', () => go(-1));
  $('#reelNext').addEventListener('click', () => go(1));


  /* ════════════════════════════════════════════════════════
     7b. 详情层 —— 点的那张卡自己长成整页，整页往右让开
     卡片上的矩形 FLIP 到详情卡的矩形，所以看着是同一个东西在长大
     ════════════════════════════════════════════════════════ */
  const detail     = $('#detail');
  const detailBody = $('#detailBody');
  const slide      = $('.detail__slide', detail);
  const detailCard = $('.detail__card', detail);

  let detailOpen = false;
  let openCell   = null;
  let closeTimer = 0;

  // 量卡片「静止时」的矩形：先把鼠标视差归零，量完再还回去。
  // 不归零的话量到的是它正飘在半路的坐标，FLIP 的起点就歪了
  function cardRectAtRest() {
    const prev = detailCard.style.transition;
    detailCard.style.transition = 'none';
    detail.style.setProperty('--mx', '0px');
    detail.style.setProperty('--my', '0px');
    const r = detailCard.getBoundingClientRect();
    detailCard.style.transition = prev;
    return r;
  }

  // 读一下 transform 的计算值就会强制刷样式，过渡才会把此刻的值认成起点。
  // 用 offsetWidth 也行，但 transform 正好是要过渡的那个属性，最直给
  function flushSlide() { void getComputedStyle(slide).transform; }

  // 把 slide 摆成「从 from 那个矩形看过去」的样子，之后交给 CSS 归位。
  // slide 的 transform-origin 是 0 0，也就是视口左上角，所以 to 的左上角
  // 缩放之后自己会挪到 (to.left*sx, to.top*sy)，平移量得把这个减掉，
  // 不然只在 sx≈1 附近才准，一放大（关闭方向）就偏出好几百像素
  function flipTo(from, to) {
    const sx = from.width / to.width;
    const sy = from.height / to.height;
    slide.style.transform =
      `translate(${(from.left - to.left * sx).toFixed(2)}px, ` +
      `${(from.top - to.top * sy).toFixed(2)}px)` +
      ` scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  }

  // 环上的卡片是 .cell__inner，技能那三张是 .card，克隆的壳不一样
  const innerOf = el => $('.cell__inner', el) || el;

  function openDetail(el) {
    if (detailOpen) return;
    detailOpen = true;
    openCell = el;
    clearTimeout(closeTimer);
    detail.classList.remove('is-closing');   // 上一轮淡出没走完就被点开了

    detailBody.replaceChildren(innerOf(el).cloneNode(true));
    // 详情层只克隆了内壳，标签的颜色要靠这个属性才分得出来
    detailBody.dataset.kind = el.dataset.kind || '';

    // 作品只在详情里出现，卡片上还是纯文字。
    // data-work 里可以写多个，空格隔开；视频按扩展名认
    const works = (el.dataset.work || '').split(/\s+/).filter(Boolean);
    if (works.length) {
      const org = ($('.cell__org', el) || $('.card__title', el) || {}).textContent || '';
      const box = document.createElement('div');
      box.className = 'detail__works';
      works.forEach(src => {
        const label = org.trim() ? org.trim() + ' 作品' : '作品';
        let node;
        if (/\.(mp4|webm|mov|m4v)$/i.test(src)) {
          node = document.createElement('video');
          node.src = src;
          node.controls = true;
          node.preload = 'metadata';
          node.playsInline = true;
          node.setAttribute('aria-label', label);
        } else {
          node = document.createElement('img');
          node.src = src;
          node.alt = label;
          node.loading = 'lazy';
        }
        box.append(node);
      });
      detailBody.append(box);
    }

    detail.classList.add('is-on', 'is-open');
    detail.setAttribute('aria-hidden', 'false');
    detail.style.setProperty('--mx', '0px');
    detail.style.setProperty('--my', '0px');

    // 先落到详情卡该在的位置量出目标矩形，再从卡片矩形倒着出发
    slide.style.transition = 'none';
    slide.style.transform  = 'none';
    const target = cardRectAtRest();
    const source = innerOf(el).getBoundingClientRect();
    flipTo(source, target);
    flushSlide();                        // 把上面那行坐实成过渡的起点
    slide.style.transition = '';
    slide.style.transform  = 'none';

    desktop.classList.add('is-detail');  // 整页往右让开，卡片淡掉
    $('#detailClose').focus();
  }

  function closeDetail() {
    if (!detailOpen) return;
    detailOpen = false;

    desktop.classList.remove('is-detail');
    desktop.style.setProperty('--pagex', '0px');
    detail.style.setProperty('--mx', '0px');
    detail.style.setProperty('--my', '0px');
    $$('video', detailBody).forEach(v => v.pause());

    // 不再反向 FLIP 缩回那张卡片（那一下在关的时候看着像突然一放），整层淡掉
    detail.classList.add('is-closing');
    closeTimer = setTimeout(finishClose, 360);
  }

  function finishClose() {
    if (detailOpen) return;               // 淡出途中又被点开了，别清
    detail.classList.remove('is-on', 'is-closing');
    detail.setAttribute('aria-hidden', 'true');
    slide.style.transition = 'none';
    slide.style.transform  = 'none';
    flushSlide();
    slide.style.transition = '';
    detailBody.replaceChildren();
    openCell = null;
  }

  $('#detailClose').addEventListener('click', closeDetail);
  // 点卡片外面那圈空白也关
  slide.addEventListener('click', e => {
    if (!e.target.closest('.detail__card')) closeDetail();
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && detailOpen) closeDetail();
  });

  // 技能那三张、项目那两张，都是点了就长大铺满，跟环上的卡片同一套
  $$('.card, .proj').forEach(card => {
    card.addEventListener('click', () => openDetail(card));
    card.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      openDetail(card);
    });
  });

  // 鼠标往右，卡片跟着往右挪（0 → 20px），背后的整页也跟着让一点
  addEventListener('pointermove', e => {
    if (!detailOpen) return;
    const x = e.clientX / innerWidth;
    detail.style.setProperty('--mx', (x * 20).toFixed(1) + 'px');
    detail.style.setProperty('--my', ((e.clientY / innerHeight - .5) * 24).toFixed(1) + 'px');
    desktop.style.setProperty('--pagex', ((x - .5) * 14).toFixed(1) + 'px');
  });

  render();


  /* ════════════════════════════════════════════════════════
     8. 任务栏时钟
     ════════════════════════════════════════════════════════ */
  const clockEl = $('#clock');
  (function tickClock() {
    const d = new Date();
    clockEl.textContent =
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    setTimeout(tickClock, 15000);
  })();


  /* ════════════════════════════════════════════════════════
     9. 启动
        · #login    直接停在登录屏（动画冻结）
        · #desktop  直接进桌面
        · Esc       跳过开场
     ════════════════════════════════════════════════════════ */
  function skip(to) {
    if (to === 'desktop') {
      booted = true;
      welcome.style.display = 'none';
      welcome.setAttribute('aria-hidden', 'true');
      desktop.classList.add('is-on');
      desktop.setAttribute('aria-hidden', 'false');
      return;
    }
    // #login — 停在登录屏最终状态，方便单独调这一屏
    welcome.classList.add('is-frozen');
    recede();
    laptop.classList.add('is-on');
    mail.classList.add('is-on');
    loginBtn.classList.add('is-on');
  }

  const hash = location.hash.slice(1);

  if (hash === 'login') {
    skip('login');
  } else if (['desktop', 'education', 'skills', 'experience', 'projects', 'folder'].includes(hash)) {
    skip('desktop');
    if (hash === 'folder') { show('education'); setFolder(true); }
    else if (hash !== 'desktop') show(hash);
  } else {
    playIntro();
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && !booted) skip('desktop');
    });
  }

})();
