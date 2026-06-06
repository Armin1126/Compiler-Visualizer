import React, { useState, useEffect } from 'react';

const STAGES = [
  { id: 'Lexer',    label: 'Lex' },
  { id: 'Parser',   label: 'Par' },
  { id: 'AST',      label: 'AST' },
  { id: 'Semantic', label: 'Sem' },
  { id: 'TAC',      label: 'TAC' },
  { id: 'Optimize', label: 'Opt' },
  { id: 'CodeGen',  label: 'Gen' },
];

// What the code looks like at each compilation phase
const PHASE_VIEWS = [
  // 0 — Lexer: coloured token stream
  {
    title: 'Token Stream',
    stats: { tokens: 12, extra: '—', label2: 'Errors', time: '0.3ms' },
    render: () => (
      <div className="phase-token-stream">
        <div className="token-line">
          <span className="pt kw">int</span>
          <span className="pt id">a</span>
          <span className="pt op">=</span>
          <span className="pt num">5</span>
          <span className="pt pu">;</span>
        </div>
        <div className="token-line">
          <span className="pt kw">int</span>
          <span className="pt id">b</span>
          <span className="pt op">=</span>
          <span className="pt num">7</span>
          <span className="pt pu">;</span>
        </div>
        <div className="token-line">
          <span className="pt kw">print</span>
          <span className="pt pu">(</span>
          <span className="pt id">a</span>
          <span className="pt op">+</span>
          <span className="pt id">b</span>
          <span className="pt pu">)</span>
          <span className="pt pu">;</span>
        </div>
        <div className="phase-legend">
          <span className="pt kw">KW</span>
          <span className="pt id">ID</span>
          <span className="pt num">NUM</span>
          <span className="pt op">OP</span>
          <span className="pt pu">PUNCT</span>
        </div>
      </div>
    ),
  },

  // 1 — Parser: grammar derivation rules
  {
    title: 'Parse Rules',
    stats: { tokens: 12, extra: 3, label2: 'Stmts', time: '0.6ms' },
    render: () => (
      <div className="phase-parse-rules">
        <div className="pr-rule"><span className="pr-lhs">program</span><span className="pr-arrow">→</span><span className="pr-rhs">stmt*</span></div>
        <div className="pr-rule"><span className="pr-lhs">stmt</span><span className="pr-arrow">→</span><span className="pr-rhs">decl <span className="pr-kw">;</span></span></div>
        <div className="pr-rule indent"><span className="pr-lhs">decl</span><span className="pr-arrow">→</span><span className="pr-rhs"><span className="pr-kw">int</span> ID <span className="pr-op">=</span> expr</span></div>
        <div className="pr-rule"><span className="pr-lhs">stmt</span><span className="pr-arrow">→</span><span className="pr-rhs"><span className="pr-kw">print</span><span className="pr-kw">(</span>expr<span className="pr-kw">)</span></span></div>
        <div className="pr-rule indent"><span className="pr-lhs">expr</span><span className="pr-arrow">→</span><span className="pr-rhs">ID <span className="pr-op">+</span> ID</span></div>
      </div>
    ),
  },

  // 2 — AST: indented node tree
  {
    title: 'AST Nodes',
    stats: { tokens: 12, extra: 9, label2: 'Nodes', time: '0.9ms' },
    render: () => (
      <div className="phase-ast-text">
        <div className="at-row d0"><span className="at-node root">Program</span></div>
        <div className="at-row d1"><span className="at-tree">├─</span><span className="at-node">DeclareStmt</span><span className="at-tag">a = 5</span></div>
        <div className="at-row d2"><span className="at-tree">│ ├─</span><span className="at-node leaf">Ident</span><span className="at-val">a</span></div>
        <div className="at-row d2"><span className="at-tree">│ └─</span><span className="at-node leaf">Num</span><span className="at-val">5</span></div>
        <div className="at-row d1"><span className="at-tree">├─</span><span className="at-node">DeclareStmt</span><span className="at-tag">b = 7</span></div>
        <div className="at-row d2"><span className="at-tree">│ ├─</span><span className="at-node leaf">Ident</span><span className="at-val">b</span></div>
        <div className="at-row d2"><span className="at-tree">│ └─</span><span className="at-node leaf">Num</span><span className="at-val">7</span></div>
        <div className="at-row d1"><span className="at-tree">└─</span><span className="at-node">PrintStmt</span></div>
        <div className="at-row d2"><span className="at-tree">  └─</span><span className="at-node op">BinExpr</span><span className="at-op">+</span></div>
        <div className="at-row d3"><span className="at-tree">    ├─</span><span className="at-node leaf">Ident</span><span className="at-val">a</span></div>
        <div className="at-row d3"><span className="at-tree">    └─</span><span className="at-node leaf">Ident</span><span className="at-val">b</span></div>
      </div>
    ),
  },

  // 3 — Semantic: source with type annotations
  {
    title: 'Type Checked',
    stats: { tokens: 12, extra: 2, label2: 'Symbols', time: '1.2ms' },
    render: () => (
      <div className="phase-semantic">
        <div className="sem-line">
          <span className="sem-kw">int</span>
          <span className="sem-id">a</span>
          <span className="sem-op">=</span>
          <span className="sem-num">5</span>
          <span className="sem-pu">;</span>
          <span className="sem-type">✓ int</span>
        </div>
        <div className="sem-line">
          <span className="sem-kw">int</span>
          <span className="sem-id">b</span>
          <span className="sem-op">=</span>
          <span className="sem-num">7</span>
          <span className="sem-pu">;</span>
          <span className="sem-type">✓ int</span>
        </div>
        <div className="sem-line">
          <span className="sem-kw">print</span>
          <span className="sem-pu">(</span>
          <span className="sem-id">a</span>
          <span className="sem-op">+</span>
          <span className="sem-id">b</span>
          <span className="sem-pu">);</span>
          <span className="sem-type">✓ int</span>
        </div>
        <div className="sem-table">
          <div className="sem-row hdr"><span>Symbol</span><span>Type</span><span>Val</span></div>
          <div className="sem-row"><span className="sem-id">a</span><span>int</span><span className="sem-num">5</span></div>
          <div className="sem-row"><span className="sem-id">b</span><span>int</span><span className="sem-num">7</span></div>
        </div>
      </div>
    ),
  },

  // 4 — TAC: three-address code
  {
    title: 'Three-Address Code',
    stats: { tokens: 12, extra: 4, label2: 'Instrs', time: '1.6ms' },
    render: () => (
      <div className="phase-tac">
        <div className="tac-line"><span className="tac-ln">1</span><span className="tac-res">t1</span><span className="tac-op">=</span><span className="tac-id">a</span><span className="tac-op">+</span><span className="tac-id">b</span></div>
        <div className="tac-line"><span className="tac-ln">2</span><span className="tac-kw">param</span><span className="tac-res">t1</span></div>
        <div className="tac-line"><span className="tac-ln">3</span><span className="tac-kw">call</span><span className="tac-id">print</span><span className="tac-num">1</span></div>
        <div className="tac-comment">// a=5, b=7 stored in symbol table</div>
      </div>
    ),
  },

  // 5 — Optimize: constant folded TAC
  {
    title: 'Optimized TAC',
    stats: { tokens: 12, extra: 2, label2: 'Instrs', time: '1.9ms' },
    render: () => (
      <div className="phase-tac">
        <div className="tac-line strike"><span className="tac-ln">1</span><span className="tac-res">t1</span><span className="tac-op">=</span><span className="tac-id">a</span><span className="tac-op">+</span><span className="tac-id">b</span></div>
        <div className="tac-line folded"><span className="tac-ln">1'</span><span className="tac-res">t1</span><span className="tac-op">=</span><span className="tac-num">12</span><span className="tac-badge">CF</span></div>
        <div className="tac-line"><span className="tac-ln">2</span><span className="tac-kw">param</span><span className="tac-res">t1</span></div>
        <div className="tac-line"><span className="tac-ln">3</span><span className="tac-kw">call</span><span className="tac-id">print</span><span className="tac-num">1</span></div>
        <div className="tac-comment">// CF = Constant Folding: 5+7 → 12</div>
      </div>
    ),
  },

  // 6 — CodeGen: target assembly
  {
    title: 'Assembly Output',
    stats: { tokens: 12, extra: 4, label2: 'Instrs', time: '2ms' },
    render: () => (
      <div className="phase-asm">
        <div className="asm-line"><span className="asm-op">MOV</span><span className="asm-reg">R1</span><span className="asm-num">#5</span></div>
        <div className="asm-line"><span className="asm-op">MOV</span><span className="asm-reg">R2</span><span className="asm-num">#7</span></div>
        <div className="asm-line"><span className="asm-op">ADD</span><span className="asm-reg">R3</span><span className="asm-reg">R1</span><span className="asm-reg">R2</span></div>
        <div className="asm-line"><span className="asm-op">PRINT</span><span className="asm-reg">R3</span></div>
      </div>
    ),
  },
];

const CYCLE_MS = 1200;

export default function CompilerMiniDashboard() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveIdx(i => (i + 1) % STAGES.length), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const phase = PHASE_VIEWS[activeIdx];

  return (
    <div className="mini-dashboard">
      <div className="mini-card">

        {/* ── Code editor mockup ── */}
        <div className="mini-editor">
          <div className="editor-header">TinyLang</div>
          <pre className="editor-code">{`int a = 5;\nint b = 7;\nprint(a + b);`}</pre>
        </div>

        {/* ── Pipeline progress row ── */}
        <div className="pipeline-row">
          {STAGES.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`stage ${i === activeIdx ? 'active' : i < activeIdx ? 'done' : ''}`}>
                <div className="stage-dot" />
                <div className="stage-label">{s.label}</div>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`stage-connector ${i < activeIdx ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Phase transform panel ── */}
        <div className="phase-transform-panel" key={activeIdx}>
          <div className="phase-transform-title">{phase.title}</div>
          <div className="phase-transform-body">
            {phase.render()}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="mini-stats-row">
          <div className="mini-stat-chip">
            <span className="msc-label">Tokens</span>
            <span className="msc-val" key={`tok-${activeIdx}`}>12</span>
          </div>
          <div className="mini-stat-chip">
            <span className="msc-label">{phase.stats.label2}</span>
            <span className="msc-val" key={`ex-${activeIdx}`}>{phase.stats.extra}</span>
          </div>
          <div className="mini-stat-chip">
            <span className="msc-label">Phase</span>
            <span className="msc-val phase-name" key={`ph-${activeIdx}`}>{STAGES[activeIdx].id}</span>
          </div>
          <div className="mini-stat-chip">
            <span className="msc-label">Time</span>
            <span className="msc-val" key={`tm-${activeIdx}`}>{phase.stats.time}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
