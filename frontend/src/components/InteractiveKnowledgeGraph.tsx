import React, { useEffect, useRef, useState } from 'react';
import { KnowledgeGraphData, GraphNode, GraphEdge } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Filter, X, ChevronRight, Share2, Layers } from 'lucide-react';

interface Props {
  data: KnowledgeGraphData;
  onSelectNode?: (node: GraphNode) => void;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export const InteractiveKnowledgeGraph: React.FC<Props> = ({ data, onSelectNode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimNode | null>(null);

  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);

  const categoryColors: Record<string, string> = {
    expert: '#00D9FF',
    project: '#167BFF',
    decision: '#925CFF',
    alternative: '#F59E0B',
    evidence: '#00E6A0',
    lesson: '#EC4899',
    skill: '#38BDF8',
    case_study: '#A855F7',
  };

  // Initialize simulation positions
  useEffect(() => {
    const width = 900;
    const height = 600;

    const simNodes: SimNode[] = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const dist = n.type === 'expert' ? 40 : n.type === 'decision' ? 140 : 260 + Math.random() * 40;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: n.type === 'expert' ? 24 : n.type === 'decision' ? 20 : 14,
        color: categoryColors[n.type] || '#00D9FF',
      };
    });

    nodesRef.current = simNodes;
    edgesRef.current = data.edges;
  }, [data]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Filter nodes based on category
      const visibleNodes = nodes.filter(
        (n) => activeCategory === 'all' || n.type === activeCategory
      );
      const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

      // Draw Edges
      edges.forEach((edge) => {
        if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) return;
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (!sourceNode || !targetNode) return;

        const isHighlighted =
          selectedNode &&
          (selectedNode.id === sourceNode.id || selectedNode.id === targetNode.id);

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = isHighlighted
          ? 'rgba(0, 217, 255, 0.85)'
          : 'rgba(0, 217, 255, 0.14)';
        ctx.lineWidth = isHighlighted ? 2.5 : 1.2;
        ctx.stroke();

        // Edge label on highlight
        if (isHighlighted) {
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = '#00D9FF';
          ctx.fillText(edge.label, midX + 4, midY - 4);
        }
      });

      // Draw Nodes
      visibleNodes.forEach((node) => {
        const isSelected = selectedNode?.id === node.id;

        // Outer glow
        const glowRad = node.radius * (isSelected ? 3.5 : 2.0);
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRad);
        glow.addColorStop(0, node.color);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Node Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#07182B';
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeStyle = node.color;
        ctx.stroke();

        // Inner icon / pip
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Node Label
        ctx.font = `${node.type === 'expert' ? 'bold 12px' : '11px'} Inter, sans-serif`;
        ctx.fillStyle = isSelected ? '#00D9FF' : '#F4F8FF';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 14);

        // Category Subtext
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#9FB2CA';
        ctx.fillText(node.category.toUpperCase(), node.x, node.y + node.radius + 25);
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [zoom, offset, selectedNode, activeCategory]);

  // Mouse Drag / Pan / Click handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - rect.width / 2 - offset.x) / zoom + rect.width / 2;
    const clickY = (e.clientY - rect.top - rect.height / 2 - offset.y) / zoom + rect.height / 2;

    // Check if clicked a node
    const clicked = nodesRef.current.find((n) => {
      const dx = n.x - clickX;
      const dy = n.y - clickY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 5;
    });

    if (clicked) {
      draggedNodeRef.current = clicked;
      setSelectedNode(clicked);
      if (onSelectNode) onSelectNode(clicked);
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      draggedNodeRef.current.x =
        (e.clientX - rect.left - rect.width / 2 - offset.x) / zoom + rect.width / 2;
      draggedNodeRef.current.y =
        (e.clientY - rect.top - rect.height / 2 - offset.y) / zoom + rect.height / 2;
    } else if (isDraggingRef.current) {
      setOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggedNodeRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  const categories = [
    { id: 'all', label: 'All Entities' },
    { id: 'expert', label: 'Experts', color: '#00D9FF' },
    { id: 'project', label: 'Projects', color: '#167BFF' },
    { id: 'decision', label: 'Decisions', color: '#925CFF' },
    { id: 'alternative', label: 'Alternatives', color: '#F59E0B' },
    { id: 'evidence', label: 'Evidence', color: '#00E6A0' },
    { id: 'lesson', label: 'Lessons', color: '#EC4899' },
    { id: 'skill', label: 'Skills', color: '#38BDF8' },
  ];

  return (
    <div className="relative w-full h-[650px] rounded-2xl glass-panel border border-[#00D9FF]/20 overflow-hidden flex flex-col">
      {/* Top Controls Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#061222]/90 border border-[#00D9FF]/25 backdrop-blur-md pointer-events-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeCategory === c.id
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40 shadow-glow-cyan'
                  : 'text-[#9FB2CA] hover:text-white hover:bg-white/5'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#061222]/90 border border-[#00D9FF]/25 backdrop-blur-md pointer-events-auto">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}
            className="p-1.5 rounded-lg text-[#9FB2CA] hover:text-[#00D9FF] hover:bg-white/5 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z * 0.8))}
            className="p-1.5 rounded-lg text-[#9FB2CA] hover:text-[#00D9FF] hover:bg-white/5 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-lg text-[#9FB2CA] hover:text-[#00D9FF] hover:bg-white/5 transition"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing bg-grid"
      />

      {/* Selected Entity Inspector Drawer */}
      {selectedNode && (
        <div className="absolute right-4 bottom-4 top-20 w-80 md:w-96 rounded-xl glass-panel border border-[#00D9FF]/30 p-5 overflow-y-auto z-30 shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span
                className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold"
                style={{
                  backgroundColor: `${selectedNode.color}20`,
                  color: selectedNode.color,
                  border: `1px solid ${selectedNode.color}50`,
                }}
              >
                {selectedNode.type}
              </span>
              <h3 className="text-base font-bold text-white mt-1.5 leading-snug">
                {selectedNode.label}
              </h3>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 text-[#9FB2CA] hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs text-[#9FB2CA]">
            <div className="p-3 rounded-lg bg-[#020713]/60 border border-white/5">
              <span className="font-mono text-[10px] text-[#00D9FF] uppercase tracking-wider block mb-1">
                Category
              </span>
              <p className="text-white font-medium">{selectedNode.category}</p>
            </div>

            {Object.entries(selectedNode.details).map(([key, val]) => (
              <div key={key} className="p-3 rounded-lg bg-[#020713]/60 border border-white/5">
                <span className="font-mono text-[10px] text-[#00D9FF] uppercase tracking-wider block mb-1">
                  {key.replace('_', ' ')}
                </span>
                <p className="text-white leading-relaxed">{String(val)}</p>
              </div>
            ))}

            {selectedNode.is_synthetic && (
              <div className="p-2.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-[11px] font-mono">
                ✦ SYNTHETIC DEMONSTRATION RECORD
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="absolute bottom-3 left-4 z-20 pointer-events-none flex items-center gap-3 text-[11px] font-mono text-[#9FB2CA]">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#00D9FF]" />
          <span>{data.nodes.length} Nodes</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5 text-[#167BFF]" />
          <span>{data.edges.length} Relationships</span>
        </div>
        <span>•</span>
        <span className="text-xs text-[#00E6A0]">DRAG TO PAN • SCROLL TO ZOOM</span>
      </div>
    </div>
  );
};
