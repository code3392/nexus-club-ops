// High-Performance Interactive Particle Constellation Canvas (Batched 60fps)
export class NetworkCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = 24;
    this.mouse = { x: -1000, y: -1000, radius: 110 };
    this.animId = null;
    this.isPaused = false;

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    window.addEventListener('resize', this.resize, { passive: true });
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', this.handleMouseLeave, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.resize();
    this.initParticles();
    this.animate();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.isPaused = true;
      if (this.animId) cancelAnimationFrame(this.animId);
    } else {
      this.isPaused = false;
      this.animId = requestAnimationFrame(this.animate);
    }
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.maxParticles = Math.min(26, Math.max(12, Math.floor((this.width * this.height) / 45000)));
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.5 + 1
      });
    }
  }

  handleMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  handleMouseLeave() {
    this.mouse.x = -1000;
    this.mouse.y = -1000;
  }

  animate() {
    if (this.isPaused || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const len = this.particles.length;

    // 1. Update positions
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      // Mouse interactive deflection
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const distSq = dx * dx + dy * dy;
      const mRadiusSq = this.mouse.radius * this.mouse.radius;
      if (distSq < mRadiusSq && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        p.x -= (dx / dist) * force * 1.2;
        p.y -= (dy / dist) * force * 1.2;
      }
    }

    // 2. Batch draw connections (single stroke call)
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.lineWidth = 0.75;
    const maxDist = 110;
    const maxDistSq = maxDist * maxDist;

    for (let i = 0; i < len; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < len; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        if (dx * dx + dy * dy < maxDistSq) {
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
        }
      }

      // Mouse connection line
      const mdx = this.mouse.x - p1.x;
      const mdy = this.mouse.y - p1.y;
      if (mdx * mdx + mdy * mdy < maxDistSq) {
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(this.mouse.x, this.mouse.y);
      }
    }
    this.ctx.stroke();

    // 3. Batch draw particles (single fill call)
    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];
      this.ctx.moveTo(p.x + p.radius, p.y);
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    }
    this.ctx.fill();

    this.animId = requestAnimationFrame(this.animate);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}
