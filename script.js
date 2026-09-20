(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Splash ---------- */
  var splashStart = Date.now();
  function dismissSplash() {
    $("splash").classList.add("gone");
  }
  function onLoaded() {
    setTimeout(dismissSplash, Math.max(0, 900 - (Date.now() - splashStart)));
  }
  if (document.readyState === "complete") onLoaded();
  else window.addEventListener("load", onLoaded);
  setTimeout(dismissSplash, 3000);

  /* ---------- Mobile nav ---------- */
  var burger = $("burger");
  var mobileNav = $("mobile-nav");
  function setMobile(open) {
    mobileNav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  burger.addEventListener("click", function () {
    setMobile(!mobileNav.classList.contains("open"));
  });
  mobileNav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMobile(false);
  });

  /* ---------- Scroll progress ---------- */
  var prog = $("scroll-prog");
  var ticking = false;
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateProgress);
      }
    },
    { passive: true },
  );

  /* ---------- Section spy ---------- */
  var dots = document.querySelectorAll(".spy-dot");
  var spyObs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        dots.forEach(function (d) {
          d.classList.toggle("active", d.dataset.sec === en.target.id);
        });
      });
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );
  document.querySelectorAll("section[id]").forEach(function (s) {
    spyObs.observe(s);
  });
  dots.forEach(function (d) {
    d.addEventListener("click", function () {
      var t = $(d.dataset.sec);
      if (t) t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* ---------- Scroll reveal ---------- */
  var revealObs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          revealObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  document.querySelectorAll(".reveal, .reveal-right").forEach(function (el) {
    revealObs.observe(el);
  });

  /* ---------- Background canvas ---------- */
  (function () {
    var canvas = $("bg-canvas");
    var ctx = canvas.getContext("2d");
    var W = 0,
      H = 0,
      pts = [];
    var N_DESK = 80,
      N_MOB = 28;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    function mob() {
      return window.innerWidth < 768;
    }

    function P() {
      this.init();
    }
    P.prototype.init = function () {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.r = Math.random() * 1.5 + 0.5;
      this.a = Math.random() * 0.35 + 0.05;
      var q = Math.random();
      this.c = q > 0.65 ? "#4af0c4" : q > 0.35 ? "#6c8dff" : "#f07aff";
    };
    P.prototype.step = function () {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.init();
    };
    // shadowBlur is expensive per particle per frame, so the glow is a
    // second, larger, fainter circle instead.
    P.prototype.draw = function () {
      ctx.fillStyle = this.c;
      ctx.globalAlpha = this.a * 0.25;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = this.a;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 6.283);
      ctx.fill();
    };

    function build() {
      var n = mob() ? N_MOB : N_DESK;
      pts = [];
      for (var i = 0; i < n; i++) pts.push(new P());
    }

    function mesh() {
      ctx.globalAlpha = 1;
      [
        {
          x: W * 0.15,
          y: H * 0.2,
          r: Math.min(W, H) * 0.5,
          c: "rgba(74,240,196,0.045)",
        },
        {
          x: W * 0.8,
          y: H * 0.5,
          r: Math.min(W, H) * 0.45,
          c: "rgba(108,141,255,0.040)",
        },
        {
          x: W * 0.4,
          y: H * 0.85,
          r: Math.min(W, H) * 0.4,
          c: "rgba(240,122,255,0.030)",
        },
      ].forEach(function (b) {
        var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, b.c);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, 6.283);
        ctx.fill();
      });
    }

    function lines() {
      var d = mob() ? 80 : 120;
      var d2 = d * d;
      ctx.strokeStyle = "#4af0c4";
      ctx.lineWidth = 0.5;
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x;
          var dy = pts[i].y - pts[j].y;
          var dist2 = dx * dx + dy * dy;
          if (dist2 < d2) {
            ctx.globalAlpha = (1 - Math.sqrt(dist2) / d) * 0.08;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      mesh();
      pts.forEach(function (p) {
        p.step();
        p.draw();
      });
      lines();
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    resize();
    var lastW = window.innerWidth;
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        // Mobile browsers fire resize on every URL-bar show/hide; only
        // respawn particles when the width actually changed.
        var widthChanged = window.innerWidth !== lastW;
        lastW = window.innerWidth;
        resize();
        if (reduced) mesh();
        else if (widthChanged) build();
      }, 150);
    });

    if (reduced) {
      mesh();
    } else {
      build();
      frame();
    }
  })();

  /* ---------- Resume modal ---------- */
  var modal = $("resume-modal");
  var frame = $("resume-frame");
  var lastFocus = null;

  function openResume() {
    lastFocus = document.activeElement;
    if (!frame.getAttribute("src")) frame.src = "resume.pdf";
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal-close").focus();
  }
  function closeResume() {
    if (!modal.classList.contains("open")) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll("[data-open-resume]").forEach(function (el) {
    el.addEventListener("click", openResume);
  });
  modal.querySelector(".modal-close").addEventListener("click", closeResume);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeResume();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeResume();
      setMobile(false);
      return;
    }
    if (e.key === "Tab" && modal.classList.contains("open")) {
      var items = modal.querySelectorAll("a[href], button, iframe");
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------- Contact form ---------- */
  var form = $("contact-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var err = $("form-error");
    var label = btn.innerHTML;
    err.textContent = "";
    btn.disabled = true;
    btn.textContent = "Sending...";

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Bad response: " + res.status);
        form.style.display = "none";
        $("form-success").classList.add("show");
      })
      .catch(function () {
        btn.disabled = false;
        btn.innerHTML = label;
        err.textContent =
          "Something went wrong. Please try again, or email me directly.";
      });
  });
})();
