
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

    // Matrix Rain Columns
    const columns = Math.floor(width / 20);
    const drops: number[] = new Array(columns).fill(1);
    
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

    const animate = () => {
        // Semi-transparent black to create trail effect
        ctx.fillStyle = 'rgba(5, 5, 5, 0.05)'; 
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#003300'; // Dark Green text
        ctx.font = '14px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            
            // Randomly brighten some characters
            if (Math.random() > 0.98) {
                ctx.fillStyle = '#00ff41'; // Bright Neon Green
            } else {
                ctx.fillStyle = '#008F11'; // Matrix Green
            }

            ctx.fillText(text, i * 20, drops[i] * 20);

            if (drops[i] * 20 > height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
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

  return (
    <>
        <canvas ref={canvasRef} className="fixed inset-0 z-[-1] bg-[#050505]" />
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-80"></div>
    </>
  );
};
