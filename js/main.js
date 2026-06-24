document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile nav */
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".nav-mobile");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* Active nav link */
  const page = document.body.dataset.page;
  document.querySelectorAll(".nav-desktop a, .nav-mobile a").forEach((a) => {
    if (a.dataset.nav === page) a.classList.add("is-active");
  });

  /* Scroll reveals */
  const revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else if (revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* Legacy stat counters */
  const statNumbers = document.querySelectorAll(".stat-item .number[data-count]");
  if (statNumbers.length) {
    const animateCount = (el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (!Number.isFinite(target)) return;

      if (prefersReducedMotion) {
        el.textContent = `${target}${suffix}`;
        return;
      }

      const duration = 2000;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    if (prefersReducedMotion) {
      statNumbers.forEach(animateCount);
    } else {
      const statObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCount(entry.target);
            statObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.35, rootMargin: "0px 0px -40px 0px" }
      );
      statNumbers.forEach((el) => statObserver.observe(el));
    }
  }

});

/* Client logos carousel */
document.addEventListener("DOMContentLoaded", () => {
  const clientsTrack = document.getElementById("clients-grid");
  if (!clientsTrack) return;

  const clientsByPage = {
    signage: window.APEX_SIGNAGE_CLIENTS,
    hygenix: window.APEX_HYGENIX_CLIENTS,
  };
  const clients = clientsByPage[document.body.dataset.page];
  if (!clients?.length) return;

  const createLogoCell = (file) => {
    const cell = document.createElement("div");
    cell.className = "client-logo";
    const img = document.createElement("img");
    img.src = `assets/clients/${file}`;
    img.alt = "Client logo";
    img.loading = "lazy";
    cell.appendChild(img);
    return cell;
  };

  clients.forEach((file) => clientsTrack.appendChild(createLogoCell(file)));
  clients.forEach((file) => clientsTrack.appendChild(createLogoCell(file)));

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!prefersReducedMotion) {
    const duration = Math.max(clients.length * 2.8, 28);
    clientsTrack.style.setProperty("--carousel-duration", `${duration}s`);
    clientsTrack.classList.add("is-animating");
  }
});

/* Scroll to top */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".scroll-top");
  if (!btn) return;
  window.addEventListener(
    "scroll",
    () => btn.classList.toggle("is-visible", window.scrollY > 500),
    { passive: true }
  );
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
});

/* Contact form */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.querySelector('[name="name"]')?.value || "";
    const email = form.querySelector('[name="email"]')?.value || "";
    const message = form.querySelector('[name="message"]')?.value || "";
    const subject = encodeURIComponent(`Apex Global inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:info@apexglobalint.com?subject=${subject}&body=${body}`;
  });
});
