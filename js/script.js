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
     4ter) AMBIANCE SONORE (chants d'oiseaux, ex: hero Particulier)
     ----------------------------------------------------------
     Désactivée par défaut (les navigateurs bloquent de toute façon
     le son automatique) : la personne clique pour l'activer, avec
     un léger fondu à l'entrée et à la sortie.
  --------------------------------------------------------- */
  const soundToggle = document.getElementById("sound-toggle");
  const ambiance = document.getElementById("ambiance-audio");

  if (soundToggle && ambiance) {
    let fadeTimer = null;
    const TARGET_VOLUME = 0.55;

    function fadeTo(target, duration) {
      clearInterval(fadeTimer);
      const steps = 20;
      const stepTime = duration / steps;
      const startVol = ambiance.volume;
      const diff = target - startVol;
      let i = 0;
      fadeTimer = setInterval(() => {
        i++;
        ambiance.volume = Math.min(1, Math.max(0, startVol + (diff * i) / steps));
        if (i >= steps) {
          clearInterval(fadeTimer);
          if (target === 0) ambiance.pause();
        }
      }, stepTime);
    }

    soundToggle.addEventListener("click", () => {
      const isPlaying = soundToggle.classList.contains("is-playing");
      if (isPlaying) {
        fadeTo(0, 600);
        soundToggle.classList.remove("is-playing");
        soundToggle.setAttribute("aria-pressed", "false");
      } else {
        ambiance.volume = 0;
        ambiance.play().catch(() => {});
        fadeTo(TARGET_VOLUME, 900);
        soundToggle.classList.add("is-playing");
        soundToggle.setAttribute("aria-pressed", "true");
      }
    });
  }

  /* ---------------------------------------------------------
     5) ANNÉE AUTOMATIQUE DANS LE FOOTER
  --------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     6) FORMULAIRE DE CONTACT
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
