/**
 * Hotel El Escondite — VIP Micro-Interactions
 * Page loader, cursor glow, text splits, image reveals,
 * magnetic buttons, scroll progress, grain texture.
 */

(function () {
    'use strict';

    // --- Utilities ---
    function rafThrottle(fn) {
        var ticking = false;
        return function () {
            var args = arguments;
            var ctx = this;
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                fn.apply(ctx, args);
                ticking = false;
            });
        };
    }

    function createObserver(selector, opts) {
        var defaults = { threshold: 0.15, rootMargin: '0px 0px -40px 0px', cls: 'is-visible', once: true, onEnter: null };
        var o = Object.assign({}, defaults, opts);
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll(selector).forEach(function (el) { el.classList.add(o.cls); });
            return;
        }
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add(o.cls);
                    if (o.onEnter) o.onEnter(entry.target);
                    if (o.once) obs.unobserve(entry.target);
                }
            });
        }, { threshold: o.threshold, rootMargin: o.rootMargin });
        document.querySelectorAll(selector).forEach(function (el) { obs.observe(el); });
    }

    // --- DOM ---
    var navbar = document.getElementById('navbar');
    var navToggle = document.getElementById('navToggle');
    var navMenu = document.getElementById('navMenu');
    var navLinks = navMenu.querySelectorAll('.nav-link, .nav-cta');
    var loader = document.getElementById('pageLoader');
    var progressBar = document.getElementById('scrollProgress');

    // --- Particle Mesh Engine ---
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function createParticleMesh(canvas, opts) {
        if (!canvas || reducedMotion) return { start: function(){}, stop: function(){} };
        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w, h, particles = [], running = false;
        var count = opts.count || 40;
        var connectDist = opts.connectDist || 150;
        var speed = opts.speed || 0.4;
        var lineAlpha = opts.lineAlpha || 0.25;
        var dotAlpha = opts.dotAlpha || 0.4;
        var dotSize = opts.dotSize || 1.5;
        var color = opts.color || '196, 101, 58';

        function resize() {
            w = canvas.offsetWidth;
            h = canvas.offsetHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
        }

        function init() {
            resize();
            particles = [];
            for (var i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed,
                    r: Math.random() * dotSize + 0.5
                });
            }
        }

        function draw() {
            if (!running) return;
            ctx.clearRect(0, 0, w, h);
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
            }
            for (var i = 0; i < particles.length; i++) {
                for (var j = i + 1; j < particles.length; j++) {
                    var dx = particles[i].x - particles[j].x;
                    var dy = particles[i].y - particles[j].y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < connectDist) {
                        ctx.beginPath();
                        ctx.strokeStyle = 'rgba(' + color + ',' + ((1 - dist / connectDist) * lineAlpha) + ')';
                        ctx.lineWidth = 0.6;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            if (!opts.noDots) {
                for (var i = 0; i < particles.length; i++) {
                    ctx.beginPath();
                    ctx.arc(particles[i].x, particles[i].y, particles[i].r, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(' + color + ',' + dotAlpha + ')';
                    ctx.fill();
                }
            }
            requestAnimationFrame(draw);
        }

        init();
        window.addEventListener('resize', resize);

        return {
            start: function () { if (!running) { running = true; draw(); } },
            stop: function () { running = false; }
        };
    }

    // --- Loader Particles ---
    (function () {
        var loaderMesh = createParticleMesh(document.getElementById('loaderCanvas'), {
            count: 60, connectDist: 150, speed: 0.6, lineAlpha: 0.35, dotAlpha: 0.5, dotSize: 2
        });
        loaderMesh.start();
        var stopObserver = new MutationObserver(function () {
            if (loader && loader.classList.contains('is-loaded')) {
                loaderMesh.stop();
                stopObserver.disconnect();
            }
        });
        if (loader) stopObserver.observe(loader, { attributes: true, attributeFilter: ['class'] });
    })();

    // --- Page Section Particles (lean, only when visible) ---
    (function () {
        if (reducedMotion) return;

        function addMesh(selector, opts) {
            document.querySelectorAll(selector).forEach(function (section) {
                var canvas = document.createElement('canvas');
                canvas.className = 'section-particles';
                canvas.setAttribute('aria-hidden', 'true');
                section.style.position = section.style.position || 'relative';
                section.style.overflow = 'hidden';
                section.insertBefore(canvas, section.firstChild);

                var mesh = createParticleMesh(canvas, opts);
                var obs = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) mesh.start();
                        else mesh.stop();
                    });
                }, { threshold: 0.05 });
                obs.observe(section);
            });
        }

        // Dark sections (rooms, footer) — orange accent
        addMesh('.ambient-glow', {
            count: 25, connectDist: 120, speed: 0.25,
            lineAlpha: 0.15, dotAlpha: 0.2, dotSize: 1.2,
            color: '196, 101, 58'
        });

        // Light sections — dark gray lines only, no dots
        addMesh('.about, .amenities, .gallery, .reviews, .location', {
            count: 35, connectDist: 160, speed: 0.3,
            lineAlpha: 0.45, dotAlpha: 0, dotSize: 0,
            color: '80, 75, 70', noDots: true
        });

        // Green section (daypass) — dark gray lines only
        addMesh('.daypass', {
            count: 30, connectDist: 150, speed: 0.25,
            lineAlpha: 0.35, dotAlpha: 0, dotSize: 0,
            color: '30, 30, 25', noDots: true
        });
    })();

    // --- Nav Toggle ---
    function closeNav() {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    navToggle.addEventListener('click', function () {
        var isOpen = navMenu.classList.contains('active');
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', String(!isOpen));
        document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    navLinks.forEach(function (l) { l.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeNav();
            navToggle.focus();
        }
    });

    // --- Scroll: Navbar + Progress ---
    window.addEventListener('scroll', rafThrottle(function () {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
        if (progressBar) {
            var h = document.documentElement.scrollHeight - window.innerHeight;
            progressBar.style.width = h > 0 ? ((window.scrollY / h) * 100) + '%' : '0%';
        }
    }), { passive: true });

    // --- Page Loader ---
    window.addEventListener('load', function () {
        setTimeout(function () {
            if (loader) loader.classList.add('is-loaded');
            document.body.classList.add('is-loaded');
        }, 3000);
    });

    // --- Text Split: Characters ---
    document.querySelectorAll('[data-split="chars"]').forEach(function (el) {
        var text = el.textContent;
        el.textContent = '';
        var chars = text.split('');
        chars.forEach(function (c, i) {
            var span = document.createElement('span');
            span.classList.add('char');
            span.textContent = c === ' ' ? '\u00A0' : c;
            span.style.transitionDelay = (0.03 * i) + 's';
            el.appendChild(span);
        });
    });

    // --- Text Split: Words ---
    document.querySelectorAll('[data-split="words"]').forEach(function (el) {
        var words = el.textContent.trim().split(/\s+/);
        el.textContent = '';
        words.forEach(function (w, i) {
            var outer = document.createElement('span');
            outer.classList.add('word');
            var inner = document.createElement('span');
            inner.classList.add('word-inner');
            inner.textContent = w;
            inner.style.transitionDelay = (0.06 * i) + 's';
            outer.appendChild(inner);
            el.appendChild(outer);
        });
    });

    // --- Observers ---
    createObserver('.reveal', { cls: 'visible' });
    createObserver('.clip-reveal', { cls: 'visible' });
    createObserver('.reveal-image');
    createObserver('.split-text');

    // --- Stagger grid children ---
    document.querySelectorAll('.amenities-grid, .reviews-grid, .gallery-grid').forEach(function (grid) {
        grid.querySelectorAll('.reveal').forEach(function (child, i) {
            child.style.transitionDelay = (i * 0.08) + 's';
        });
    });

    // --- Hero Cursor Glow ---
    var hero = document.querySelector('.hero');
    var glow = document.querySelector('.hero-glow');
    if (hero && glow && window.matchMedia('(hover: hover)').matches) {
        hero.addEventListener('mousemove', rafThrottle(function (e) {
            var rect = hero.getBoundingClientRect();
            glow.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
            glow.style.setProperty('--my', (e.clientY - rect.top) + 'px');
        }));
    }

    // --- Magnetic Buttons ---
    if (window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('.btn').forEach(function (btn) {
            btn.classList.add('btn-magnetic');
            btn.addEventListener('mousemove', function (e) {
                var rect = btn.getBoundingClientRect();
                var x = e.clientX - rect.left - rect.width / 2;
                var y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = 'translate(' + (x * 0.15) + 'px,' + (y * 0.15) + 'px)';
            });
            btn.addEventListener('mouseleave', function () {
                btn.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
                btn.style.transform = 'translate(0,0)';
                setTimeout(function () { btn.style.transition = ''; }, 400);
            });
        });
    }

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var id = this.getAttribute('href');
            if (id === '#') return;
            var target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Initial state ---
    navbar.classList.toggle('scrolled', window.scrollY > 60);
})();
