
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

    // Cyberpunk Nodes
    const nodes: {x: number, y: number, vx: number, vy: number, size: number}[] = [];
    const maxNodes = 60;
    
    for(let i=0; i<maxNodes; i++) {
        nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1
        });
    }

    const animate = () => {
        // Deep fade for trail effect
        ctx.fillStyle = 'rgba(5, 5, 8, 0.1)'; 
        ctx.fillRect(0, 0, width, height);

        // Draw Nodes & Connections
        nodes.forEach((node, i) => {
            node.x += node.vx;
            node.y += node.vy;

            // Bounce
            if(node.x < 0 || node.x > width) node.vx *= -1;
            if(node.y < 0 || node.y > height) node.vy *= -1;

            // Draw Node
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
            ctx.fillStyle = '#00f3ff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f3ff';
            ctx.fill();
            ctx.shadowBlur = 0;

            // Connections
            for(let j=i+1; j<nodes.length; j++) {
                const node2 = nodes[j];
                const dx = node.x - node2.x;
                const dy = node.y - node2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if(dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(node2.x, node2.y);
                    ctx.strokeStyle = `rgba(0, 243, 255, ${1 - dist/100})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });

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
        <canvas ref={canvasRef} className="fixed inset-0 z-[-1] bg-[#020204]" />
        {/* Hex overlay for texture */}
        <div className="fixed inset-0 z-[-1] opacity-5 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </>
  );
};
