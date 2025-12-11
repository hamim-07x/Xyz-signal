import React, { useEffect, useRef } from 'react';

export const BackgroundEffects: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const setSize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    setSize();

    // Configuration
    const particleCount = Math.min(Math.floor(width * 0.08), 80); 
    const connectionDistance = 120;
    const dataPacketChance = 0.02;

    class Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        char: string;
        size: number;

        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.char = Math.random() > 0.5 ? '1' : '0';
            this.size = Math.random() * 10 + 10;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            if (!ctx) return;
            ctx.fillStyle = 'rgba(0, 255, 65, 0.4)'; // Dim matrix green
            ctx.font = `bold ${this.size}px monospace`;
            ctx.fillText(this.char, this.x, this.y);
        }
    }

    class Packet {
        x: number;
        y: number;
        tx: number; // Target X
        ty: number; // Target Y
        speed: number;
        progress: number;
        active: boolean;

        constructor(p1: Particle, p2: Particle) {
            this.x = p1.x;
            this.y = p1.y;
            this.tx = p2.x;
            this.ty = p2.y;
            this.speed = 0.05;
            this.progress = 0;
            this.active = true;
        }

        update() {
            this.progress += this.speed;
            if (this.progress >= 1) {
                this.active = false;
            }
            this.x = this.x + (this.tx - this.x) * this.speed;
            this.y = this.y + (this.ty - this.y) * this.speed;
        }

        draw() {
            if (!ctx) return;
            ctx.fillStyle = '#fff'; // Bright white packet
            ctx.beginPath();
            ctx.arc(this.x, this.y - 5, 2, 0, Math.PI * 2); // Offset slightly for text center
            ctx.fill();
            
            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ff41';
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    const particles: Particle[] = [];
    let packets: Packet[] = [];

    // Initialize Particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    const animate = () => {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        // Draw connections and spawn packets
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
        ctx.lineWidth = 1;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.update();
            p.draw();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < connectionDistance) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y - 5);
                    ctx.lineTo(p2.x, p2.y - 5);
                    ctx.stroke();

                    // Chance to spawn a data packet
                    if (Math.random() < dataPacketChance) {
                        packets.push(new Packet(p, p2));
                    }
                }
            }
        }

        // Update and draw packets
        for (let i = packets.length - 1; i >= 0; i--) {
            const pkt = packets[i];
            pkt.update();
            pkt.draw();
            if (!pkt.active) {
                packets.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    window.addEventListener('resize', setSize);
    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', setSize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-1] bg-[#050505]" />;
};
