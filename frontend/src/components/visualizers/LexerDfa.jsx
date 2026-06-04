import { useState } from 'react';

const DFA_NODES = [
  { id: 'START',         label: 'START',  cx: 70,  cy: 150, r: 30 },
  { id: 'IN_IDENTIFIER', label: 'IDENT',  cx: 250, cy: 75,  r: 30 },
  { id: 'IN_NUMBER',     label: 'NUM',    cx: 250, cy: 225, r: 30 },
  { id: 'DONE',          label: 'DONE',   cx: 430, cy: 150, r: 30 },
];

const DFA_EDGES = [
  { from: 'START',         to: 'IN_IDENTIFIER', label: 'a-z',     labelX: 148, labelY: 96,  path: 'M 97 130 L 222 92' },
  { from: 'IN_IDENTIFIER', to: 'IN_IDENTIFIER', label: 'a-z,0-9', labelX: 252, labelY: 32,  path: 'M 244 46 C 235 22, 268 22, 278 49' },
  { from: 'IN_IDENTIFIER', to: 'DONE',          label: 'delim',   labelX: 345, labelY: 96,  path: 'M 278 92 L 402 130' },
  { from: 'START',         to: 'IN_NUMBER',      label: '0-9',     labelX: 148, labelY: 204, path: 'M 97 170 L 222 208' },
  { from: 'IN_NUMBER',     to: 'IN_NUMBER',      label: '0-9',     labelX: 252, labelY: 272, path: 'M 244 254 C 235 278, 268 278, 278 251' },
  { from: 'IN_NUMBER',     to: 'DONE',           label: 'delim',   labelX: 345, labelY: 204, path: 'M 278 208 L 402 170' },
  { from: 'START',         to: 'DONE',           label: 'op/pct',  labelX: 250, labelY: 164, path: 'M 100 150 L 400 150' },
];

export default function LexerDfa({ activeState }) {
  const [hoveredNode, setHoveredNode] = useState(null);

  const getNodeState = (nodeId) => {
    if (nodeId === activeState) return 'active';
    if (hoveredNode === nodeId) return 'hovered';
    return 'idle';
  };

  const isEdgeActive = (edge) => edge.from === activeState;
  const isEdgeRelated = (edge) => edge.from === activeState || edge.to === activeState;

  return (
    <div className="dfa-svg-container">
      <svg width="510" height="300" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id="dfa-node-shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(44,36,30,0.15)" />
          </filter>
          <filter id="dfa-node-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="rgba(212,163,115,0.65)" />
          </filter>
          <filter id="dfa-node-done-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="rgba(13,148,136,0.65)" />
          </filter>

          {/* Default arrow */}
          <marker id="dfa-arrow-idle" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(92,73,58,0.3)" />
          </marker>
          {/* Active arrow */}
          <marker id="dfa-arrow-active" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-primary)" />
          </marker>
          {/* Initial entry arrow */}
          <marker id="dfa-arrow-entry" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(92,73,58,0.45)" />
          </marker>
        </defs>

        {/* Entry arrow to START */}
        <path d="M 18 150 L 37 150" stroke="rgba(92,73,58,0.45)" strokeWidth="2"
          fill="none" markerEnd="url(#dfa-arrow-entry)" />
        <text x="10" y="144" fontFamily="var(--font-terminal)" fontSize="8"
          fill="var(--text-muted)" textAnchor="middle">▶</text>

        {/* Edges */}
        {DFA_EDGES.map((e, idx) => {
          const active = isEdgeActive(e);
          const related = isEdgeRelated(e);
          return (
            <g key={idx}>
              <path
                d={e.path}
                stroke={active ? 'var(--accent-primary)' : 'rgba(92,73,58,0.25)'}
                strokeWidth={active ? 2.5 : 1.5}
                fill="none"
                opacity={activeState && !related ? 0.3 : 1}
                markerEnd={active ? 'url(#dfa-arrow-active)' : 'url(#dfa-arrow-idle)'}
                style={{ transition: 'all 0.3s ease' }}
              />
              <text
                x={e.labelX}
                y={e.labelY}
                fontFamily="var(--font-mono)"
                fontSize="9"
                fontWeight={active ? '700' : '500'}
                fill={active ? 'var(--accent-primary)' : 'var(--text-muted)'}
                textAnchor="middle"
                opacity={activeState && !related ? 0.35 : 1}
                style={{ transition: 'all 0.3s ease' }}
              >
                {e.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {DFA_NODES.map(n => {
          const state = getNodeState(n.id);
          const isDone = n.id === 'DONE';
          const isActive = state === 'active';
          const isHov = state === 'hovered';

          let fill = '#ffffff';
          let stroke = 'rgba(92,73,58,0.4)';
          let strokeWidth = 1.5;
          let textFill = '#2c241e';
          let filterAttr = 'url(#dfa-node-shadow)';
          let scale = 1;

          if (isActive) {
            fill = isDone ? 'rgba(13,148,136,0.12)' : 'rgba(212,163,115,0.15)';
            stroke = isDone ? 'rgb(13,148,136)' : 'var(--accent-primary)';
            strokeWidth = 2.5;
            textFill = isDone ? 'rgb(13,148,136)' : 'var(--accent-primary)';
            filterAttr = isDone ? 'url(#dfa-node-done-glow)' : 'url(#dfa-node-glow)';
            scale = 1.1;
          } else if (isHov) {
            fill = 'rgba(212,163,115,0.08)';
            stroke = 'var(--accent-primary)';
            strokeWidth = 2;
            filterAttr = 'url(#dfa-node-glow)';
            scale = 1.06;
          }

          const opacity = activeState && !isActive && n.id !== 'START' ? 0.55 : 1;

          return (
            <g
              key={n.id}
              transform={`translate(${n.cx}, ${n.cy}) scale(${scale})`}
              style={{ transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease', transformOrigin: 'center', cursor: 'pointer', opacity }}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Outer circle */}
              <circle
                cx={0} cy={0} r={n.r}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                filter={filterAttr}
              />
              {/* Double ring for DONE state */}
              {isDone && (
                <circle
                  cx={0} cy={0} r={n.r - 5}
                  fill="none"
                  stroke={isActive ? 'rgb(13,148,136)' : 'rgba(92,73,58,0.3)'}
                  strokeWidth={isActive ? 1.5 : 1}
                  style={{ transition: 'all 0.25s ease' }}
                />
              )}
              <text
                x={0} y={0}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-terminal)"
                fontSize="9"
                fontWeight="700"
                fill={textFill}
                letterSpacing="0.05em"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
