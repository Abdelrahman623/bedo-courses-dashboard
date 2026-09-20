import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useRoadmapStore } from '../../store/roadmapStore';
import type { RoadmapNode } from '../../types';
import { SlideOver } from '../ui/SlideOver';
import { Button } from '../ui/Button';
import { getAccentColor, safeUrl } from '../../lib/utils';
import { getPhasePalette, withAlpha, lighten, SEMANTIC } from '../../lib/themes';
import {
  Trash2, Sparkles, BookOpen, Clock, Compass,
  ZoomIn, ZoomOut, Maximize2, LayoutGrid, Network,
  ExternalLink, ListChecks, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Phase colors are built from the active theme package (4 roles × base/light/dim),
// so the roadmap re-colors with the theme. A phase name always hashes to the same slot.
const getPhaseColor = (phase: string): string => {
  if (!phase) return SEMANTIC.neutral;
  const palette = getPhasePalette();
  let hash = 0;
  for (let i = 0; i < phase.length; i++) hash = phase.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

// completed = semantic success (fixed) · in_progress = theme primary
const getStatusBorderColor = (status: RoadmapNode['status']) => {
  if (status === 'completed') return SEMANTIC.success;
  if (status === 'in_progress') return getAccentColor();
  return 'rgba(255,255,255,0.12)';
};

const getStatusBgColor = (status: RoadmapNode['status']) => {
  if (status === 'completed') return withAlpha(SEMANTIC.success, 0.08);
  if (status === 'in_progress') return withAlpha(getAccentColor(), 0.08);
  return '#131722';
};

interface RoadmapGraphProps {
  onOpenAddModal?: () => void;
  onOpenTemplateModal?: () => void;
}

export const RoadmapGraph: React.FC<RoadmapGraphProps> = ({ onOpenAddModal, onOpenTemplateModal }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const navigate = useNavigate();
  const { localNodes, localEdges, setLocalTopicStatus, deleteTopic, loadTemplate } = useRoadmapStore();
  const [selected, setSelected] = useState<RoadmapNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'pipeline' | 'network'>('pipeline');

  // Store bounds for reset zoom
  const boundsRef = useRef<{ midX: number; midY: number; scale: number } | null>(null);

  useEffect(() => {
    const updateDims = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    updateDims();
    const observer = new ResizeObserver(updateDims);
    if (svgRef.current?.parentElement) {
      observer.observe(svgRef.current.parentElement);
    }
    return () => observer.disconnect();
  }, []);

  const fitView = useCallback(() => {
    if (!svgRef.current || !zoomRef.current || !boundsRef.current) return;
    const { width, height } = dimensions;
    const { midX, midY, scale } = boundsRef.current;
    const translateX = width / 2 - scale * midX;
    const translateY = height / 2 - scale * midY;

    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
  }, [dimensions]);

  const handleZoom = (delta: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(200)
      .call(zoomRef.current.scaleBy, delta);
  };

  useEffect(() => {
    if (!svgRef.current || localNodes.length === 0) return;
    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Arrowhead marker definition
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', 'rgba(255,255,255,0.25)');

    // Zoom container
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 2.5])
      .on('zoom', e => g.attr('transform', e.transform));

    zoomRef.current = zoom;
    svg.call(zoom);

    if (layoutMode === 'pipeline') {
      // ══════════════════════════════════════════════════════════════════════
      // ── STRUCTURED PIPELINE LAYOUT (roadmap.sh style) ────────────────────
      // ══════════════════════════════════════════════════════════════════════
      const CARD_WIDTH = 230;
      const CARD_HEIGHT = 50;
      const COL_GAP = 85;
      const ROW_GAP = 16;
      const START_X = 60;
      const START_Y = 110;

      // Extract unique ordered phases
      const phaseList = Array.from(new Set(localNodes.map(n => n.phase))).filter(Boolean);
      const nodesByPhase: Record<string, RoadmapNode[]> = {};
      phaseList.forEach(p => { nodesByPhase[p] = localNodes.filter(n => n.phase === p); });

      // Position each node by (phase column, row index)
      interface PositionedNode extends RoadmapNode {
        x: number;
        y: number;
        width: number;
        height: number;
      }

      const positionedNodes: PositionedNode[] = [];
      const nodeMap: Record<string, PositionedNode> = {};

      phaseList.forEach((phase, colIdx) => {
        const colX = START_X + colIdx * (CARD_WIDTH + COL_GAP);
        const items = nodesByPhase[phase] || [];

        // Draw column background strip
        const colHeight = items.length * (CARD_HEIGHT + ROW_GAP) + 30;
        g.append('rect')
          .attr('x', colX - 10)
          .attr('y', START_Y - 60)
          .attr('width', CARD_WIDTH + 20)
          .attr('height', colHeight + 60)
          .attr('rx', 16)
          .attr('fill', 'rgba(255,255,255,0.015)')
          .attr('stroke', 'rgba(255,255,255,0.04)')
          .attr('stroke-width', 1);

        // Draw Phase Header
        const headerG = g.append('g').attr('transform', `translate(${colX}, ${START_Y - 45})`);

        // Phase accent dot
        headerG.append('circle')
          .attr('cx', 6)
          .attr('cy', 6)
          .attr('r', 5)
          .attr('fill', getPhaseColor(phase));

        // Phase Title
        headerG.append('text')
          .attr('x', 18)
          .attr('y', 10)
          .attr('font-size', '12px')
          .attr('font-family', 'Inter, system-ui, sans-serif')
          .attr('font-weight', '700')
          .attr('fill', '#FFFFFF')
          .text(phase);

        // Phase stats pill
        const completedCount = items.filter(n => n.status === 'completed').length;
        headerG.append('text')
          .attr('x', CARD_WIDTH)
          .attr('y', 10)
          .attr('text-anchor', 'end')
          .attr('font-size', '10px')
          .attr('font-family', 'Inter, system-ui, sans-serif')
          .attr('font-weight', '500')
          .attr('fill', completedCount === items.length && items.length > 0 ? SEMANTIC.success : '#71717A')
          .text(`${completedCount}/${items.length}`);

        items.forEach((node, rowIdx) => {
          const nodeY = START_Y + rowIdx * (CARD_HEIGHT + ROW_GAP);
          const pNode: PositionedNode = {
            ...node,
            x: colX,
            y: nodeY,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          };
          positionedNodes.push(pNode);
          nodeMap[node.id] = pNode;
        });
      });

      // Draw connecting bezier curves between prerequisites
      localEdges.forEach(edge => {
        const source = nodeMap[edge.source];
        const target = nodeMap[edge.target];
        if (!source || !target) return;

        const x1 = source.x + CARD_WIDTH;
        const y1 = source.y + CARD_HEIGHT / 2;
        const x2 = target.x;
        const y2 = target.y + CARD_HEIGHT / 2;

        let pathD = '';
        if (source.phase === target.phase) {
          // Same column loop
          const loopX = x1 + 24;
          pathD = `M ${x1} ${y1} C ${loopX} ${y1}, ${loopX} ${y2}, ${x1} ${y2}`;
        } else {
          // Cross-column smooth S-curve
          const deltaX = Math.abs(x2 - x1) * 0.5;
          pathD = `M ${x1} ${y1} C ${x1 + deltaX} ${y1}, ${x2 - deltaX} ${y2}, ${x2} ${y2}`;
        }

        const isSourceCompleted = source.status === 'completed';

        g.append('path')
          .attr('d', pathD)
          .attr('fill', 'none')
          .attr('stroke', isSourceCompleted ? withAlpha(SEMANTIC.success, 0.4) : 'rgba(255,255,255,0.12)')
          .attr('stroke-width', isSourceCompleted ? 1.5 : 1.2)
          .attr('stroke-dasharray', isSourceCompleted ? 'none' : '3,3')
          .attr('marker-end', 'url(#arrow)');
      });

      // Draw Topic Cards
      const nodeCard = g.selectAll('g.topic-card')
        .data(positionedNodes)
        .enter()
        .append('g')
        .attr('class', 'topic-card')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .style('cursor', 'pointer')
        .on('click', (_, d) => {
          setConfirmDelete(false);
          setSelected(d);
        });

      // Card Background
      nodeCard.append('rect')
        .attr('width', CARD_WIDTH)
        .attr('height', CARD_HEIGHT)
        .attr('rx', 12)
        .attr('fill', d => getStatusBgColor(d.status))
        .attr('stroke', d => getStatusBorderColor(d.status))
        .attr('stroke-width', d => d.status === 'in_progress' ? 1.8 : 1)
        .attr('class', 'transition-all')
        .on('mouseenter', function() {
          d3.select(this).attr('stroke', getAccentColor()).attr('stroke-width', 2);
        })
        .on('mouseleave', function(_, d) {
          d3.select(this).attr('stroke', getStatusBorderColor(d.status)).attr('stroke-width', d.status === 'in_progress' ? 1.8 : 1);
        });

      // Status Indicator Dot (Left side)
      nodeCard.append('circle')
        .attr('cx', 16)
        .attr('cy', CARD_HEIGHT / 2)
        .attr('r', 4.5)
        .attr('fill', d => {
          if (d.status === 'completed') return SEMANTIC.success;
          if (d.status === 'in_progress') return getAccentColor();
          return '#3F3F46';
        });

      // Topic Label (Clean legible text)
      nodeCard.append('text')
        .attr('x', 30)
        .attr('y', CARD_HEIGHT / 2 + 4)
        .attr('font-size', '11.5px')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .attr('font-weight', '500')
        .attr('fill', d => d.status === 'not_started' ? '#F1F5F9' : '#FFFFFF')
        .text(d => {
          if (d.label.length > 27) return d.label.slice(0, 25) + '…';
          return d.label;
        });

      // Status pill / icon on right
      nodeCard.filter(d => d.status === 'completed')
        .append('text')
        .attr('x', CARD_WIDTH - 14)
        .attr('y', CARD_HEIGHT / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('fill', SEMANTIC.success)
        .text('✓');

      // Auto-fit bounds calculation
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      positionedNodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.x + CARD_WIDTH > maxX) maxX = n.x + CARD_WIDTH;
        if (n.y < minY) minY = n.y;
        if (n.y + CARD_HEIGHT > maxY) maxY = n.y + CARD_HEIGHT;
      });

      const totalW = Math.max(maxX - minX + 120, 300);
      const totalH = Math.max(maxY - minY + 120, 300);
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      const scale = Math.min(Math.min((width - 60) / totalW, (height - 60) / totalH), 1.0);
      const clampedScale = Math.max(scale, 0.35);

      boundsRef.current = { midX, midY, scale: clampedScale };

      const translateX = width / 2 - clampedScale * midX;
      const translateY = height / 2 - clampedScale * midY;
      svg.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(clampedScale));

    } else {
      // ══════════════════════════════════════════════════════════════════════
      // ── FREEFORM FORCE NETWORK GRAPH ────────────────────────────────────
      // ══════════════════════════════════════════════════════════════════════
      const isLargeGraph = localNodes.length > 25;
      const linkDistance = isLargeGraph ? 150 : 190;
      const chargeStrength = isLargeGraph ? -480 : -650;

      // Smart title word wrapper for circles
      const wrapTitle = (label: string, maxChars: number = 13): string[] => {
        const cleaned = label.replace(/([/&])/g, ' $1 ').replace(/\s+/g, ' ').trim();
        const words = cleaned.split(' ');
        const lines: string[] = [];
        let cur = '';

        for (const w of words) {
          if (!cur) {
            cur = w;
          } else if ((cur + ' ' + w).length <= maxChars) {
            cur += ' ' + w;
          } else {
            lines.push(cur);
            cur = w;
          }
        }
        if (cur) lines.push(cur);
        return lines;
      };

      const getNodeRadius = (label: string) => {
        const lines = wrapTitle(label, 12);
        if (lines.length <= 1) return isLargeGraph ? 38 : 44;
        if (lines.length === 2) return isLargeGraph ? 44 : 50;
        if (lines.length === 3) return isLargeGraph ? 48 : 54;
        return isLargeGraph ? 52 : 58;
      };

      const simNodes = localNodes.map(n => ({
        ...n,
        radius: getNodeRadius(n.label),
        x: width / 2 + (Math.random() - 0.5) * 120,
        y: height / 2 + (Math.random() - 0.5) * 120,
        fx: null as number | null,
        fy: null as number | null,
      }));
      const simNodeMap = Object.fromEntries(simNodes.map(n => [n.id, n]));
      const simLinks = localEdges
        .filter(e => simNodeMap[e.source] && simNodeMap[e.target])
        .map(e => ({ source: simNodeMap[e.source], target: simNodeMap[e.target] }));

      const sim = d3.forceSimulation(simNodes as d3.SimulationNodeDatum[])
        .force('link', d3.forceLink(simLinks).distance(linkDistance).strength(0.5))
        .force('charge', d3.forceManyBody().strength(chargeStrength))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide((d: any) => (d.radius || 46) + 16))
        .stop();

      for (let i = 0; i < 300; i++) sim.tick();

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      simNodes.forEach(n => {
        const r = n.radius || 46;
        const nx = n.x ?? width / 2;
        const ny = n.y ?? height / 2;
        if (nx - r < minX) minX = nx - r;
        if (nx + r > maxX) maxX = nx + r;
        if (ny - r < minY) minY = ny - r;
        if (ny + r > maxY) maxY = ny + r;
      });

      const padding = 80;
      const graphWidth = Math.max(maxX - minX + padding * 2, 200);
      const graphHeight = Math.max(maxY - minY + padding * 2, 200);
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      const autoScale = Math.min(Math.min(width / graphWidth, height / graphHeight), 1.05);
      const clampedScale = Math.max(autoScale, 0.28);
      boundsRef.current = { midX, midY, scale: clampedScale };

      const translateX = width / 2 - clampedScale * midX;
      const translateY = height / 2 - clampedScale * midY;
      svg.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(clampedScale));

      // Draw links
      g.selectAll('line')
        .data(simLinks)
        .enter()
        .append('line')
        .attr('stroke', 'rgba(255,255,255,0.16)')
        .attr('stroke-width', 2)
        .attr('x1', d => (d.source as unknown as { x: number }).x)
        .attr('y1', d => (d.source as unknown as { y: number }).y)
        .attr('x2', d => (d.target as unknown as { x: number }).x)
        .attr('y2', d => (d.target as unknown as { y: number }).y);

      // Node drag
      const drag = d3.drag<SVGGElement, typeof simNodes[0]>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.2).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      const nodeGroup = g.selectAll('g.node')
        .data(simNodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .style('cursor', 'pointer')
        .call(drag as unknown as (selection: d3.Selection<SVGGElement, typeof simNodes[0], SVGGElement, unknown>) => void)
        .on('click', (_, d) => {
          setConfirmDelete(false);
          setSelected(d as unknown as RoadmapNode);
        });

      // Background Circle
      nodeGroup.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => {
          if (d.status === 'completed') return withAlpha(SEMANTIC.success, 0.22);
          if (d.status === 'in_progress') return withAlpha(getAccentColor(), 0.22);
          return '#151926';
        })
        .attr('stroke', d => {
          if (d.status === 'completed') return SEMANTIC.success;
          if (d.status === 'in_progress') return getAccentColor();
          return getPhaseColor(d.phase);
        })
        .attr('stroke-width', d => d.status === 'in_progress' ? 3.5 : 2.5)
        .attr('filter', 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))')
        .attr('opacity', 0.98);

      // Status indicator mini dot at top of circle
      nodeGroup.append('circle')
        .attr('cx', 0)
        .attr('cy', d => -d.radius + 7)
        .attr('r', 3)
        .attr('fill', d => {
          if (d.status === 'completed') return SEMANTIC.success;
          if (d.status === 'in_progress') return getAccentColor();
          return 'rgba(255,255,255,0.2)';
        });

      // Centered Multi-line Text
      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('pointer-events', 'none')
        .attr('font-family', 'Inter, system-ui, -apple-system, sans-serif')
        .attr('font-weight', '600')
        .attr('fill', d => {
          if (d.status === 'completed') return '#E6FFFA';
          if (d.status === 'in_progress') return lighten(getAccentColor(), 0.85);
          return '#F8FAFC';
        })
        .each(function(d) {
          const el = d3.select(this);
          const lines = wrapTitle(d.label, 12);

          // Calibrate font size based on lines count
          let fontSize = 10.5;
          if (lines.length >= 4) fontSize = 7.5;
          else if (lines.length === 3) fontSize = 8.5;
          else if (lines.length === 2) fontSize = 9.5;

          const lineHeight = fontSize * 1.25;
          const totalH = lines.length * lineHeight;
          // Offset slightly down so the status indicator at top has breathing room
          const startY = -(totalH / 2) + fontSize * 0.95 + 3;

          lines.forEach((line, idx) => {
            el.append('tspan')
              .attr('x', 0)
              .attr('y', startY + idx * lineHeight)
              .attr('font-size', `${fontSize}px`)
              .text(line);
          });
        });
    }

  }, [localNodes, localEdges, dimensions, layoutMode]);

  const handleStatusChange = (id: string, status: RoadmapNode['status']) => {
    setLocalTopicStatus(id, status);
    setSelected(prev => prev ? { ...prev, status } : null);
  };

  const handleDelete = (id: string) => {
    deleteTopic(id);
    setSelected(null);
    setConfirmDelete(false);
  };

  return (
    <div className="relative w-full h-full">
      {localNodes.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center mb-4 text-2xl">
            🗺️
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Your Roadmap is Ready to Build</h2>
          <p className="text-xs text-zinc-400 max-w-md mb-6">
            Create your custom learning path from scratch, or choose an industry-standard template to get started instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl">
            <Button
              variant="primary"
              size="md"
              icon={<Sparkles size={15} />}
              onClick={onOpenTemplateModal}
            >
              Choose a Starter Template
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Compass size={15} />}
              onClick={onOpenAddModal}
            >
              Add Custom Topic
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-wrap gap-2 justify-center">
            <span className="text-[11px] text-zinc-500 mr-1 self-center">Instant templates:</span>
            {[
              { id: 'full-stack', label: '🚀 Full-Stack Web Dev' },
              { id: 'data-analyst', label: '📊 Data Analyst' },
              { id: 'ai-engineer', label: '🤖 AI Engineer' },
              { id: 'cyber-security', label: '🛡️ Cybersecurity' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => loadTemplate(t.id)}
                className="px-2.5 py-1 text-xs rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ background: 'transparent' }}
          />

          {/* Floating Controls (Top Right): Layout Switcher + Zoom/Center */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            {/* Layout Toggle */}
            <div className="flex bg-[#131722]/90 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-xl">
              <button
                onClick={() => setLayoutMode('pipeline')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  layoutMode === 'pipeline'
                    ? 'bg-accent-amber text-[#0D0F14] shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Structured Stage-by-Stage View"
              >
                <LayoutGrid size={13} />
                <span>Roadmap View</span>
              </button>
              <button
                onClick={() => setLayoutMode('network')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  layoutMode === 'network'
                    ? 'bg-accent-amber text-[#0D0F14] shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Freeform Network Graph"
              >
                <Network size={13} />
                <span>Graph View</span>
              </button>
            </div>

            {/* Zoom / Center Controls */}
            <div className="flex items-center gap-1 bg-[#131722]/90 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-xl">
              <button
                onClick={() => handleZoom(1.3)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => handleZoom(0.7)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
              <button
                onClick={fitView}
                className="px-2.5 py-1 text-xs font-medium text-accent-amber hover:bg-accent-amber/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Center & Fit View"
              >
                <Maximize2 size={13} />
                <span>Center</span>
              </button>
            </div>
          </div>

          {/* Legend: Statuses */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 bg-[#131722]/90 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2 shadow-xl pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
              <span className="text-[11px] text-zinc-400">Not Started</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-amber" />
              <span className="text-[11px] text-zinc-400">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-completed" />
              <span className="text-[11px] text-zinc-400">Completed</span>
            </div>
          </div>
        </>
      )}

      {/* Topic Details SlideOver */}
      <SlideOver
        open={!!selected}
        onClose={() => { setSelected(null); setConfirmDelete(false); }}
        title={selected?.label || ''}
        subtitle={selected?.phase || ''}
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="text-xs text-txt-muted mb-2 font-medium">Topic Progress</p>
              <div className="grid grid-cols-3 gap-2">
                {(['not_started', 'in_progress', 'completed'] as const).map(s => {
                  const isActive = selected.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selected.id, s)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center capitalize ${
                        isActive
                          ? s === 'completed'
                            ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                            : s === 'in_progress'
                              ? 'border-accent-amber text-accent-amber bg-accent-amber/10'
                              : 'border-zinc-500 text-zinc-300 bg-white/[0.06]'
                          : 'border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs text-txt-muted mb-2 font-medium">Phase / Stage</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: getPhaseColor(selected.phase) }} />
                <span className="text-xs font-medium text-white">{selected.phase}</span>
              </div>
            </div>

            {/* Overview / Description */}
            {selected.description && (
              <div>
                <p className="text-xs text-txt-muted mb-1.5 font-medium">Concept & Overview</p>
                <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-zinc-300 leading-relaxed">
                  {selected.description}
                </div>
              </div>
            )}

            {/* Subtopics / What you need to master */}
            {selected.subtopics && selected.subtopics.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ListChecks size={13} className="text-accent-amber" />
                  <p className="text-xs text-txt-muted font-medium">What You Need to Master</p>
                </div>
                <div className="space-y-1.5">
                  {selected.subtopics.map((st, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-amber mt-1.5 flex-shrink-0" />
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Learning Resources */}
            {selected.resources && selected.resources.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ExternalLink size={13} className="text-accent-tertiary" />
                  <p className="text-xs text-txt-muted font-medium">Curated Free Resources</p>
                </div>
                <div className="space-y-1.5">
                  {selected.resources.map((res, idx) => (
                    <a
                      key={idx}
                      href={safeUrl(res.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-accent-amber/30 transition-all text-xs text-zinc-200 group"
                    >
                      <span className="truncate pr-2 group-hover:text-accent-amber transition-colors">
                        {res.title}
                      </span>
                      <ArrowUpRight size={13} className="text-zinc-500 group-hover:text-accent-amber flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 space-y-2">
              <p className="text-xs text-txt-muted mb-2 font-medium">Connected Tools</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                icon={<BookOpen size={14} className="text-accent-amber" />}
                onClick={() => navigate('/notes')}
              >
                Open in Notes Workspace
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                icon={<Clock size={14} className="text-emerald-400" />}
                onClick={() => navigate('/tracker')}
              >
                Log Study Session
              </Button>
            </div>

            <div className="pt-4">
              {confirmDelete ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-rose-300">Remove "{selected.label}"?</p>
                  <p className="text-[11px] text-zinc-400">All connections linking to this topic will also be removed.</p>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(selected.id)}>Confirm Delete</Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-2"
                  icon={<Trash2 size={14} />}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete Topic from Roadmap
                </Button>
              )}
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
};