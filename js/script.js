/* =================================================================
   LA MÉTALLERIE DU SUD — script.js
   Petit JS sans dépendance : menu mobile, header au scroll,
   apparition au scroll, slider de témoignages, bouton "haut de page",
   année automatique dans le footer, et un formulaire de contact
   prêt à être branché à un vrai service d'envoi d'email.
================================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------------------------------------------------------
     1) MENU MOBILE (burger)
  --------------------------------------------------------- */
  const burger = document.getElementById("burger");
  const mainNav = document.getElementById("main-nav");

  if (burger && mainNav) {
    burger.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      burger.classList.toggle("open", isOpen);
      burger.setAttribute("aria-expanded", String(isOpen));
    });

    // Ferme le menu quand on clique sur un lien
    mainNav.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------
     2) HEADER : fond blanc + ombre au scroll
  --------------------------------------------------------- */
  const header = document.getElementById("site-header");
  const backToTop = document.getElementById("back-to-top");

  const onScroll = () => {
    const scrolled = window.scrollY > 40;
    header?.classList.toggle("scrolled", scrolled);
    backToTop?.classList.toggle("visible", window.scrollY > 500);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     3) APPARITION AU SCROLL (IntersectionObserver)
  --------------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Navigateur trop ancien : on affiche tout directement
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------------------------------------------------
     4) SLIDER DE TÉMOIGNAGES (auto-défilement + points cliquables)
  --------------------------------------------------------- */
  const track = document.getElementById("testimonial-track");
  const dotsWrap = document.getElementById("testimonial-dots");

  if (track && dotsWrap) {
    const slides = Array.from(track.children);
    let current = 0;
    let timer;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      if (i === 0) dot.classList.add("active");
      dot.setAttribute("aria-label", `Avis ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function goTo(index) {
      current = index;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle("active", i === index));
      resetTimer();
    }

    function next() {
      goTo((current + 1) % slides.length);
    }

    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(next, 6000);
    }

    resetTimer();
  }

  /* ---------------------------------------------------------
     4bis) FILTRES DE LA GALERIE "RÉALISATIONS"
  --------------------------------------------------------- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll("#gallery-grid .gallery-item");

  function applyGalleryFilter(filter, btn) {
    filterBtns.forEach((b) => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    galleryItems.forEach((item) => {
      const match = filter === "all" || item.dataset.category === filter;
      item.classList.toggle("is-hidden", !match);
    });
  }

  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => applyGalleryFilter(btn.dataset.filter, btn));
    });

    // Permet d'arriver directement filtré depuis le menu (ex: particulier.html#f-portail)
    if (window.location.hash.startsWith("#f-")) {
      const wanted = window.location.hash.replace("#f-", "");
      const targetBtn = document.querySelector(`.filter-btn[data-filter="${wanted}"]`);
      if (targetBtn) {
        applyGalleryFilter(wanted, targetBtn);
        setTimeout(() => {
          document.getElementById("gallery-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      }
    }
  }

  /* ---------------------------------------------------------
     5) AMBIANCE SONORE — commune à toutes les pages, sans coupure
     ----------------------------------------------------------
     Le bouton #sound-toggle et le lecteur #ambiance-audio sont posés
     sur chaque page (voir sound_widget_html() dans build_pages.py) et
     restent visibles partout grâce à position:fixed. L'état (on/off)
     et la position de lecture sont mémorisés dans localStorage à
     chaque page : en changeant de page, le son ne repart jamais de
     zéro, il reprend là où il en était (ou reste coupé si on l'avait
     coupé).
  --------------------------------------------------------- */
  (function () {
    const btn = document.getElementById("sound-toggle");
    const audio = document.getElementById("ambiance-audio");
    if (!btn || !audio) return;

    const STORE_KEY = "lmds-ambiance-sonore";
    const TARGET_VOLUME = 0.55;
    let fadeTimer = null;
    let userToggledOff = false;

    function readState() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    function saveState(on) {
      try {
        localStorage.setItem(
          STORE_KEY,
          JSON.stringify({ on, t: audio.currentTime || 0, ts: Date.now() })
        );
      } catch (e) {}
    }

    function fadeTo(target, duration) {
      clearInterval(fadeTimer);
      const steps = 20;
      const stepTime = duration / steps;
      const startVol = audio.volume;
      const diff = target - startVol;
      let i = 0;
      fadeTimer = setInterval(() => {
        i++;
        audio.volume = Math.min(1, Math.max(0, startVol + (diff * i) / steps));
        if (i >= steps) {
          clearInterval(fadeTimer);
          if (target === 0) audio.pause();
        }
      }, stepTime);
    }

    function updateUI(playing) {
      btn.classList.toggle("is-playing", playing);
      btn.setAttribute("aria-pressed", playing ? "true" : "false");
    }

    // Reprend la position là où le son en était sur la page précédente,
    // pour qu'on n'entende jamais le morceau repartir du début.
    function resumeSavedPosition(saved) {
      if (!saved || !isFinite(audio.duration) || audio.duration <= 0) return;
      const elapsed = Math.max(0, (Date.now() - saved.ts) / 1000);
      const pos = (saved.t + elapsed) % audio.duration;
      if (isFinite(pos) && pos >= 0) audio.currentTime = pos;
    }

    function armFallback() {
      const events = ["click", "touchstart", "scroll", "keydown"];
      function onFirstInteraction(e) {
        events.forEach((ev) => document.removeEventListener(ev, onFirstInteraction));
        if (btn.contains(e.target)) return; // le bouton gère lui-même son propre clic
        startAmbiance(readState());
      }
      events.forEach((ev) =>
        document.addEventListener(ev, onFirstInteraction, { passive: true, once: true })
      );
    }

    function startAmbiance(saved, instant) {
      if (userToggledOff) return;
      audio.volume = instant ? TARGET_VOLUME : 0;
      const p = audio.play();
      const afterStart = () => {
        resumeSavedPosition(saved);
        if (!instant) fadeTo(TARGET_VOLUME, saved ? 350 : 1200);
        updateUI(true);
        saveState(true);
      };
      if (p && p.then) {
        p.then(afterStart).catch(armFallback);
      } else {
        afterStart();
      }
    }

    const saved = readState();
    if (saved && saved.on === false) {
      // L'utilisateur avait coupé le son : on respecte son choix sur toute la navigation.
      userToggledOff = true;
      updateUI(false);
    } else {
      // Reprise auto : première visite (fondu doux) ou arrivée depuis une autre
      // page où le son jouait déjà (reprise quasi instantanée, sans coupure).
      startAmbiance(saved);
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isPlaying = btn.classList.contains("is-playing");
      if (isPlaying) {
        fadeTo(0, 600);
        updateUI(false);
        userToggledOff = true;
        saveState(false);
      } else {
        userToggledOff = false;
        startAmbiance(readState(), true);
      }
    });

    // Position toujours à jour, pour que la page suivante reprenne pile là
    // où on en était.
    audio.addEventListener("timeupdate", () => {
      if (!userToggledOff) saveState(true);
    });
    window.addEventListener("pagehide", () => saveState(!userToggledOff));
    window.addEventListener("beforeunload", () => saveState(!userToggledOff));
  })();

  /* ---------------------------------------------------------
     6) BULLE "AVIS CLIENT" — apparaît de temps en temps, en bas
     à gauche, sur toutes les pages, avec le blason de la boîte
     comme avatar. Reprend les vrais avis Google déjà publiés
     sur la page Accueil, en version courte.
  --------------------------------------------------------- */
  (function () {
    const bubble = document.getElementById("review-bubble");
    if (!bubble) return;
    const closeBtn = bubble.querySelector(".review-bubble-close");
    const textEl = bubble.querySelector(".review-bubble-text");
    const authorEl = bubble.querySelector(".review-bubble-author");

    const REVIEWS = [
      {
        text: "Portail coulissant sur mesure, découpe laser motif branche d'olivier… Jonathan est à l'écoute, professionnel et très patient.",
        author: "Charlène Letocart — avis Google",
      },
      {
        text: "Plusieurs chantiers ensemble (portail, portillon, pergolas) : équipe professionnelle, travail méticuleux, budget maîtrisé.",
        author: "Jean-Marie Carli — avis Google",
      },
      {
        text: "Équipe à l'écoute du début à la fin, grand professionnalisme, suivi et SAV irréprochables. Notre portail est superbe.",
        author: "Jonathan Begnis Gámez — avis Google",
      },
      {
        text: "Verrière sur mesure et travaux de ferronnerie : une équipe à l'écoute, réactive et très professionnelle.",
        author: "Christian G. — avis Google",
      },
      {
        text: "Extension de bâtiment industriel puis réparation de bardage : la qualité était au rendez-vous à chaque fois.",
        author: "Lucas Labat — avis Google",
      },
    ];

    const DISMISS_KEY = "lmds-avis-bulle-fermee";
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch (e) {}
    if (dismissed) return;

    let index = Math.floor(Math.random() * REVIEWS.length);
    let hideTimer = null;
    let cycleTimer = null;

    function showNext() {
      const r = REVIEWS[index];
      index = (index + 1) % REVIEWS.length;
      textEl.textContent = r.text;
      authorEl.textContent = r.author;
      bubble.hidden = false;
      requestAnimationFrame(() => bubble.classList.add("is-visible"));
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, 8000);
    }

    function hide() {
      bubble.classList.remove("is-visible");
      clearTimeout(hideTimer);
      setTimeout(() => {
        bubble.hidden = true;
      }, 500);
    }

    function scheduleNext(delay) {
      clearTimeout(cycleTimer);
      cycleTimer = setTimeout(() => {
        showNext();
        scheduleNext(11000 + Math.random() * 7000);
      }, delay);
    }

    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      hide();
      clearTimeout(cycleTimer);
      try {
        sessionStorage.setItem(DISMISS_KEY, "1");
      } catch (e) {}
    });

    // Première apparition après un petit délai, le temps que la page s'installe.
    scheduleNext(5000);
  })();

  /* ---------------------------------------------------------
     7) ANNÉE AUTOMATIQUE DANS LE FOOTER
  --------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     8) FORMULAIRE DE CONTACT
     ----------------------------------------------------------
     Ce site est statique (HTML/CSS/JS) : ce script ne fait
     qu'empêcher le rechargement de la page et afficher un message.
     Pour recevoir réellement les messages par email, deux options :

     A) Solution sans backend (recommandée, gratuite) :
        - Crée un compte sur https://formspree.io ou https://web3forms.com
        - Remplace, dans index.html, la balise <form id="contact-form">
          par : <form id="contact-form" action="https://formspree.io/f/TON_ID" method="POST">
        - Supprime ensuite le "e.preventDefault()" ci-dessous
          (ou laisse ce script gérer juste l'UX pendant que le form
          poste normalement vers Formspree).

     B) Solution avec ton propre backend :
        - Remplace la fonction handleSubmit ci-dessous par un
          "fetch('/api/contact', { method: 'POST', body: ... })"
          vers ton serveur (Node, PHP, etc.).
  --------------------------------------------------------- */
  const form = document.getElementById("contact-form");
  const formNote = document.getElementById("form-note");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Validation basique native (via l'attribut "required" des champs)
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitBtn = form.querySelector("button[type='submit']");
      const originalBtnText = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi en cours...";
      }
      if (formNote) {
        formNote.textContent = "";
        formNote.classList.remove("form-note--error");
      }

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          if (formNote) {
            formNote.textContent =
              "Merci ! Votre message a bien été envoyé, nous vous répondons sous 24 à 48h.";
          }
          form.reset();
        } else {
          throw new Error("Envoi refusé par le serveur");
        }
      } catch (err) {
        if (formNote) {
          formNote.textContent =
            "Une erreur est survenue lors de l'envoi. Vous pouvez nous contacter directement par téléphone ou email ci-contre.";
          formNote.classList.add("form-note--error");
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

});
