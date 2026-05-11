// GTA VI intelligence homepage interactions

class ParticleBackground {
    constructor() {
        this.canvas = document.getElementById('particles');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 36 : 72;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        for (let i = 0; i < this.particleCount; i += 1) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.35,
                speedY: (Math.random() - 0.5) * 0.35,
                color: Math.random() > 0.5 ? '#ff6b00' : '#00d4ff'
            });
        }
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.y > this.canvas.height) p.y = 0;
            if (p.y < 0) p.y = this.canvas.height;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        });
        requestAnimationFrame(() => this.animate());
    }
}

class Navbar {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.menuToggle = document.querySelector('.menu-toggle');
        this.navLinks = document.querySelector('.nav-links');
        this.links = document.querySelectorAll('.nav-links a[href^="#"]');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.update());
        this.menuToggle?.addEventListener('click', () => this.navLinks?.classList.toggle('active'));
        this.links.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                this.navLinks?.classList.remove('active');
                const target = document.querySelector(link.getAttribute('href'));
                target?.scrollIntoView({ behavior: 'smooth' });
            });
        });
        this.update();
    }

    update() {
        this.navbar?.classList.toggle('scrolled', window.scrollY > 50);
        const scrollPos = window.scrollY + 120;
        document.querySelectorAll('section[id]').forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            if (scrollPos >= top && scrollPos < bottom) {
                this.links.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${section.id}`);
                });
            }
        });
    }
}

class RevealOnScroll {
    constructor() {
        const elements = document.querySelectorAll('.intel-card, .analysis-card, .source-card, .map-launch-panel');
        if (!('IntersectionObserver' in window)) return;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        elements.forEach(el => observer.observe(el));
    }
}

function setupCharacterFilters() {
    const buttons = document.querySelectorAll('[data-character-filter]');
    const cards = document.querySelectorAll('[data-character-status]');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.characterFilter;
            buttons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            cards.forEach(card => {
                card.hidden = filter !== 'all' && card.dataset.characterStatus !== filter;
            });
        });
    });
}

function setupDetailPanels() {
    document.querySelectorAll('.detail-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const panel = button.nextElementSibling;
            const open = panel?.classList.toggle('open');
            button.classList.toggle('active', Boolean(open));
            button.textContent = open ? '收起线索' : '关系线索';
        });
    });
}

function setupStoryTabs() {
    const tabs = document.querySelectorAll('[data-story-panel]');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const id = tab.dataset.storyPanel;
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.story-panel').forEach(panel => panel.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(id)?.classList.add('active');
        });
    });
}

function setupAccordions() {
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            trigger.classList.toggle('active');
            trigger.nextElementSibling?.classList.toggle('open');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    new ParticleBackground();
    new Navbar();
    new RevealOnScroll();
    setupCharacterFilters();
    setupDetailPanels();
    setupStoryTabs();
    setupAccordions();
});
