import { useEffect, useRef } from 'react';
import { Terminal, Play } from 'lucide-react';
import { FEATURES, MOCK_DIAGNOSTICS } from '../../utils/constants';

export default function LandingPage({ view, setView, terminalLogs, setTerminalLogs, setCode }) {
  const terminalBodyRef = useRef(null);

  // Boot terminal animation on landing page
  useEffect(() => {
    if (view !== 'landing') return;
    let index = 0;
    const interval = setInterval(() => {
      if (index < MOCK_DIAGNOSTICS.length) {
        const currentLog = MOCK_DIAGNOSTICS[index];
        setTerminalLogs(prev => prev.length === 0 ? [currentLog] : [...prev, currentLog]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 280);
    return () => clearInterval(interval);
  }, [view, setTerminalLogs]);

  // Smooth scroll terminal body when logs change
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTo({
        top: terminalBodyRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [terminalLogs]);

  return (
        <div className="landing-container">
          {/* Nav Header */}
          <header className="landing-nav">
              <div className="nav-logo">
                <img src="/favicon.png" alt="compiler visualizer" className="nav-logo-img" />
                <span>compiler visualizer</span>
              </div>
            
          </header>

          {/* Hero Section */}
          <main className="hero-section">
            <div className="hero-info">
              <div className="cyber-tag">[ INTERACTIVE PIPELINE EMULATOR v1.0 ]</div>
              <h1 className="hero-title">
                Simulate code compiling in <span>Real-Time</span>
              </h1>
              <p className="hero-description">
                Deconstruct compilation pipelines into visual steps. Witness how standard variables and arithmetic instructions compile to Lexical Tokens, abstract parse trees (AST), intermediate representation codes (TAC), optimized sequences, and pure target assembly.
              </p>
              <button className="cyber-btn" onClick={() => setView('console')}>
                LAUNCH TERMINAL CONSOLE <Play size={18} fill="currentColor" />
              </button>

              <div className="tinylang-quickstart">
                <h4>TinyLang Quickstart</h4>
                <p className="quick-desc">TinyLang is a compact teaching language used by this visualizer. Use <strong>let</strong> to declare variables and simple arithmetic expressions. Every statement must end with <strong>;</strong>. Variable names may contain letters, digits and underscores and cannot start with a digit.</p>
                <ul className="quick-list">
                  <li><strong>Declaration:</strong> let x = 10;</li>
                  <li><strong>Assignment:</strong> let y = x + 5;</li>
                  <li><strong>Operators:</strong> + - * / %</li>
                  <li><strong>Notes:</strong> No block scopes; this demo treats variables as global. Comments are not supported.</li>
                </ul>
                <pre className="tinylang-example">{`let a = 10;
let b = 20;
let result = a * 2 + b;`}</pre>
                <div style={{ marginTop: '0.6rem' }}>
                  <button
                    className="btn"
                    onClick={() => {
                      const example = `let a = 10;\nlet b = 20;\nlet result = a * 2 + b;`;
                      if (typeof setCode === 'function') setCode(example);
                      setView('console');
                    }}
                  >Try this example</button>
                </div>
              </div>
            </div>

            {/* Interactive Mock Terminal */}
            <div className="console-mock">
              <div className="console-mock-header">
                <div className="console-mock-title">SYSTEM DIAGNOSTICS (TTY1)</div>
              </div>
              <div className="console-mock-body" ref={terminalBodyRef}>
                {terminalLogs.map((log, i) => (
                  <div key={i} className={`console-line ${log.type}`}>
                    {log.text}
                  </div>
                ))}
                {/* Blinking cursor line */}
                <div className="console-line" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="terminal-cursor"></span>
                </div>
              </div>
            </div>
          </main>

          {/* Core Feature Matrix */}
          <section className="features-container">
            <h2 className="features-title">COMPILER ENGINE CORE PHASES</h2>
            <div className="features-grid">
              {FEATURES.map((feat, i) => {
                const IconComponent = feat.icon;
                return (
                  <div className="cyber-card" key={i}>
                    <div className="card-tag">{feat.tag}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ color: 'var(--accent-primary)', display: 'flex' }}><IconComponent size={20} /></span>
                      <h3 className="card-title">{feat.title}</h3>
                    </div>
                    <p className="card-desc">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Cyber Footer */}
          <footer className="landing-footer">
            <span className="footer-left">// PIPELINE EMULATION STATUS: ACTIVE</span>
            <span className="footer-right">
              <a href="https://github.com/Armin1126" target="_blank" rel="noreferrer">GitHub</a>
              <span className="footer-links"> • <a href="#" onClick={(e) => { e.preventDefault(); setView('console'); }}>Quickstart</a> • <a href="https://github.com/Armin1126/Compiler-Visualizer/issues/new" target="_blank" rel="noopener noreferrer">Report Issue</a></span>
            </span>
          </footer>
        </div>
  );
}

