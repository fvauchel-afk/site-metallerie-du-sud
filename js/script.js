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
