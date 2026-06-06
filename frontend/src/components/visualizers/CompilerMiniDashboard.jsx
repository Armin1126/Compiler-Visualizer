import React from 'react';

const CODE = `int a = 5;\nint b = 7;\nprint(a + b);`;
const STAGES = ['Lexer', 'Parser', 'AST', 'Semantic', 'TAC', 'Optimize', 'CodeGen'];

export default function CompilerMiniDashboard({ active = 'Semantic' }) {
  return (
    <div className="mini-dashboard">
      <div className="mini-card glass">
        <div className="mini-editor">
          <div className="editor-header">TinyLang</div>
          <pre className="editor-code">{CODE}</pre>
        </div>

        <div className="pipeline-row">
          {STAGES.map((s, i) => (
            <div key={s} className={`stage ${s === active ? 'active' : ''}`}>
              <div className="stage-dot" />
              <div className="stage-label">{s}</div>
              {i < STAGES.length - 1 && <div className="stage-connector" />}
            </div>
          ))}
        </div>

        <div className="mini-body">
          <div className="ast-panel">
            <div className="ast-title">AST</div>
            <div className="ast-tree">
              <div className="node">+</div>
              <div className="children">
                <div className="leaf">a</div>
                <div className="leaf">b</div>
              </div>
            </div>
          </div>

          <div className="stats-panel">
            <div className="stat">Tokens<br/><span>12</span></div>
            <div className="stat">AST Nodes<br/><span>7</span></div>
            <div className="stat">TAC Instr<br/><span>4</span></div>
            <div className="stat">Compile<br/><span>2ms</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
