import { useRef, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';

const TYPE_COLORS = {
  text: '#6C63FF',
  pdf:  '#f97316',
  url:  '#3b82f6',
};

function buildGraphData(notes) {
  const nodes = notes.map(note => ({
    id:      note.id,
    name:    note.title,
    type:    note.type || 'text',
    tags:    note.tags || [],
    summary: note.summary || '',
    val:     2 + Math.min((note.tags?.length || 0) * 0.5, 3),
    color:   TYPE_COLORS[note.type] || TYPE_COLORS.text,
  }));

  const edgeSet = new Set();
  const links   = [];
  notes.forEach(note => {
    note.relatedNoteIds?.forEach(relId => {
      const key = [note.id, relId].sort().join('--');
      if (!edgeSet.has(key) && notes.find(n => n.id === relId)) {
        edgeSet.add(key);
        links.push({ source: note.id, target: relId });
      }
    });
  });

  return { nodes, links };
}

export default function KnowledgeGraph({ notes }) {
  const navigate   = useNavigate();
  const fgRef      = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [graphData,   setGraphData]   = useState({ nodes: [], links: [] });
  const [dimensions,  setDimensions]  = useState({ width: 800, height: 600 });

  useEffect(() => { setGraphData(buildGraphData(notes)); }, [notes]);

  // ResizeObserver — keeps the canvas matching its CSS container
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.floor(width), height: Math.floor(height) });
    });
    ro.observe(containerRef.current);
    // Set initial size
    const { width, height } = containerRef.current.getBoundingClientRect();
    setDimensions({ width: Math.floor(width), height: Math.floor(height) });
    return () => ro.disconnect();
  }, []);

  const handleNodeClick = useCallback((node) => { navigate(`/notes/${node.id}`); }, [navigate]);
  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node || null);
    document.body.style.cursor = node ? 'pointer' : 'default';
  }, []);

  const handleZoomIn  = () => fgRef.current?.zoom(1.4, 300);
  const handleZoomOut = () => fgRef.current?.zoom(0.7, 300);
  const handleFit     = () => fgRef.current?.zoomToFit(400, 40);

  const paintNode = useCallback((node, ctx, globalScale) => {
    const fontSize = Math.max(10 / globalScale, 3);
    const r        = node.val * 4;
    const isHover  = hoveredNode?.id === node.id;

    ctx.shadowBlur  = isHover ? 20 : 6;
    ctx.shadowColor = node.color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color + (isHover ? 'ff' : 'cc');
    ctx.fill();

    if (isHover) {
      ctx.strokeStyle = '#ffffff44';
      ctx.lineWidth   = 1.5 / globalScale;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    if (globalScale > 0.6) {
      ctx.font          = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'middle';
      ctx.fillStyle     = '#e2e8f0';
      const truncated   = node.name.length > 20 ? node.name.slice(0, 18) + '…' : node.name;
      ctx.fillText(truncated, node.x, node.y + r + fontSize * 1.2);
    }
  }, [hoveredNode]);

  const hasConnections = graphData.links.length > 0;

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.07]"
      style={{ background: 'rgba(10,10,15,0.9)' }}>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 px-3 py-2.5 rounded-xl bg-surface-100/90 border border-white/[0.08] backdrop-blur-sm">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Legend</p>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs text-slate-400 capitalize">{type}</span>
          </div>
        ))}
        <div className="mt-1 pt-1 border-t border-white/[0.06]">
          <p className="text-[10px] text-slate-600">{notes.length} notes · {graphData.links.length} connections</p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
        {[{ icon: ZoomIn, action: handleZoomIn, title: 'Zoom in' },
          { icon: ZoomOut, action: handleZoomOut, title: 'Zoom out' },
          { icon: Maximize2, action: handleFit, title: 'Fit to screen' },
        ].map(({ icon: Icon, action, title }) => (
          <button key={title} onClick={action} title={title}
            className="w-8 h-8 rounded-lg bg-surface-100/90 border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-surface-200 transition-all backdrop-blur-sm">
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      {/* No connections hint */}
      {notes.length > 0 && !hasConnections && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2.5 rounded-xl bg-surface-100/90 border border-white/[0.08] backdrop-blur-sm text-center pointer-events-none">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-3 h-3 flex-shrink-0" />
            Connections appear automatically as you add more notes with AI analysis
          </p>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 max-w-xs px-4 py-3 rounded-xl
          bg-surface-100/95 border border-white/[0.1] backdrop-blur-xl shadow-modal animate-fade-in pointer-events-none">
          <p className="text-sm font-semibold text-slate-100 mb-1 truncate">{hoveredNode.name}</p>
          {hoveredNode.summary && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{hoveredNode.summary}</p>
          )}
          {hoveredNode.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hoveredNode.tags.slice(0, 4).map(t => (
                <span key={t} className="px-1.5 py-0.5 bg-primary/10 text-primary-300 text-[10px] rounded border border-primary/20">#{t}</span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
            <Info className="w-2.5 h-2.5" /> Click to open note
          </p>
        </div>
      )}

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <p className="text-slate-500 text-sm">No notes to visualise yet.</p>
            <p className="text-slate-600 text-xs mt-1">Add notes with AI analysis to see the graph.</p>
          </div>
        </div>
      )}

      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => 'replace'}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        linkColor={() => 'rgba(108,99,255,0.3)'}
        linkWidth={1.5}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => 'rgba(167,139,250,0.6)'}
        backgroundColor="transparent"
        cooldownTicks={120}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={30}
        enableNodeDrag
        enableZoomInteraction
        enablePanInteraction
        minZoom={0.3}
        maxZoom={6}
      />
    </div>
  );
}
