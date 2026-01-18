import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { X, ExternalLink, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/cn';

interface Node {
  id: string;
  title: string;
  type: string;
  authors?: string;
  publishedAt?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Link {
  source: string;
  target: string;
  relation: string;
}

export function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  const { data: graph } = useQuery({
    queryKey: ['public-graph'],
    queryFn: api.getPublicGraph
  });

  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
    const animationRef = useRef<number | null>(null);
  
  // Transform State (Zoom/Pan)
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingCanvas = useRef(false);
  const isDraggingNode = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<Node | null>(null);

  // Handle Wheel (Zoom) - Native listener for non-passive behavior to prevent page scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const { x, y, k } = transformRef.current;
        const zoomIntensity = 0.002; // Slightly increased sensitivity
        const delta = -e.deltaY * zoomIntensity;
        const newK = Math.min(Math.max(0.1, k + delta), 5); // Expanded zoom range
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Zoom towards cursor
        const newX = mouseX - (mouseX - x) * (newK / k);
        const newY = mouseY - (mouseY - y) * (newK / k);

        transformRef.current = { x: newX, y: newY, k: newK };
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [isFullScreen]);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            setDimensions({ width: clientWidth, height: clientHeight });
        }
    };
    
    updateSize(); // Initial
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [isFullScreen]);

  // Initialize simulation data
  useEffect(() => {
    if (!graph) return;

    if (nodesRef.current.length === 0) {
        // simple grid-ish distribution for init? 
        nodesRef.current = graph.nodes.map(n => ({
        ...n,
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0
        }));
    }
    linksRef.current = graph.links;

  }, [graph]);

  // Simulation Loop
  useEffect(() => {
    if (!graph) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
        const nodes = nodesRef.current;
        const links = linksRef.current;
        const { x: tx, y: ty, k: tk } = transformRef.current;
        const { width, height } = dimensions;
        
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(tk, tk);

        // Physics Forces
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = 2000 / (dist * dist); 
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                
                nodes[i].vx -= fx;
                nodes[i].vy -= fy;
                nodes[j].vx += fx;
                nodes[j].vy += fy;
            }
        }

        links.forEach(link => {
            const source = nodes.find(n => n.id === link.source);
            const target = nodes.find(n => n.id === link.target);
            if (source && target) {
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (dist - 100) * 0.05; 
                
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                source.vx += fx;
                source.vy += fy;
                target.vx -= fx;
                target.vy -= fy;
            }
        });

        // Center Gravity relative to current viewport dimensions
        nodes.forEach(node => {
            node.vx += (width / 2 - node.x) * 0.01;
            node.vy += (height / 2 - node.y) * 0.01;
            
            node.vx *= 0.9;
            node.vy *= 0.9;
            
            if (node !== draggedNodeRef.current) {
                node.x += node.vx;
                node.y += node.vy;
            }
        });

        // Draw Links
        ctx.lineWidth = 1.5 / tk; 
        links.forEach(link => {
            const source = nodes.find(n => n.id === link.source);
            const target = nodes.find(n => n.id === link.target);
            if (source && target) {
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                
                if (link.relation === 'prerequisite-for') ctx.strokeStyle = '#f87171';
                else if (link.relation === 'extends') ctx.strokeStyle = '#818cf8'; 
                else if (link.relation === 'critiques') ctx.strokeStyle = '#f59e0b';
                else ctx.strokeStyle = '#64748b'; // slate-500 for better visibility in dark/light
                
                ctx.stroke();
            }
        });

        // Draw Nodes
        nodes.forEach(node => {
            ctx.beginPath();
            
            ctx.arc(node.x, node.y, 8, 0, Math.PI * 2); 
            ctx.fillStyle = node.type === 'blog' ? '#f59e0b' : '#3b82f6';
            ctx.fill();
            
            if (node === selectedNode || node === hoveredNode) {
                ctx.lineWidth = 2 / tk;
                ctx.beginPath();
                 ctx.arc(node.x, node.y, 11, 0, Math.PI * 2);
                 ctx.strokeStyle = node === selectedNode ? '#fff' : 'rgba(255,255,255,0.5)';
                 ctx.stroke();
            } else {
                ctx.lineWidth = 1 / tk;
                ctx.strokeStyle = '#fff';
                ctx.stroke();
            }
            
            if (tk > 0.6 || node === hoveredNode || node === selectedNode) {
                ctx.fillStyle = '#ffffff'; // White text
                ctx.font = `500 ${14/tk}px sans-serif`;
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.textAlign = 'center';
                ctx.fillText(node.title.substring(0, 20) + (node.title.length > 20 ? '...' : ''), node.x, node.y + (24/tk));
                ctx.shadowBlur = 0; // Reset
            }
        });

        ctx.restore();
        animationRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [graph, selectedNode, hoveredNode, dimensions]);

  // Interactions
  const handleReset = () => {
    transformRef.current = { x: 0, y: 0, k: 1 };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getSimPos(e);
    const hovered = nodesRef.current.find(n => {
        const dx = n.x - pos.x;
        const dy = n.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < 15; 
    });

    if (hovered) {
        isDraggingNode.current = true;
        draggedNodeRef.current = hovered;
        if(hovered !== selectedNode) setSelectedNode(hovered);
    } else {
        isDraggingCanvas.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNode.current && draggedNodeRef.current) {
         const pos = getSimPos(e);
        draggedNodeRef.current.x = pos.x; 
        draggedNodeRef.current.y = pos.y;
        draggedNodeRef.current.vx = 0;
        draggedNodeRef.current.vy = 0;
    } else if (isDraggingCanvas.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        dragStart.current = { x: e.clientX, y: e.clientY };
    } else {
        const pos = getSimPos(e);
        const hovered = nodesRef.current.find(n => {
            const dx = n.x - pos.x;
            const dy = n.y - pos.y;
            return Math.sqrt(dx * dx + dy * dy) < 15;
        });
        setHoveredNode(hovered || null);
        if(canvasRef.current) {
            canvasRef.current.style.cursor = isDraggingCanvas.current ? 'grabbing' : (hovered ? 'pointer' : 'grab');
        }
    }
  };

  const handleMouseUp = () => {
    isDraggingNode.current = false;
    draggedNodeRef.current = null;
    isDraggingCanvas.current = false;
  };

  const getSimPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { x: tx, y: ty, k: tk } = transformRef.current;
    return {
        x: (x - tx) / tk,
        y: (y - ty) / tk
    };
  };

  const content = (
    <div 
        ref={containerRef} 
        className={cn(
            "rounded-xl overflow-hidden relative transition-all duration-300 shadow-lg",
            // Gradient background with pattern
            "bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-50",
            "dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950",
            "border-2",
            isFullScreen ? "fixed inset-0 z-[100] rounded-none w-screen h-screen border-0" : "w-full h-[600px] lg:h-[700px] border-slate-200 dark:border-slate-800"
        )}
        style={isFullScreen ? {} : {
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(var(--primary-rgb, 99, 102, 241), 0.03) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(var(--primary-rgb, 99, 102, 241), 0.03) 0%, transparent 50%)`
        }}
    >
        <canvas 
            ref={canvasRef} 
            width={dimensions.width} 
            height={dimensions.height}
            className="block cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
        
        {/* Controls */}
        <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-2">
            <Button
                variant="ghost"
                className="w-10 h-10 p-0 bg-background/90 hover:bg-background backdrop-blur-md border shadow-lg"
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Minimize" : "Maximize"}
            >
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
                variant="ghost"
                className="w-10 h-10 p-0 bg-background/90 hover:bg-background backdrop-blur-md border shadow-lg"
                onClick={handleReset}
                title="Reset View"
            >
                <RotateCcw className="h-4 w-4" />
            </Button>
        </div>

        {selectedNode && (
            <div className="absolute top-4 right-4 w-80 z-40 animate-in fade-in slide-in-from-right-4">
                <Card className="bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90 shadow-xl border-2 relative">
                    <Button 
                        variant="ghost" 
                        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full hover:bg-muted transition-colors z-50" 
                        onClick={() => setSelectedNode(null)}
                        title="Close"
                    >
                       <X className="w-4 h-4" />
                    </Button>
                    <CardHeader className="p-5 pb-3 pr-12">
                         <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-3">{selectedNode.title}</h3>
                            <div className="flex items-center gap-2 text-xs">
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium shadow-sm",
                                    selectedNode.type === 'blog' 
                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20' 
                                        : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                                )}>
                                    <span className={`w-2 h-2 rounded-full ${selectedNode.type === 'blog' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                    {selectedNode.type === 'blog' ? 'Blog Post' : 'Research Paper'}
                                </span>
                            </div>
                            {selectedNode.publishedAt && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                    Published: {new Date(selectedNode.publishedAt).toLocaleDateString()}
                                </div>
                            )}
                         </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                         <Button 
                            variant="default" 
                            className="w-full gap-2 h-10 text-sm font-medium shadow-md"
                            onClick={() => navigate(`/garden/${selectedNode.id}`)}
                         >
                            View Notes & Details <ExternalLink className="w-4 h-4" />
                         </Button>
                    </CardContent>
                </Card>
            </div>
        )}

        <div className="absolute bottom-4 left-4 p-3 bg-background/90 backdrop-blur-md rounded-lg text-xs space-y-2.5 border-2 shadow-lg pointer-events-none select-none z-40 max-w-[180px]">
            <div className="font-bold text-foreground mb-2 text-sm">Legend</div>
            <div className="space-y-1.5">
                <div className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wide">Nodes</div>
                <div className="flex items-center gap-2 text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span> 
                    <span className="text-xs">Paper</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span> 
                    <span className="text-xs">Blog</span>
                </div>
            </div>
            
            <div className="space-y-1.5 pt-2 border-t">
                <div className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wide">Relationships</div>
                <div className="flex items-center gap-2 text-foreground">
                    <span className="w-8 h-0.5 bg-slate-400 rounded-full"></span> 
                    <span className="text-xs">Related</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                    <span className="w-8 h-0.5 bg-red-400 rounded-full"></span> 
                    <span className="text-xs">Prerequisite</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                    <span className="w-8 h-0.5 bg-indigo-400 rounded-full"></span> 
                    <span className="text-xs">Extends</span>
                </div>
                 <div className="flex items-center gap-2 text-foreground">
                    <span className="w-8 h-0.5 bg-amber-400 rounded-full"></span> 
                    <span className="text-xs">Critiques</span>
                </div>
            </div>
        </div>
    </div>
  );

  if (isFullScreen) {
      return createPortal(content, document.body);
  }
  return content;
}
