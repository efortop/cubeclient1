/* =========================================================
   Портфолио веб-разработчика — логика и анимации
   ========================================================= */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Reveal по скроллу ---------- */
  const revealItems = $$("[data-reveal]");
  revealItems.forEach((el) => {
    const delay = el.dataset.delay;
    if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  let revealStarted = false;
  function initReveal() {
    if (revealStarted) return;
    revealStarted = true;

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealItems.forEach((el) => revealObserver.observe(el));
  }

  // Если что-то пойдёт не так с прелоадером — показываем контент принудительно
  setTimeout(initReveal, 3500);

  /* ---------- Прелоадер ---------- */
  const preloader = $("#preloader");
  const preCount = $("#preloaderCount");
  const preBar = $("#preloaderBar");

  let progress = 0;
  let preloaderStarted = false;
  function finishLoading() {
    document.body.classList.add("is-ready");
    if (preloader) {
      preloader.classList.add("is-done");
      setTimeout(() => preloader.remove(), 800);
    }
    startTyping();
  }

  function runPreloader() {
    if (preloaderStarted) return;
    preloaderStarted = true;
    initReveal();
    if (!preloader || reduceMotion) {
      document.body.classList.add("is-ready");
      if (preloader) preloader.remove();
      startTyping();
      return;
    }
    const timer = setInterval(() => {
      progress = Math.min(100, progress + Math.random() * 16 + 6);
      if (preCount) preCount.textContent = Math.floor(progress);
      if (preBar) preBar.style.width = progress + "%";
      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(finishLoading, 320);
      }
    }, 120);

    // Страховка: не держим пользователя дольше 3 секунд
    setTimeout(() => {
      clearInterval(timer);
      if (preloader.isConnected && !preloader.classList.contains("is-done")) {
        if (preCount) preCount.textContent = "100";
        if (preBar) preBar.style.width = "100%";
        finishLoading();
      }
    }, 3000);
  }

  window.addEventListener("load", runPreloader, { once: true });
  // Если load уже прошёл (кэш) — запускаем сразу
  if (document.readyState === "complete") runPreloader();

  /* ---------- Печать кода в hero ---------- */
  const codeEl = $("#codeTyping");
  const codeCard = $("#codeCard");
  const codeChip = $("#codeChip");

  const CODE = [
    { t: "// привет, я веб-разработчик\n", c: "tok-com" },
    { t: "const ", c: "tok-key" },
    { t: "developer", c: "tok-fn" },
    { t: " = {\n", c: "" },
    { t: "  stack: ", c: "tok-prop" },
    { t: "['HTML', 'CSS', 'JavaScript']", c: "tok-str" },
    { t: ",\n", c: "" },
    { t: "  experience: ", c: "tok-prop" },
    { t: "'начинающий'", c: "tok-str" },
    { t: ",\n", c: "" },
    { t: "  status: ", c: "tok-prop" },
    { t: "'ищу первых клиентов'", c: "tok-str" },
    { t: ",\n", c: "" },
    { t: "  readyToWork: ", c: "tok-prop" },
    { t: "true", c: "tok-num" },
    { t: ",\n\n", c: "" },
    { t: "  buildSite", c: "tok-fn" },
    { t: "(idea) {\n", c: "" },
    { t: "    return ", c: "tok-key" },
    { t: "`${idea} → живой сайт`;\n", c: "tok-str" },
    { t: "  }\n", c: "" },
    { t: "};", c: "" },
  ];

  let typingStarted = false;
  function startTyping() {
    if (typingStarted || !codeEl) return;
    typingStarted = true;

    if (reduceMotion) {
      codeEl.innerHTML = CODE.map((p) =>
        p.c ? `<span class="${p.c}">${escapeHtml(p.t)}</span>` : escapeHtml(p.t)
      ).join("");
      return;
    }

    let partIndex = 0;
    let charIndex = 0;
    let node = null;

    function step() {
      if (partIndex >= CODE.length) {
        if (codeChip) codeChip.textContent = "готов к работе";
        return;
      }
      const part = CODE[partIndex];
      if (charIndex === 0) {
        if (part.c) {
          node = document.createElement("span");
          node.className = part.c;
          codeEl.appendChild(node);
        } else {
          node = document.createTextNode("");
          codeEl.appendChild(node);
        }
      }
      node.textContent += part.t[charIndex];
      charIndex++;

      if (charIndex >= part.t.length) {
        partIndex++;
        charIndex = 0;
        node = null;
      }
      const ch = part.t[charIndex - 1];
      const delay = ch === "\n" ? 90 : part.c === "tok-com" ? 22 : 17;
      setTimeout(step, delay);
    }
    setTimeout(step, 420);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- Счётчики ---------- */
  const counters = $$("[data-count]");
  const counterObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.5 }
      )
    : null;

  counters.forEach((el) => {
    const target = Number(el.dataset.count) || 0;
    const pad = Number(el.dataset.pad) || 0;
    el.textContent = pad ? String(0).padStart(pad, "0") : "0";
    if (counterObserver) counterObserver.observe(el);
    else setCounterValue(el, target);
  });

  function setCounterValue(el, value) {
    const pad = Number(el.dataset.pad) || 0;
    const suffix = el.dataset.suffix || "";
    el.textContent = (pad ? String(value).padStart(pad, "0") : String(value)) + suffix;
  }

  function animateCounter(el) {
    const target = Number(el.dataset.count) || 0;
    if (reduceMotion || target < 8) {
      setCounterValue(el, target);
      return;
    }
    const duration = 1300;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setCounterValue(el, Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Хедер, прогресс скролла, активная ссылка ---------- */
  const header = $("#header");
  const progressBar = $("#scrollProgress");
  const sections = $$("main section[id]");
  const navLinks = $$(".nav__link");

  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-stuck", y > 24);

    if (progressBar) {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const value = height > 0 ? Math.min(1, y / height) : 0;
      progressBar.style.transform = `scaleX(${value})`;
    }

    let current = "";
    const line = y + window.innerHeight * 0.32;
    sections.forEach((sec) => {
      if (sec.offsetTop <= line) current = sec.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle("is-current", link.getAttribute("href") === `#${current}`);
    });
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  /* ---------- Мобильное меню ---------- */
  const burger = $("#burger");
  const nav = $("#nav");
  function closeMenu() {
    if (!nav || !burger) return;
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  }
  function toggleMenu() {
    if (!nav || !burger) return;
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
  }
  if (burger) burger.addEventListener("click", toggleMenu);
  navLinks.forEach((l) => l.addEventListener("click", closeMenu));

  /* ---------- Кастомный курсор + магнитные кнопки ---------- */
  const cursor = $("#cursor");
  if (cursor && finePointer && !reduceMotion) {
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx;
    let ty = cy;
    let cursorVisible = false;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!cursorVisible) {
        cursorVisible = true;
        cursor.classList.add("is-active");
      }
    });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));

    function renderCursor() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx - 17}px, ${cy - 17}px, 0)`;
      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    const hoverTargets = "a, button, .project, .skill-card, input, textarea, .nav__link";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverTargets)) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverTargets)) cursor.classList.remove("is-hover");
    });
  }

  if (finePointer && !reduceMotion) {
    const magnets = $$(".magnetic");
    magnets.forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });

    // Параллакс карточек и подсветка
    const parallaxItems = $$("[data-float]");
    const spotlightCards = $$(".spotlight");

    window.addEventListener(
      "mousemove",
      (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;

        if (codeCard && window.innerWidth > 1024) {
          codeCard.style.transform = `rotateY(${nx * 7}deg) rotateX(${-ny * 7}deg) translateZ(0)`;
          const rect = codeCard.getBoundingClientRect();
          codeCard.style.setProperty("--mx", `${e.clientX - rect.left}px`);
          codeCard.style.setProperty("--my", `${e.clientY - rect.top}px`);
        }

        parallaxItems.forEach((el) => {
          const speed = Number(el.dataset.float) || 0.05;
          el.style.setProperty("--px", `${-nx * speed * 100}px`);
          el.style.setProperty("--py", `${-ny * speed * 100}px`);
          el.style.translate = `${-nx * speed * 100}px ${-ny * speed * 100}px`;
        });

        spotlightCards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;
          card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
          card.style.setProperty("--my", `${e.clientY - rect.top}px`);
        });
      },
      { passive: true }
    );
  }

  /* ---------- Параллакс фонового свечения hero ---------- */
  const hero = $("#hero");
  if (hero && !reduceMotion && finePointer) {
    const blobs = $$(".blob", hero);
    hero.addEventListener("mousemove", (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      blobs.forEach((blob, i) => {
        const depth = (i + 1) * 12;
        blob.style.marginLeft = `${nx * depth}px`;
        blob.style.marginTop = `${ny * depth}px`;
      });
    });
  }

  /* ---------- Модалка кейсов ---------- */
  const modal = $("#modal");
  const modalImg = $("#modalImg");
  const modalTitle = $("#modalTitle");
  const modalType = $("#modalType");
  const modalDesc = $("#modalDesc");
  const modalTags = $("#modalTags");
  let lastFocused = null;

  function openModal(project) {
    if (!modal) return;
    const img = $("img", project);
    const title = project.dataset.title || "";
    if (modalImg && img) {
      modalImg.src = img.currentSrc || img.src;
      modalImg.alt = img.alt;
    }
    if (modalTitle) modalTitle.textContent = title;
    if (modalType) modalType.textContent = project.dataset.type || "";
    if (modalDesc) modalDesc.textContent = project.dataset.desc || "";
    if (modalTags) modalTags.textContent = project.dataset.tags ? `Что внутри: ${project.dataset.tags}` : "";

    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("is-locked");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    const closeBtn = $(".modal__close", modal);
    if (closeBtn) setTimeout(() => closeBtn.focus(), 80);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    setTimeout(() => {
      modal.hidden = true;
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }, 380);
  }

  $$(".project").forEach((project) => {
    project.addEventListener("click", () => openModal(project));
    project.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(project);
      }
    });
  });
  if (modal) {
    $$("[data-close]", modal).forEach((el) => {
      el.addEventListener("click", (e) => {
        const href = el.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          closeModal();
          const target = document.querySelector(href);
          if (target) {
            setTimeout(() => {
              target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
              history.replaceState(null, "", href);
            }, 400);
          }
          return;
        }
        closeModal();
      });
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeMenu();
    }
  });

  /* ---------- Копирование email ---------- */
  const copyBtn = $("#copyEmail");
  const toast = $("#toast");

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.dataset.email || "";
      try {
        await navigator.clipboard.writeText(email);
      } catch {
        const temp = document.createElement("textarea");
        temp.value = email;
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        try {
          document.execCommand("copy");
        } catch {}
        temp.remove();
      }
      copyBtn.classList.add("is-copied");
      const label = $(".copy-btn__label", copyBtn);
      if (label) label.textContent = "скопировано";
      showToast("Email скопирован — напишите, буду рад проекту!");
      setTimeout(() => {
        copyBtn.classList.remove("is-copied");
        if (label) label.textContent = "копировать";
      }, 2400);
    });
  }

  /* ---------- Форма ---------- */
  const form = $("#contactForm");
  const formNote = $("#formNote");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = $$("input, textarea", form);
      let valid = true;

      fields.forEach((field) => {
        const wrap = field.closest(".field");
        const ok = field.value.trim().length >= 2;
        if (wrap) wrap.classList.toggle("has-error", !ok);
        if (!ok) valid = false;
      });

      if (!valid) {
        if (formNote) {
          formNote.textContent = "Заполните, пожалуйста, все поля — хотя бы по паре символов.";
          formNote.className = "form-note is-err";
        }
        const firstError = $(".field.has-error input, .field.has-error textarea", form);
        if (firstError) firstError.focus();
        return;
      }

      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const contact = String(data.get("contact") || "").trim();
      const message = String(data.get("message") || "").trim();
      const subject = encodeURIComponent(`Заявка на сайт — ${name}`);
      const body = encodeURIComponent(
        `Имя: ${name}\nСвязь: ${contact}\n\nЗадача:\n${message}\n\n— отправлено с портфолио`
      );

      if (formNote) {
        formNote.textContent = "Открываю почтовый клиент с готовым письмом…";
        formNote.className = "form-note is-ok";
      }
      window.location.href = `mailto:tanusazunusova@gmail.com?subject=${subject}&body=${body}`;
      showToast("Письмо готово — осталось нажать «Отправить»");
      form.reset();
    });

    $$("input, textarea", form).forEach((field) => {
      field.addEventListener("input", () => {
        const wrap = field.closest(".field");
        if (wrap) wrap.classList.remove("has-error");
      });
    });
  }

  /* ---------- Навигация по хэшу при загрузке ---------- */
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(() => target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }), 900);
  }

  /* ---------- Год в футере ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Горизонтальный тилт карточки проекта ---------- */
  $$(".project").forEach((card) => {
    if (!finePointer || reduceMotion) return;
    const media = $(".project__media img", card);
    if (!media) return;
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      media.style.transform = `scale(1.06) translate(${px * -14}px, ${py * -12}px)`;
    });
    card.addEventListener("mouseleave", () => {
      media.style.transform = "";
    });
  });
})();
