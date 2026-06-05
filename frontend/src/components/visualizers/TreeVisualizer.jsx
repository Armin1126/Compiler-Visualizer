import { useState, useMemo, useRef, useCallback } from 'react';
import { getTreeDepth, getLeafCount, buildTreeLayout } from '../../utils/astUtils';

const NODE_W = 130;
const NODE_H = 44;
const Y_SPACING = 110;
const X_PAD_PER_LEAF = 160;

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.0;

// Walk tree to gather parent->child relationships
function buildParentMap(nodes, edges) {
  const parentMap = {};
  const childMap = {};
  edges.forEach(e => {
    parentMap[e.toId] = e.fromId;
    if (!childMap[e.fromId]) childMap[e.fromId] = [];
    childMap[e.fromId].push(e.toId);
  });
  return { parentMap, childMap };
}

// Collect all node ids from root to given node
function getAncestorPath(nodeId, parentMap) {
  const path = new Set();
  let cur = nodeId;
  while (cur) {
    path.add(cur);
    cur = parentMap[cur];
  }
  return path;
}

function TreeVisualizer({ ast }) {
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

  const { nodes, edges, svgWidth, svgHeight } = useMemo(() => {
    if (!ast) return { nodes: [], edges: [], svgWidth: 600, svgHeight: 300 };
    const depth = getTreeDepth(ast);
    const leafCount = getLeafCount(ast);
    const w = Math.max(900, leafCount * X_PAD_PER_LEAF);
    const h = Math.max(350, depth * Y_SPACING + 80);
    const { nodes, edges } = buildTreeLayout(ast, 80, w - 80, 50, Y_SPACING);
    const enrichedEdges = edges.map(e => {
      const toNode = nodes.find(n => n.x === e.toX && n.y === e.toY);
      const fromNode = nodes.find(n => n.x === e.fromX && n.y === e.fromY);
      return { ...e, toId: toNode?.id, fromId: fromNode?.id };
    });
    return { nodes, edges: enrichedEdges, svgWidth: w, svgHeight: h };
  }, [ast]);

  const { parentMap, childMap } = useMemo(() => buildParentMap(nodes, edges), [nodes, edges]);

  const focusId = selectedId || hoveredId;
  const ancestorPath = useMemo(() => focusId ? getAncestorPath(focusId, parentMap) : null, [focusId, parentMap]);
  const descendantSet = useMemo(() => {
    if (!focusId) return null;
    const set = new Set();
    const visit = (id) => {
      set.add(id);
      (childMap[id] || []).forEach(visit);
    };
    visit(focusId);
    return set;
  }, [focusId, childMap]);

  const highlightedNodes = useMemo(() => {
    if (!focusId) return null;
    const s = new Set(ancestorPath);
    descendantSet?.forEach(id => s.add(id));
    return s;
  }, [focusId, ancestorPath, descendantSet]);

  const highlightedEdges = useMemo(() => {
    if (!focusId || !highlightedNodes) return null;
    return new Set(edges.filter(e => highlightedNodes.has(e.fromId) && highlightedNodes.has(e.toId)).map(e => e.id));
  }, [focusId, highlightedNodes, edges]);

  const getNodeRole = (node) => {
    if (node.type === 'Program') return 'root';
    if (node.type === 'NumberLiteral' || node.type === 'Identifier') return 'leaf';
    return 'inner';
  };

  if (!ast) return null;

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
            <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(44,36,30,0.15)" />
            </filter>
            <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="rgba(212,163,115,0.6)" />
            </filter>
            <filter id="node-selected-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="rgba(180, 83, 9, 0.8)" />
            </filter>
              <marker id="tree-arrow" viewBox="0 0 10 10" refX="5" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(92,73,58,0.4)" pointerEvents="none" />
              </marker>
            
              <marker id="tree-arrow-active" viewBox="0 0 10 10" refX="5" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-primary)" pointerEvents="none" />
              </marker>
          </defs>

          {/* Edges */}
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
                opacity={isDimmed ? 0.15 : 1}
                style={{ transition: 'all 0.25s ease' }}
                markerEnd={isHighlighted ? 'url(#tree-arrow-active)' : 'url(#tree-arrow)'}
                pointerEvents="none"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const role = getNodeRole(node);
            const isSelected = node.id === selectedId;
            const isHovered = node.id === hoveredId;
            const isHighlighted = highlightedNodes?.has(node.id);
            const isDimmed = highlightedNodes && !isHighlighted;

            let fill = '#ffffff';
            let stroke = 'rgba(92,73,58,0.4)';
            let strokeWidth = 1.5;
            let textFill = '#2c241e';
            let filterAttr = 'url(#node-shadow)';

            if (role === 'root') {
              fill = '#fef7ed';
              stroke = 'var(--accent-primary)';
              strokeWidth = 2.5;
            } else if (role === 'leaf') {
              fill = '#f9f7f5';
              stroke = 'rgba(92,73,58,0.35)';
            }

            if (isSelected) {
              fill = 'rgba(212,163,115,0.18)';
              stroke = 'var(--accent-primary)';
              strokeWidth = 2.5;
              filterAttr = 'url(#node-selected-glow)';
              textFill = 'var(--accent-primary)';
            } else if (isHovered) {
              fill = 'rgba(212,163,115,0.1)';
              stroke = 'var(--accent-primary)';
              strokeWidth = 2;
              filterAttr = 'url(#node-glow)';
            } else if (isHighlighted && !isSelected) {
              stroke = 'var(--accent-primary)';
              strokeWidth = 2;
            }

            const opacity = isDimmed ? 0.25 : 1;
            const scale = isSelected ? 1.05 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
                style={{ transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease', transformOrigin: 'center', cursor: 'pointer', opacity }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(isSelected ? null : node.id); }}
              >
                <rect
                  x={-NODE_W / 2}
                  y={-NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx="8"
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  filter={filterAttr}
                />
                <text
                  x={0}
                  y={node.val ? -6 : 0}
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
                {node.val && (
                  <text
                    x={0}
                    y={9}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="var(--font-terminal)"
                    fontSize="10"
                    fontWeight="600"
                    fill="var(--accent-primary)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.val}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default TreeVisualizer;
