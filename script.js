// ===== AI 视频安全智能体平台 · v8 Script =====

// Nav scroll shadow
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

// Mobile menu
const navToggle = document.querySelector('.nav-toggle');
const navMobile = document.querySelector('.nav-mobile');
if (navToggle && navMobile) {
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-controls', 'mobile-navigation');
  navMobile.id = navMobile.id || 'mobile-navigation';
  navToggle.addEventListener('click', () => {
    const open = navToggle.classList.toggle('open');
    navMobile.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
  });
  navMobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navMobile.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', '打开菜单');
    });
  });
}

// Scroll-spy: highlight active nav link
(function() {
  const navLinks = document.querySelectorAll('.nav-links a[data-nav], .nav-mobile a[data-nav]');
  const sections = document.querySelectorAll('section[id]');
  if (!sections.length || !navLinks.length) return;
  const linkMap = {};
  navLinks.forEach(link => {
    const key = link.getAttribute('data-nav');
    if (!linkMap[key]) linkMap[key] = [];
    linkMap[key].push(link);
  });
  let ticking = false;
  function updateActiveNav() {
    const scrollPos = window.scrollY + 120;
    let currentId = null;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) currentId = sec.id;
    });
    if (currentId) {
      navLinks.forEach(l => l.classList.remove('active'));
      if (linkMap[currentId]) linkMap[currentId].forEach(l => l.classList.add('active'));
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateActiveNav); ticking = true; }
  }, { passive: true });
  updateActiveNav();
})();

// Page-level nav active state
(function() {
  const pageAttr = document.body.getAttribute('data-page');
  if (pageAttr) {
    document.querySelectorAll('.nav-links a[data-page="' + pageAttr + '"], .nav-mobile a[data-page="' + pageAttr + '"]').forEach(a => a.classList.add('active'));
  }
})();

// Domain tabs
document.querySelectorAll('.domain-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.domain;
    document.querySelectorAll('.domain-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.scenario-item').forEach(item => {
      const link = item.closest('.scenario-link');
      if (target === 'all' || item.dataset.domain === target) {
        if (link) link.style.display = '';
        item.style.animation = 'scaleIn .4s var(--ease-out)';
      } else {
        if (link) link.style.display = 'none';
      }
    });
  });
});

// Solution tabs + URL hash + lazy video lifecycle
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeSolutionVideo = null;
function loadSolutionVideo(panel, shouldPlay = true) {
  const video = panel && panel.querySelector('video[data-video-src]');
  if (!video) return;
  if (!video.querySelector('source')) {
    const source = document.createElement('source');
    source.src = video.dataset.videoSrc;
    source.type = video.dataset.videoType || 'video/webm';
    video.appendChild(source);
    video.load();
  }
  if (shouldPlay && !reducedMotion.matches) {
    const promise = video.play();
    if (promise && promise.catch) promise.catch(() => {});
  }
  activeSolutionVideo = video;
}
function unloadSolutionVideo(panel) {
  const video = panel && panel.querySelector('video');
  if (!video) return;
  video.pause();
  const source = video.querySelector('source');
  if (source) source.remove();
  video.load();
  if (activeSolutionVideo === video) activeSolutionVideo = null;
}
function announceSolutionTab(tab) {
  document.querySelectorAll('.sol-tab').forEach(t => {
    const selected = t === tab;
    t.classList.toggle('active', selected);
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
  });
}
function scrollToSolutions() {
  const section = document.querySelector('.solutions');
  if (!section) return;
  const navHeight = document.querySelector('.nav')?.offsetHeight || 68;
  const top = section.getBoundingClientRect().top + window.scrollY - navHeight - 12;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: reducedMotion.matches ? 'auto' : 'smooth'
  });
}
function activateSolutionTab(target, options = {}) {
  const tab = document.querySelector('.sol-tab[data-sol="' + target + '"]');
  const panel = document.getElementById('sol-' + target);
  if (!tab || !panel) return false;
  const previous = document.querySelector('.sol-panel.active');
  if (previous && previous !== panel) unloadSolutionVideo(previous);
  announceSolutionTab(tab);
  document.querySelectorAll('.sol-panel').forEach(p => {
    p.classList.toggle('active', p === panel);
    p.hidden = p !== panel;
  });
  loadSolutionVideo(panel, true);
  const lines = panel.querySelectorAll('.flow-line');
  lines.forEach((line, i) => {
    const len = line.getTotalLength ? line.getTotalLength() : 200;
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    line.style.transition = 'none';
    requestAnimationFrame(() => {
      line.style.transition = 'stroke-dashoffset .5s var(--ease-out) ' + (i * 0.1 + 0.2) + 's';
      line.style.strokeDashoffset = '0';
    });
  });
  if (typeof window.v8Track === 'function') window.v8Track('solution_tab_change', { label: target });
  if (options.focus) panel.focus({ preventScroll: true });
  return true;
}
document.querySelectorAll('.sol-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.sol;
    const wasBelowSolutions = window.scrollY > (document.querySelector('.solutions')?.offsetTop || 0) + 120;
    history.replaceState(null, '', '#' + target);
    activateSolutionTab(target, { focus: true });
    if (wasBelowSolutions) scrollToSolutions();
  });
  tab.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll('.sol-tab')];
    const next = (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
  });
});
function handleSolutionHash() {
  const target = window.location.hash.substring(1);
  if (!document.querySelector('.sol-panel')) return;
  const key = document.querySelector('.sol-tab[data-sol="' + target + '"]') ? target : document.querySelector('.sol-tab')?.dataset.sol;
  if (key && activateSolutionTab(key)) {
    if (target) {
      scrollToSolutions();
    }
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', handleSolutionHash);
else handleSolutionHash();
window.addEventListener('hashchange', handleSolutionHash);
document.addEventListener('visibilitychange', () => {
  if (!activeSolutionVideo) return;
  if (document.hidden) activeSolutionVideo.pause();
  else if (!reducedMotion.matches) activeSolutionVideo.play().catch(() => {});
});
// Scroll reveal
const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
revealEls.forEach(el => {
  if (el.classList.contains('reveal-stagger')) {
    [...el.children].forEach((child, i) => child.style.setProperty('--i', i));
  }
});
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

// Animated counters
const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(el => counterObserver.observe(el));

// Architecture diagram animation
const archObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const lines = entry.target.querySelectorAll('.arch-connector');
      lines.forEach((line, i) => {
        const len = line.getTotalLength ? line.getTotalLength() : 50;
        line.style.strokeDasharray = len;
        line.style.strokeDashoffset = len;
        line.style.transition = 'none';
        requestAnimationFrame(() => {
          line.style.transition = 'stroke-dashoffset .5s var(--ease-out) ' + (i * 0.15) + 's';
          line.style.strokeDashoffset = '0';
        });
      });
      archObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
const archDiagram = document.querySelector('.arch-diagram');
if (archDiagram) archObserver.observe(archDiagram);