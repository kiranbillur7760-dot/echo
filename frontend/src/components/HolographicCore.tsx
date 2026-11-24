import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Cpu, Compass } from 'lucide-react';

interface Point3D {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  pulsePhase: number;
  label?: string;
}

export const HolographicCore: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePanel, setActivePanel] = useState<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angleX = 0;
    let angleY = 0;

    // Handle high DPI
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Generate 3D Spherical Nodes
    const SPHERE_RADIUS = 160;
    const NODE_COUNT = 48;
    const nodes: Point3D[] = [];

    // Golden spiral on sphere surface
    for (let i = 0; i < NODE_COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / NODE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
      const y = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
      const z = SPHERE_RADIUS * Math.cos(phi);

      const color = i % 3 === 0 ? '#00D9FF' : i % 3 === 1 ? '#167BFF' : '#925CFF';
      nodes.push({
        x,
        y,
        z,
        radius: 2 + Math.random() * 2.5,
        color,
        pulsePhase: Math.random() * Math.PI * 2,
        label: i < 6 ? ['Hypersonic CMC', 'Thermal Shield', 'CTE Shear', 'Arc-Jet Data', 'Heuristic #04', 'L/D Ratio'][i] : undefined
      });
    }

    // Ambient floating particles
    const particleCount = 60;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 500,
      z: (Math.random() - 0.5) * 300,
      speed: 0.2 + Math.random() * 0.4,
      size: 1 + Math.random() * 1.5,
      alpha: 0.1 + Math.random() * 0.4
    }));

    // Mouse movement interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseRef.current.targetX = (x / rect.width) * 0.6;
      mouseRef.current.targetY = -(y / rect.height) * 0.6;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Render loop
    let tick = 0;
    const render = () => {
      tick += 0.015;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      angleY += 0.005 + mouseRef.current.x * 0.02;
      angleX = Math.sin(tick * 0.5) * 0.15 + mouseRef.current.y;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // 1. Central Holographic Core Glow
      const coreGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 180);
      coreGlow.addColorStop(0, 'rgba(0, 217, 255, 0.25)');
      coreGlow.addColorStop(0.3, 'rgba(22, 123, 255, 0.15)');
      coreGlow.addColorStop(0.7, 'rgba(146, 92, 255, 0.05)');
      coreGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 180, 0, Math.PI * 2);
      ctx.fill();

      // 2. Animated Orbital Rings
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const ringTilt = (r * Math.PI) / 3 + tick * 0.2;
        const ringRadius = SPHERE_RADIUS + 30 + r * 20;

        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.08) {
          const rx = ringRadius * Math.cos(a);
          const ry = (ringRadius * 0.35) * Math.sin(a);

          // Rotate ring in 3D
          const rotX = rx * Math.cos(ringTilt) - ry * Math.sin(ringTilt);
          const rotY = rx * Math.sin(ringTilt) + ry * Math.cos(ringTilt);

          const px = cx + rotX;
          const py = cy + rotY;

          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = r === 0 
          ? 'rgba(0, 217, 255, 0.22)' 
          : r === 1 
          ? 'rgba(22, 123, 255, 0.18)' 
          : 'rgba(146, 92, 255, 0.16)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash(r === 1 ? [4, 6] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Ambient Floating Particles
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -250) p.y = 250;

        const pRotX = p.x * cosY - p.z * sinY;
        const pRotZ = p.x * sinY + p.z * cosY;
        const scale = 300 / (300 + pRotZ);

        const screenX = cx + pRotX * scale;
        const screenY = cy + p.y * scale;

        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 217, 255, ${p.alpha * scale})`;
        ctx.fill();
      });

      // 4. Project 3D Nodes
      const projectedNodes: Array<Point3D & { px: number; py: number; scale: number }> = [];

      nodes.forEach((n) => {
        // Rotate around Y
        const x1 = n.x * cosY - n.z * sinY;
        const z1 = n.x * sinY + n.z * cosY;

        // Rotate around X
        const y2 = n.y * cosX - z1 * sinX;
        const z2 = n.y * sinX + z1 * cosX;

        // Perspective projection
        const focalLength = 320;
        const scale = focalLength / (focalLength + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        projectedNodes.push({
          ...n,
          px,
          py,
          scale,
          z: z2
        });
      });

      // Sort by Z for realistic depth
      projectedNodes.sort((a, b) => a.z - b.z);

      // 5. Draw Interconnection Energy Lines
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const dx = projectedNodes[i].px - projectedNodes[j].px;
          const dy = projectedNodes[i].py - projectedNodes[j].py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 65) {
            const alpha = (1 - dist / 65) * 0.35 * Math.min(projectedNodes[i].scale, projectedNodes[j].scale);
            ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(projectedNodes[i].px, projectedNodes[i].py);
            ctx.lineTo(projectedNodes[j].px, projectedNodes[j].py);
            ctx.stroke();
          }
        }
      }

      // 6. Draw Nodes & Labels
      projectedNodes.forEach((n) => {
        const pulse = Math.sin(tick * 3 + n.pulsePhase) * 0.5 + 0.5;
        const radius = (n.radius + pulse * 1.5) * n.scale;

        // Outer glow
        const radGrad = ctx.createRadialGradient(n.px, n.py, 0, n.px, n.py, radius * 3.5);
        radGrad.addColorStop(0, n.color);
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(n.px, n.py, radius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Solid inner core
        ctx.fillStyle = n.z > 0 ? '#FFFFFF' : n.color;
        ctx.beginPath();
        ctx.arc(n.px, n.py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Node label for key anchor concepts
        if (n.label && n.z > 30) {
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(0, 217, 255, 0.85)';
          ctx.fillText(n.label, n.px + 8, n.py + 3);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center my-6">
      {/* Central Canvas Container */}
      <div className="relative w-full h-[460px] md:h-[520px] flex items-center justify-center">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-80" />

        {/* Real Interactive Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair relative z-10"
        />

        {/* Central Core Telemetry HUD Overlay */}
        <div className="absolute z-20 pointer-events-none flex flex-col items-center">
          <div className="px-4 py-1.5 rounded-full bg-[#07182B]/80 border border-[#00D9FF]/30 backdrop-blur-md shadow-glow-cyan flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E6A0] animate-ping" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#00D9FF]">
              ECHO CORE ONLINE • ACTIVE RECONSTRUCTION
            </span>
          </div>
        </div>

        {/* 3 Floating Interactive Panels (Flanking the Holographic Core) */}
        
        {/* Panel 1: Expert Knowledge (Left Top) */}
        <div 
          onClick={() => navigate('/knowledge')}
          onMouseEnter={() => setActivePanel(1)}
          onMouseLeave={() => setActivePanel(null)}
          className={`absolute left-2 md:left-6 top-8 z-30 w-56 md:w-64 p-4 rounded-xl glass-panel glass-panel-hover cursor-pointer transition-all duration-300 ${
            activePanel === 1 ? 'border-[#00D9FF] shadow-glow-cyan' : 'border-[#00D9FF]/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-mono text-[#00D9FF] tracking-wider uppercase">Pillar 01</h4>
              <h3 className="text-sm font-semibold text-white">EXPERT KNOWLEDGE</h3>
            </div>
          </div>
          <p className="text-xs text-[#9FB2CA] mb-2 leading-relaxed">
            Captured & Preserved. Extracting deep tacit experience, heuristics, and verified source provenance.
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#00D9FF]/80 pt-2 border-t border-[#00D9FF]/10">
            <span>PROVENANCE</span>
            <span className="text-[#00E6A0]">100% GROUNDED</span>
          </div>
        </div>

        {/* Panel 2: Decision Intelligence (Right Top) */}
        <div 
          onClick={() => navigate('/decisions')}
          onMouseEnter={() => setActivePanel(2)}
          onMouseLeave={() => setActivePanel(null)}
          className={`absolute right-2 md:right-6 top-8 z-30 w-56 md:w-64 p-4 rounded-xl glass-panel glass-panel-hover cursor-pointer transition-all duration-300 ${
            activePanel === 2 ? 'border-[#167BFF] shadow-glow-blue' : 'border-[#167BFF]/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-[#167BFF]/10 border border-[#167BFF]/30 flex items-center justify-center text-[#167BFF]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-mono text-[#167BFF] tracking-wider uppercase">Pillar 02</h4>
              <h3 className="text-sm font-semibold text-white">DECISION INTELLIGENCE</h3>
            </div>
          </div>
          <p className="text-xs text-[#9FB2CA] mb-2 leading-relaxed">
            Reconstructed & Analyzed. 9-point Decision DNA examining constraints, rejected paths, and outcomes.
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#167BFF]/80 pt-2 border-t border-[#167BFF]/10">
            <span>DECISION DNA</span>
            <span className="text-[#00D9FF]">ACTIVE ANALYSIS</span>
          </div>
        </div>

        {/* Panel 3: Intelligence Transfer (Bottom Center / Right) */}
        <div 
          onMouseEnter={() => setActivePanel(3)}
          onMouseLeave={() => setActivePanel(null)}
          className={`absolute bottom-2 md:bottom-6 z-30 w-64 md:w-72 p-4 rounded-xl glass-panel glass-panel-hover transition-all duration-300 ${
            activePanel === 3 ? 'border-[#925CFF] shadow-glow-purple' : 'border-[#925CFF]/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-[#925CFF]/10 border border-[#925CFF]/30 flex items-center justify-center text-[#925CFF]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-mono text-[#925CFF] tracking-wider uppercase">Pillar 03</h4>
              <h3 className="text-sm font-semibold text-white">INTELLIGENCE TRANSFER</h3>
            </div>
          </div>
          <p className="text-xs text-[#9FB2CA] mb-2 leading-relaxed">
            Learned & Applied. Case studies, practical challenges, and automated reasoning-based evaluations.
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#925CFF]/80 pt-2 border-t border-[#925CFF]/10">
            <span>CADET PATHWAY</span>
            <span className="text-[#00E6A0]">EVIDENCE PORTFOLIO</span>
          </div>
        </div>
      </div>
    </div>
  );
};
