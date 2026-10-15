/* =========================================================
   AgriCase · Кейс 3 — интерактив v4 (полный набор улучшений)
   ========================================================= */

(function () {
  'use strict';

  /* =========================================================
     УТИЛИТЫ
     ========================================================= */

  function parseNumber(raw) {
    if (typeof raw === 'number') return raw;
    if (raw == null) return NaN;
    const cleaned = String(raw).trim().replace(/\s+/g, '').replace(',', '.');
    if (cleaned === '') return NaN;
    return Number(cleaned);
  }

  function formatNumber(value, decimals) {
    const d = Number.isInteger(decimals) ? decimals : 2;
    return value.toLocaleString('ru-RU', {
      minimumFractionDigits: d, maximumFractionDigits: d
    });
  }

  function formatSmart(value) {
    const fixed = Number(value.toFixed(4));
    return fixed.toLocaleString('ru-RU', {
      minimumFractionDigits: 0, maximumFractionDigits: 4
    });
  }

  function animateNumber(el, from, to, duration, formatter) {
    if (!el) return;
    if (from === to || !isFinite(from) || !isFinite(to)) {
      el.textContent = formatter(to); return;
    }
    const start = performance.now();
    const fmt = formatter || function (v) { return String(v); };
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      el.textContent = fmt(value);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = fmt(to);
    }
    requestAnimationFrame(step);
  }

  function showToast(msg, duration) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, duration || 2200);
  }

  function vibrate(pattern) {
    if (navigator.vibrate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }

  /* =========================================================
     THEME (фича 6: авто по времени)
     ========================================================= */

  const THEME_KEY = 'agricase:theme';

  function getAutoTheme() {
    const hour = new Date().getHours();
    return (hour >= 20 || hour < 6) ? 'dark' : 'light';
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (system ? 'dark' : getAutoTheme());
    document.documentElement.setAttribute('data-theme', theme);

    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  /* =========================================================
     SMOOTH SCROLL
     ========================================================= */

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        closeMenu();
        const y = target.getBoundingClientRect().top + window.pageYOffset - 76;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  function initToTop() {
    const btn = document.getElementById('toTop');
    if (!btn) return;
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
     SCROLL UI (progress + float up)
     ========================================================= */

  function initScrollUI() {
    const bar = document.getElementById('progressBar');
    const floatUp = document.getElementById('floatUp');
    if (!bar && !floatUp) return;
    let raf = false;
    function update() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      if (bar) bar.style.width = Math.max(0, Math.min(100, progress)) + '%';
      if (floatUp) {
        if (scrollTop > 600) floatUp.classList.add('is-visible');
        else floatUp.classList.remove('is-visible');
      }
      raf = false;
    }
    function onScroll() { if (!raf) { raf = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
    if (floatUp) {
      floatUp.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* =========================================================
     BURGER
     ========================================================= */

  function openMenu() {
    const menu = document.getElementById('mobileMenu');
    const burger = document.getElementById('burger');
    if (!menu || !burger) return;
    menu.hidden = false;
    document.body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    const menu = document.getElementById('mobileMenu');
    const burger = document.getElementById('burger');
    if (!menu || !burger) return;
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
  }
  function initBurger() {
    const burger = document.getElementById('burger');
    if (!burger) return;
    burger.addEventListener('click', function () {
      const isOpen = document.body.classList.contains('menu-open');
      if (isOpen) closeMenu(); else openMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); closeEgg(); closeBig(); closeTour(); }
    });
  }

  /* =========================================================
     REVEAL
     ========================================================= */

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          const delay = Math.min(i * 80, 240);
          setTimeout(function () {
            entry.target.classList.add('is-visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* =========================================================
     STORAGE
     ========================================================= */

  const INPUTS_KEY = 'agricase:inputs';
  const HISTORY_KEY = 'agricase:history';
  const TOUR_KEY = 'agricase:tourSeen';
  const DEFAULTS = { revA: 400, costA: 480, revB: 600 };

  function loadInputs() {
    try {
      const raw = localStorage.getItem(INPUTS_KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      const parsed = JSON.parse(raw);
      return {
        revA: Number(parsed.revA) || DEFAULTS.revA,
        costA: Number(parsed.costA) || DEFAULTS.costA,
        revB: Number(parsed.revB) || DEFAULTS.revB
      };
    } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function saveInputs(values) {
    try { localStorage.setItem(INPUTS_KEY, JSON.stringify(values)); } catch (e) {}
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveHistory(list) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 5))); } catch (e) {}
  }

  /* =========================================================
     URL PARAMS (фича 9)
     ========================================================= */

  function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return null;
    const result = {};
    ['revA', 'costA', 'revB'].forEach(function (key) {
      const v = params.get(key);
      if (v != null && !Number.isNaN(parseNumber(v))) {
        result[key] = parseNumber(v);
      }
    });
    return Object.keys(result).length ? result : null;
  }

  function updateURL(values) {
    try {
      const params = new URLSearchParams();
      params.set('revA', values.revA);
      params.set('costA', values.costA);
      params.set('revB', values.revB);
      const newURL = window.location.pathname + '?' + params.toString();
      window.history.replaceState(null, '', newURL);
    } catch (e) {}
  }

  /* =========================================================
     MODALS
     ========================================================= */

  let closeEggExternal = null;
  let closeBigExternal = null;

  function closeEgg() { if (closeEggExternal) closeEggExternal(); }
  function closeBig() { if (closeBigExternal) closeBigExternal(); }

  function setupModal(id, closeBtnId, backdropSelector) {
    const modal = document.getElementById(id);
    if (!modal) return null;
    const closeBtn = document.getElementById(closeBtnId);
    const backdrop = modal.querySelector(backdropSelector || '.modal__backdrop');
    function close() {
      modal.hidden = true;
      document.body.style.overflow = '';
    }
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    return {
      show: function () { modal.hidden = false; document.body.style.overflow = 'hidden'; },
      close: close
    };
  }

  /* =========================================================
     CALCULATOR
     ========================================================= */

  function initCalculator() {
    const revAInput  = document.getElementById('revA');
    const costAInput = document.getElementById('costA');
    const revBInput  = document.getElementById('revB');
    const calcBtn    = document.getElementById('calcBtn');
    const resetBtn   = document.getElementById('resetBtn');
    const errorEl    = document.getElementById('calcError');

    const resMultiplier        = document.getElementById('resMultiplier');
    const resMultiplierFormula = document.getElementById('resMultiplierFormula');
    const resValueBNumber      = document.getElementById('resValueBNumber');
    const resValueB            = document.getElementById('resValueB');
    const resValueBFormula     = document.getElementById('resValueBFormula');

    const tRevA  = document.getElementById('tableRevA');
    const tRevB  = document.getElementById('tableRevB');
    const tCostA = document.getElementById('tableCostA');
    const tCostB = document.getElementById('tableCostB');
    const tMultA = document.getElementById('tableMultA');
    const tMultB = document.getElementById('tableMultB');

    const chartBarA    = document.getElementById('chartBarA');
    const chartBarB    = document.getElementById('chartBarB');
    const chartBarAVal = document.getElementById('chartBarAVal');
    const chartBarBVal = document.getElementById('chartBarBVal');
    const chartAxisMax = document.getElementById('chartAxisMax');
    const funnelResult = document.getElementById('funnelResult');

    const printRevA  = document.getElementById('printRevA');
    const printCostA = document.getElementById('printCostA');
    const printRevB  = document.getElementById('printRevB');
    const printCostB = document.getElementById('printCostB');
    const printMult  = document.getElementById('printMult');
    const printResult= document.getElementById('printResult');
    const printDate  = document.getElementById('printDate');

    if (!revAInput || !costAInput || !revBInput || !calcBtn) return;

    // Load from URL first, then localStorage
    const urlData = loadFromURL();
    const saved = urlData || loadInputs();
    revAInput.value  = saved.revA;
    costAInput.value = saved.costA;
    revBInput.value  = saved.revB;

    const cardMultiplier = resMultiplier ? resMultiplier.closest('.result') : null;
    const cardValueB     = resValueB ? resValueB.closest('.result') : null;

    let prevMultiplier = null;
    let prevValueB     = null;
    let lastHistorySave = 0;

    const eggModal = setupModal('easterEgg', 'closeEgg');
    const bigModal = setupModal('bigMultiplier', 'closeBig');

    closeEggExternal = eggModal ? eggModal.close : null;
    closeBigExternal = bigModal ? bigModal.close : null;

    function clearInvalid() {
      [revAInput, costAInput, revBInput].forEach(function (inp) {
        inp.classList.remove('is-invalid');
        inp.removeAttribute('aria-invalid');
      });
    }
    function markInvalid(inputs) {
      clearInvalid();
      inputs.forEach(function (inp) {
        inp.classList.add('is-invalid');
        inp.setAttribute('aria-invalid', 'true');
      });
      if (inputs[0]) inputs[0].focus();
    }
    function showError(msg) {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.classList.remove('visible');
      void errorEl.offsetWidth;
      errorEl.classList.add('visible');
    }
    function clearError() {
      if (!errorEl) return;
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
    function flash(card) {
      if (!card) return;
      card.classList.remove('flash');
      void card.offsetWidth;
      card.classList.add('flash');
    }
    function flashCells(cells) {
      cells.forEach(function (cell) {
        if (!cell) return;
        cell.classList.remove('updated');
        void cell.offsetWidth;
        cell.classList.add('updated');
      });
    }
    function flashGlow() {
      if (!resValueB) return;
      resValueB.classList.add('is-glowing');
      clearTimeout(flashGlow._t);
      flashGlow._t = setTimeout(function () {
        resValueB.classList.remove('is-glowing');
      }, 2400);
    }

    function updateChart(costA, valueB) {
      if (!chartBarA || !chartBarB) return;
      const max = Math.max(costA, valueB, 1) * 1.15;
      chartBarA.style.height = (costA / max * 100) + '%';
      chartBarB.style.height = (valueB / max * 100) + '%';
      if (chartBarAVal) chartBarAVal.textContent = formatNumber(costA, 0);
      if (chartBarBVal) chartBarBVal.textContent = formatNumber(valueB, 0);
      if (chartAxisMax) chartAxisMax.textContent = formatNumber(max, 0) + ' млн ₸';
    }

    function renderHistory() {
      const historyWrap = document.getElementById('history');
      const list = document.getElementById('historyList');
      if (!historyWrap || !list) return;
      const history = loadHistory();
      if (!history.length) { historyWrap.hidden = true; return; }
      historyWrap.hidden = false;
      list.innerHTML = '';
      history.forEach(function (item) {
        const li = document.createElement('li');
        li.className = 'history__item';
        li.innerHTML =
          '<span class="history__time">' + item.time + '</span>' +
          '<span class="history__params">' +
            formatNumber(item.revA, 0) + ' / ' + formatNumber(item.costA, 0) +
            ' / ' + formatNumber(item.revB, 0) +
          '</span>' +
          '<span class="history__result">' +
            formatSmart(item.multiplier) + ' · ' + formatNumber(item.valueB, 0) + ' млн ₸' +
          '</span>';
        li.addEventListener('click', function () {
          revAInput.value  = item.revA;
          costAInput.value = item.costA;
          revBInput.value  = item.revB;
          calculate();
        });
        list.appendChild(li);
      });
    }

    function addToHistory(revA, costA, revB, multiplier, valueB) {
      const now = Date.now();
      if (now - lastHistorySave < 1500) return;
      lastHistorySave = now;
      const history = loadHistory();
      const d = new Date();
      const time = String(d.getHours()).padStart(2, '0') + ':' +
                   String(d.getMinutes()).padStart(2, '0');
      // Удалить дубликаты последних параметров
      const filtered = history.filter(function (h) {
        return !(h.revA === revA && h.costA === costA && h.revB === revB);
      });
      filtered.unshift({ time: time, revA: revA, costA: costA, revB: revB, multiplier: multiplier, valueB: valueB });
      saveHistory(filtered);
      renderHistory();
    }

    function calculate() {
      clearInvalid();

      const revA  = parseNumber(revAInput.value);
      const costA = parseNumber(costAInput.value);
      const revB  = parseNumber(revBInput.value);

      const nanFields = [];
      if (Number.isNaN(revA)) nanFields.push(revAInput);
      if (Number.isNaN(costA)) nanFields.push(costAInput);
      if (Number.isNaN(revB)) nanFields.push(revBInput);
      if (nanFields.length) {
        markInvalid(nanFields);
        showError('Введите числовые значения во все поля.');
        return;
      }

      const badFields = [];
      if (revA <= 0) badFields.push(revAInput);
      if (costA <= 0) badFields.push(costAInput);
      if (revB <= 0) badFields.push(revBInput);
      if (badFields.length) {
        markInvalid(badFields);
        if (revA === 0 && costA > 0 && revB > 0) {
          if (eggModal) eggModal.show();
          showError('В реальности выручка не может равняться нулю.');
          return;
        }
        showError('Все значения должны быть положительными.');
        return;
      }

      clearError();

      const multiplier = costA / revA;
      const valueB     = revB * multiplier;

      // Пасхалка ×10
      if (multiplier > 10 && bigModal) {
        bigModal.show();
      }

      if (resMultiplier) {
        const from = prevMultiplier === null ? multiplier : prevMultiplier;
        animateNumber(resMultiplier, from, multiplier, 550, function (v) { return formatSmart(v); });
        prevMultiplier = multiplier;
      }
      if (resMultiplierFormula) {
        resMultiplierFormula.textContent = formatNumber(costA, 0) + ' ÷ ' + formatNumber(revA, 0);
      }
      if (resValueBNumber) {
        const from = prevValueB === null ? valueB : prevValueB;
        animateNumber(resValueBNumber, from, valueB, 650, function (v) { return formatNumber(v, 2); });
        prevValueB = valueB;
      }
      if (resValueBFormula) {
        resValueBFormula.textContent = formatNumber(revB, 0) + ' × ' + formatSmart(multiplier);
      }

      if (tRevA)  tRevA.textContent  = formatNumber(revA, 0) + ' млн ₸';
      if (tRevB)  tRevB.textContent  = formatNumber(revB, 0) + ' млн ₸';
      if (tCostA) tCostA.textContent = formatNumber(costA, 0) + ' млн ₸';
      if (tCostB) tCostB.innerHTML   = formatNumber(valueB, 0) + ' млн ₸ <span class="tag">расчётная</span>';
      if (tMultA) tMultA.textContent = formatSmart(multiplier);
      if (tMultB) tMultB.textContent = formatSmart(multiplier);

      if (funnelResult) funnelResult.textContent = formatNumber(valueB, 0);

      // Print card
      if (printRevA)  printRevA.textContent  = formatNumber(revA, 0) + ' млн ₸';
      if (printCostA) printCostA.textContent = formatNumber(costA, 0) + ' млн ₸';
      if (printRevB)  printRevB.textContent  = formatNumber(revB, 0) + ' млн ₸';
      if (printCostB) printCostB.textContent = formatNumber(valueB, 0) + ' млн ₸';
      if (printMult)  printMult.textContent  = formatSmart(multiplier);
      if (printResult) printResult.textContent = formatNumber(valueB, 0) + ' млн ₸';
      if (printDate) {
        const d = new Date();
        printDate.textContent = d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0');
      }

      updateChart(costA, valueB);
      flash(cardMultiplier);
      flash(cardValueB);
      flashCells([tRevA, tRevB, tCostA, tCostB, tMultA, tMultB]);
      flashGlow();

      saveInputs({ revA: revA, costA: costA, revB: revB });
      updateURL({ revA: revA, costA: costA, revB: revB });
      addToHistory(revA, costA, revB, multiplier, valueB);
    }

    function reset() {
      revAInput.value  = DEFAULTS.revA;
      costAInput.value = DEFAULTS.costA;
      revBInput.value  = DEFAULTS.revB;
      prevMultiplier = null;
      prevValueB = null;
      clearInvalid();
      clearError();
      document.querySelectorAll('.preset').forEach(function (p) { p.classList.remove('is-active'); });
      saveInputs(DEFAULTS);
      calculate();
    }

    calcBtn.addEventListener('click', function () {
      calculate();
      vibrate(10);
    });
    if (resetBtn) resetBtn.addEventListener('click', reset);

    [revAInput, costAInput, revBInput].forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); calculate(); vibrate(10); }
      });
      input.addEventListener('input', function () {
        clearError();
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
        document.querySelectorAll('.preset').forEach(function (p) { p.classList.remove('is-active'); });
      });
      input.addEventListener('blur', function () {
        const v = input.value.trim();
        if (v.indexOf('.') !== -1 && v.indexOf(',') === -1) {
          input.value = v.replace('.', ',');
        }
      });
    });

    // History clear
    const historyClear = document.getElementById('historyClear');
    if (historyClear) {
      historyClear.addEventListener('click', function () {
        saveHistory([]);
        renderHistory();
      });
    }

    // Copy button (фича 2)
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        const mult = prevMultiplier || 1.2;
        const valueB = prevValueB || 720;
        const text = 'Расчёт AgriCase:\n' +
          'Мультипликатор = ' + formatSmart(mult) + '\n' +
          'Стоимость Б = ' + formatNumber(valueB, 2) + ' млн ₸';
        const done = function () {
          copyBtn.classList.add('copied');
          showToast('Скопировано ✓');
          setTimeout(function () { copyBtn.classList.remove('copied'); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {
            showToast('Не удалось скопировать');
          });
        } else {
          // fallback
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); done(); }
          catch (e) { showToast('Не удалось скопировать'); }
          document.body.removeChild(ta);
        }
      });
    }

    // Presets (фича 7)
    document.querySelectorAll('.preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        revAInput.value  = btn.dataset.revA;
        costAInput.value = btn.dataset.costA;
        revBInput.value  = btn.dataset.revB;
        document.querySelectorAll('.preset').forEach(function (p) { p.classList.remove('is-active'); });
        btn.classList.add('is-active');
        prevMultiplier = null;
        prevValueB = null;
        calculate();
      });
    });

    prevMultiplier = null;
    prevValueB = null;
    calculate();
    renderHistory();
  }

  /* =========================================================
     SHARE URL (фича 9)
     ========================================================= */

  function initShare() {
    const btn = document.getElementById('shareBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const url = window.location.href;
      const done = function () { showToast('Ссылка скопирована ✓'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(function () {
          showToast('Не удалось скопировать');
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  }

  /* =========================================================
     QUIZ (фича 8)
     ========================================================= */

  function initQuiz() {
    const quiz = document.querySelector('.quiz');
    if (!quiz) return;
    const items = quiz.querySelectorAll('.quiz__item');

    items.forEach(function (item) {
      const correct = item.dataset.correct;
      const inputs = item.querySelectorAll('input[type="radio"]');
      const feedback = item.querySelector('.quiz__feedback');

      inputs.forEach(function (input) {
        input.addEventListener('change', function () {
          inputs.forEach(function (i) {
            i.parentElement.classList.remove('is-correct');
          });
          item.classList.remove('is-correct', 'is-wrong');
          feedback.classList.remove('ok', 'no');

          if (input.value === correct) {
            item.classList.add('is-correct');
            feedback.textContent = '✓ Верно!';
            feedback.classList.add('ok');
          } else {
            item.classList.add('is-wrong');
            feedback.textContent = '✗ Неверно. Правильный ответ: ' +
              item.querySelector('input[value="' + correct + '"]').parentElement.querySelector('span').textContent;
            feedback.classList.add('no');
            // Highlight correct
            item.querySelector('input[value="' + correct + '"]').parentElement.classList.add('is-correct');
          }
        });
      });
    });

    const reset = document.getElementById('quizReset');
    if (reset) {
      reset.addEventListener('click', function () {
        items.forEach(function (item) {
          item.classList.remove('is-correct', 'is-wrong');
          item.querySelector('.quiz__feedback').textContent = '';
          item.querySelector('.quiz__feedback').classList.remove('ok', 'no');
          item.querySelectorAll('input[type="radio"]').forEach(function (i) {
            i.checked = false;
            i.parentElement.classList.remove('is-correct');
          });
        });
      });
    }
  }

  /* =========================================================
     TOUR (фича 4)
     ========================================================= */

  let tourState = { active: false, step: 0, steps: [] };

  function buildTourSteps() {
    return [
      {
        el: document.getElementById('revA'),
        title: 'Начнём с предприятия А',
        text: 'Это выручка сопоставимой компании. Из неё и её стоимости мы найдём мультипликатор.',
        placement: 'right'
      },
      {
        el: document.getElementById('costA'),
        title: 'Стоимость предприятия А',
        text: 'Введите сюда рыночную стоимость компании А — она понадобится для расчёта мультипликатора.',
        placement: 'right'
      },
      {
        el: document.getElementById('revB'),
        title: 'Выручка предприятия Б',
        text: 'Умножив её на мультипликатор А, мы получим расчётную стоимость предприятия Б.',
        placement: 'right'
      },
      {
        el: document.getElementById('calcBtn'),
        title: 'Рассчитать результат',
        text: 'Нажмите кнопку — результат появится мгновенно и синхронизируется с таблицей и графиком.',
        placement: 'bottom'
      }
    ];
  }

  function openTour() {
    const tour = document.getElementById('tour');
    if (!tour) return;
    tourState.steps = buildTourSteps().filter(function (s) { return s.el; });
    if (!tourState.steps.length) return;
    tourState.step = 0;
    tourState.active = true;
    tour.hidden = false;
    document.body.classList.add('tour-open');
    showTourStep();
  }

  function closeTour() {
    const tour = document.getElementById('tour');
    if (!tour) return;
    tour.hidden = true;
    tourState.active = false;
    document.body.classList.remove('tour-open');
    localStorage.setItem(TOUR_KEY, '1');
  }

  function showTourStep() {
    const tour = document.getElementById('tour');
    const spotlight = document.getElementById('tourSpotlight');
    const tip = document.getElementById('tourTip');
    if (!tour || !spotlight || !tip) return;

    const step = tourState.steps[tourState.step];
    if (!step) { closeTour(); return; }

    const rect = step.el.getBoundingClientRect();
    const pad = 8;
    const scrollY = window.pageYOffset;

    spotlight.style.top = (rect.top + scrollY - pad) + 'px';
    spotlight.style.left = (rect.left - pad) + 'px';
    spotlight.style.width = (rect.width + pad * 2) + 'px';
    spotlight.style.height = (rect.height + pad * 2) + 'px';

    document.getElementById('tourStep').textContent =
      'Шаг ' + (tourState.step + 1) + ' из ' + tourState.steps.length;
    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourText').textContent = step.text;

    const next = document.getElementById('tourNext');
    next.textContent = tourState.step === tourState.steps.length - 1 ? 'Готово' : 'Далее';

    // Position tip
    let tipTop, tipLeft;
    if (step.placement === 'right') {
      tipTop = rect.top + scrollY - 8;
      tipLeft = rect.right + 20;
    } else if (step.placement === 'bottom') {
      tipTop = rect.bottom + scrollY + 20;
      tipLeft = rect.left;
    } else {
      tipTop = rect.bottom + scrollY + 20;
      tipLeft = rect.left;
    }

    tip.style.top = tipTop + 'px';
    tip.style.left = tipLeft + 'px';
  }

  function initTour() {
    const tour = document.getElementById('tour');
    if (!tour) return;

    tour.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-tour-close')) closeTour();
    });

    const skip = document.getElementById('tourSkip');
    if (skip) skip.addEventListener('click', closeTour);

    const next = document.getElementById('tourNext');
    if (next) {
      next.addEventListener('click', function () {
        tourState.step++;
        if (tourState.step >= tourState.steps.length) closeTour();
        else showTourStep();
      });
    }

    // Auto-start on first visit
    if (localStorage.getItem(TOUR_KEY) !== '1') {
      const calculator = document.getElementById('calculator');
      if (!calculator) return;
      let shown = false;
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !shown) {
            shown = true;
            setTimeout(openTour, 900);
            observer.disconnect();
          }
        });
      }, { threshold: 0.35 });
      observer.observe(calculator);
    }

    window.addEventListener('resize', function () {
      if (tourState.active) showTourStep();
    });
    window.addEventListener('scroll', function () {
      if (tourState.active) showTourStep();
    }, { passive: true });
  }

  /* =========================================================
     PDF
     ========================================================= */

  function initPdf() {
    const btn = document.getElementById('downloadPdf');
    if (!btn) return;
    btn.addEventListener('click', function () {
      setTimeout(function () { window.print(); }, 100);
    });
  }

  /* =========================================================
     KONAMI (фича 27)
     ========================================================= */

  function initKonami() {
    const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let idx = 0;
    document.addEventListener('keydown', function (e) {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === code[idx]) {
        idx++;
        if (idx === code.length) { idx = 0; launchKonami(); }
      } else {
        idx = 0;
      }
    });
  }

  function launchKonami() {
    const overlay = document.getElementById('konami');
    if (!overlay) return;
    overlay.hidden = false;
    overlay.innerHTML = '';
    const emojis = ['🌾','🌱','🍃','🌿','🌻'];
    const total = 40;
    for (let i = 0; i < total; i++) {
      const span = document.createElement('span');
      span.className = 'konami__leaf';
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      span.style.left = Math.random() * 100 + '%';
      span.style.animationDuration = (2 + Math.random() * 2.5) + 's';
      span.style.animationDelay = (Math.random() * 1.5) + 's';
      span.style.fontSize = (18 + Math.random() * 20) + 'px';
      overlay.appendChild(span);
    }
    showToast('🌾 Konami!');
    setTimeout(function () {
      overlay.hidden = true;
      overlay.innerHTML = '';
    }, 5200);
  }

  /* =========================================================
     INIT
     ========================================================= */

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initSmoothScroll();
    initToTop();
    initScrollUI();
    initBurger();
    initReveal();
    initCalculator();
    initShare();
    initQuiz();
    initTour();
    initPdf();
    initKonami();
  });

})();