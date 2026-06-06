import { useState, useEffect, useRef } from 'react';
import { Terminal, Play } from 'lucide-react';
import CompilerMiniDashboard from '../../components/visualizers/CompilerMiniDashboard';
import { FEATURES, MOCK_DIAGNOSTICS } from '../../utils/constants';

const SAMPLES = [
  {
    name: 'Arithmetic',
    code: `let a = 10;\nlet b = 20;\nlet result = a * 2 + b;\n`
  },
  {
    name: 'Precedence',
    code: `let x = 5;\nlet y = 10;\nlet z = (x + y) * (y - x) % 7;\n`
  },
  {
    name: 'Chained',
    code: `let base = 100;\nlet factor = 5;\nlet step = base / factor;\nlet finalVal = step + 20;\n`
  },
  {
    name: 'Circle Area',
    code: `let pi = 3;\nlet r = 10;\nlet area = pi * r * r;\n`
  }
];

export default function LandingPage({ view, setView, terminalLogs, setTerminalLogs, setCode }) {
  const terminalBodyRef = useRef(null);
  const [sampleIdx, setSampleIdx] = useState(0);

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
            </div>

            {/* Interactive Compiler Mini Dashboard */}
            <CompilerMiniDashboard active="Semantic" />
          </main>

          {/* TinyLang Quickstart moved below hero */}
          <section className="tinylang-quickstart-section">
            <div className="tinylang-quickstart">
              <h4>TinyLang Quickstart</h4>
              <p className="quick-desc">TinyLang is a compact teaching language used by this visualizer. Use <strong>let</strong> to declare variables and simple arithmetic expressions. Every statement must end with <strong>;</strong>. Variable names may contain letters, digits and underscores and cannot start with a digit.</p>
              <ul className="quick-list">
                <li><strong>Declaration:</strong> let x = 10;</li>
                <li><strong>Assignment:</strong> let y = x + 5;</li>
                <li><strong>Operators:</strong> + - * / %</li>
                <li><strong>Notes:</strong> No block scopes; this demo treats variables as global. Comments are not supported.</li>
              </ul>
              
              <div className="example-selector-container" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  {SAMPLES.map((s, idx) => (
                    <button
                      key={s.name}
                      className={`btn ${sampleIdx === idx ? '' : 'secondary'}`}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.4rem 0.8rem',
                        opacity: sampleIdx === idx ? 1 : 0.65,
                        background: sampleIdx === idx ? 'var(--accent-primary-light)' : 'transparent',
                        borderColor: sampleIdx === idx ? 'var(--accent-primary)' : 'var(--border-color)',
                        color: sampleIdx === idx ? 'var(--accent-primary)' : 'var(--text-muted)'
                      }}
                      onClick={() => setSampleIdx(idx)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <pre className="tinylang-example">{SAMPLES[sampleIdx].code}</pre>
                <div style={{ marginTop: '0.6rem' }}>
                  <button
                    className="btn"
                    onClick={() => {
                      if (typeof setCode === 'function') setCode(SAMPLES[sampleIdx].code);
                      setView('console');
                    }}
                  >
                    Load in Console & Run
                  </button>
                </div>
              </div>
            </div>
          </section>

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

