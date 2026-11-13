/* =========================================================
   Pixel 10 — interactions
   ========================================================= */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ── 1. Вступительная анимация ───────────────────────── */
  const start = () => document.body.classList.add("is-ready");

  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(start);
  } else {
    window.addEventListener("load", start, { once: true });
  }
  // страховка, если шрифты не загрузились
  setTimeout(start, 1200);

  /* ── 2. Появление блоков при скролле ─────────────────── */
  const revealEls = $$(".reveal, [data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ── 3. Навигация, прогресс и параллакс ──────────────── */
  const nav = $("#nav");
  const progress = $("#progress");
  const heroVisual = $(".hero-visual");
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (progress) progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;

    if (nav) {
      nav.classList.toggle("is-scrolled", y > 24);
      const goingDown = y > lastY && y > 320;
      nav.classList.toggle("is-hidden", goingDown);
    }

    if (heroVisual && !reduceMotion && window.innerWidth > 820) {
      const shift = clamp(y * 0.14, 0, 140);
      heroVisual.style.transform = `translate3d(0, ${shift}px, 0) scale(${1 - Math.min(y / 9000, 0.04)})`;
      heroVisual.style.opacity = String(clamp(1 - y / 1100, 0.25, 1));
    }

    lastY = y;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    },
    { passive: true }
  );
  onScroll();

  /* ── 4. Подсветка, следующая за курсором ─────────────── */
  const glow = $("#cursorGlow");
  if (glow && !isTouch && !reduceMotion) {
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let visible = false;

    window.addEventListener(
      "pointermove",
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
        if (!visible) {
          visible = true;
          glow.style.opacity = "1";
        }
      },
      { passive: true }
    );

    window.addEventListener("pointerleave", () => {
      visible = false;
      glow.style.opacity = "0";
    });

    const loop = () => {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ── 5. Магнитные кнопки ─────────────────────────────── */
  if (!isTouch && !reduceMotion) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.16}px, ${y * 0.22}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ── 6. Точечная подсветка карточек ──────────────────── */
  if (!isTouch) {
    $$(".spotlight").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ── 7. Счётчики ─────────────────────────────────────── */
  const counters = $$("[data-count]");

  const runCounter = (el) => {
    const target = Number(el.dataset.count) || 0;
    if (reduceMotion) {
      el.textContent = String(target);
      return;
    }
    const duration = 1500;
    let t0 = null;
    const step = (now) => {
      if (t0 === null) t0 = now;
      const p = clamp((now - t0) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => countObserver.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  /* ── 8. Переключатель цвета ──────────────────────────── */
  const tints = {
    obsidian: "rgba(96, 132, 255, 0.20)",
    indigo: "rgba(86, 104, 226, 0.45)",
    porcelain: "rgba(238, 228, 208, 0.34)",
  };
  const names = { obsidian: "Обсидиан", indigo: "Индиго", porcelain: "Фарфор" };

  const swatches = $$(".swatch");
  const colourName = $("#colourName");
  const phoneTint = $("#phoneTint");

  const setColour = (key) => {
    const tint = tints[key] || tints.obsidian;
    document.documentElement.style.setProperty("--tint", tint);
    if (colourName) colourName.textContent = names[key] || "";
    if (phoneTint) phoneTint.style.opacity = key === "obsidian" ? "0" : "1";

    swatches.forEach((s) => {
      const active = s.dataset.colour === key;
      s.classList.toggle("is-active", active);
      s.setAttribute("aria-pressed", String(active));
    });
  };

  swatches.forEach((s) => {
    s.addEventListener("click", () => setColour(s.dataset.colour));
  });

  /* ── 9. Активный раздел в меню ───────────────────────── */
  const navLinks = $$(".nav-links a");
  const sections = navLinks
    .map((a) => $(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) =>
            a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => sectionObserver.observe(s));
  }

  /* ── 10. Лёгкий наклон телефона за курсором ──────────── */
  const hero = $(".hero");
  const phone = $(".hero-phone");
  if (hero && phone && !isTouch && !reduceMotion) {
    hero.addEventListener(
      "pointermove",
      (e) => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        phone.style.setProperty("--ry", `${nx * 7}deg`);
        phone.style.setProperty("--rx", `${-ny * 5}deg`);
      },
      { passive: true }
    );
    hero.addEventListener("pointerleave", () => {
      phone.style.setProperty("--ry", "0deg");
      phone.style.setProperty("--rx", "0deg");
    });
  }

  /* ── 11. Год в подвале ───────────────────────────────── */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
