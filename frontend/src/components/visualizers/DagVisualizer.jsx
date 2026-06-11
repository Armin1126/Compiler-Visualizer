import { useState, useMemo, useRef, useCallback } from 'react';
import { buildDagGraph, buildDagFromTac } from '../../utils/dagUtils';

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.0;

function DagVisualizer({ ast, tac }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(0.75);
  const containerRef = useRef(null);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2))), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2))), []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(z + delta).toFixed(2))));
    }
  }, []);

  const rawNodes = useMemo(() => ast ? buildDagGraph(ast) : buildDagFromTac(tac), [ast, tac]);

  const { nodes, edges, coords, svgWidth, svgHeight } = useMemo(() => {
    if (!rawNodes || rawNodes.length === 0) return { nodes: [], edges: [], coords: {}, svgWidth: 600, svgHeight: 300 };

    const heights = {};
    const getHeight = (node) => {
      if (heights[node.id] !== undefined) return heights[node.id];
      if (!node.children || node.children.length === 0) { heights[node.id] = 0; return 0; }
      const h = 1 + Math.max(...node.children.map(c => getHeight(c)));
      heights[node.id] = h;
      return h;
    };
    rawNodes.forEach(n => getHeight(n));

    const maxH = Math.max(...Object.values(heights));
    const layers = {};
    for (let i = 0; i <= maxH; i++) layers[i] = [];
    rawNodes.forEach(n => layers[heights[n.id]].push(n));

    const maxLayerSize = Math.max(...Object.values(layers).map(l => l.length));
    const nodeW = 130;
    const xGap = 50;
    const ySpacing = 110;
    const w = Math.max(700, maxLayerSize * (nodeW + xGap) + 100);
    const h = Math.max(320, (maxH + 1) * ySpacing + 80);

    const coords = {};
    for (let layerH = 0; layerH <= maxH; layerH++) {
      const layerNodes = layers[layerH];
      const K = layerNodes.length;
      layerNodes.forEach((node, i) => {
        const x = 50 + (i + 0.5) * ((w - 100) / K);
        const y = h - 50 - layerH * ySpacing;
        coords[node.id] = { x, y };
      });
    }

    const edges = [];
    rawNodes.forEach(parent => {
      parent.children.forEach(child => {
        if (coords[parent.id] && coords[child.id]) {
          edges.push({
            id: `${parent.id}-${child.id}`,
            fromX: coords[parent.id].x,
            fromY: coords[parent.id].y,
            toX: coords[child.id].x,
            toY: coords[child.id].y,
            fromId: parent.id,
            toId: child.id,
          });
        }
      });
    });

    return { nodes: rawNodes, edges, coords, svgWidth: w, svgHeight: h };
  }, [rawNodes]);

  const childMap = useMemo(() => {
    const m = {};
    edges.forEach(e => {
      if (!m[e.fromId]) m[e.fromId] = [];
      m[e.fromId].push(e.toId);
    });
    return m;
  }, [edges]);

  const parentMap = useMemo(() => {
    const m = {};
    edges.forEach(e => { m[e.toId] = e.fromId; });
    return m;
  }, [edges]);

  const focusId = selectedId || hoveredId;

  const highlightedNodes = useMemo(() => {
    if (!focusId) return null;
    const set = new Set();
    let cur = focusId;
    while (cur) { set.add(cur); cur = parentMap[cur]; }
    const visitDown = (id) => { set.add(id); (childMap[id] || []).forEach(visitDown); };
    visitDown(focusId);
    return set;
  }, [focusId, parentMap, childMap]);

  const highlightedEdges = useMemo(() => {
    if (!highlightedNodes) return null;
    return new Set(edges.filter(e => highlightedNodes.has(e.fromId) && highlightedNodes.has(e.toId)).map(e => e.id));
  }, [highlightedNodes, edges]);

  if (!rawNodes || rawNodes.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>No statements to construct DAG.</div>;
  }

  const nodeW = 130;
  const nodeH = 40;
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="graph-viz-wrapper">
      <div className="graph-zoom-toolbar">
        <button className="graph-zoom-btn" onClick={handleZoomOut} title="Zoom Out" disabled={zoom <= MIN_ZOOM}>−</button>
        <span className="graph-zoom-level">{zoomPercent}%</span>
        <button className="graph-zoom-btn" onClick={handleZoomIn} title="Zoom In" disabled={zoom >= MAX_ZOOM}>+</button>
      </div>
      <div
        className="graph-svg-container"
        ref={containerRef}
        onWheel={handleWheel}
      >
        <svg
          width={svgWidth * zoom}
          height={svgHeight * zoom}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="graph-svg"
          style={{ cursor: 'default' }}
          onClick={(e) => { if (e.target.tagName === 'svg') setSelectedId(null); }}
        >
          <defs>
            <filter id="dag-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(44,36,30,0.15)" />
            </filter>
            <filter id="dag-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="rgba(212,163,115,0.6)" />
            </filter>
            <marker id="dag-arrow" viewBox="0 0 10 10" refX="5" refY="5"
              markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(92,73,58,0.4)" pointerEvents="none" />
            </marker>
            <marker id="dag-arrow-active" viewBox="0 0 10 10" refX="5" refY="5"
              markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-primary)" pointerEvents="none" />
            </marker>
          </defs>

          {edges.map(edge => {
            const isHighlighted = highlightedEdges?.has(edge.id);
            const isDimmed = highlightedNodes && !isHighlighted;
            const midY = (edge.fromY + edge.toY) / 2;
            const pathD = `M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${midY + 10}, ${edge.toX} ${midY - 10}, ${edge.toX} ${edge.toY}`;
            return (
              <path
                key={edge.id}
                d={pathD}
                stroke={isHighlighted ? 'var(--accent-primary)' : 'rgba(92,73,58,0.28)'}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                fill="none"
                opacity={isDimmed ? 0.12 : 1}
                style={{ transition: 'all 0.25s ease' }}
                markerEnd={isHighlighted ? 'url(#dag-arrow-active)' : 'url(#dag-arrow)'}
                pointerEvents="none"
              />
            );
          })}

          {nodes.map(node => {
            if (!coords[node.id]) return null;
            const { x, y } = coords[node.id];
            const isLeaf = node.children.length === 0;
            const isRoot = !nodes.some(p => p.children.some(c => c.id === node.id));
            const isSelected = node.id === selectedId;
            const isHovered = node.id === hoveredId;
            const isHighlighted = highlightedNodes?.has(node.id);
            const isDimmed = highlightedNodes && !isHighlighted;

            let fill = '#ffffff';
            let stroke = 'rgba(92,73,58,0.4)';
            let strokeWidth = 1.5;
            let textFill = '#2c241e';
            let filterAttr = 'url(#dag-shadow)';

            if (isRoot) { fill = '#fef7ed'; stroke = 'var(--accent-primary)'; strokeWidth = 2.5; }
            if (isLeaf && !isRoot) { fill = '#f9f7f5'; }

            if (isSelected) {
              fill = 'rgba(212,163,115,0.18)';
              stroke = 'var(--accent-primary)';
              strokeWidth = 2.5;
              filterAttr = 'url(#dag-glow)';
              textFill = 'var(--accent-primary)';
            } else if (isHovered) {
              fill = 'rgba(212,163,115,0.1)';
              stroke = 'var(--accent-primary)';
              strokeWidth = 2;
              filterAttr = 'url(#dag-glow)';
            } else if (isHighlighted) {
              stroke = 'var(--accent-primary)';
              strokeWidth = 2;
            }

            const opacity = isDimmed ? 0.2 : 1;
            const scale = isSelected ? 1.05 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y}) scale(${scale})`}
                style={{ transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease', transformOrigin: 'center', cursor: 'pointer', opacity }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(isSelected ? null : node.id); }}
              >
                <rect
                  x={-nodeW / 2}
                  y={-nodeH / 2}
                  width={nodeW}
                  height={nodeH}
                  rx="8"
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  filter={filterAttr}
                />
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="12"
                  fontWeight="700"
                  fill={textFill}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default DagVisualizer;
