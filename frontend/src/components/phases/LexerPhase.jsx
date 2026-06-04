import { useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import LexerDfa from '../visualizers/LexerDfa';

export default function LexerPhase({
  result, code, lexerTab, setLexerTab, lexerTrace, simStep, setSimStep,
  isPlaying, setIsPlaying, playbackSpeed, setPlaybackSpeed
}) {
  // Auto-play timer for scanner simulation
  useEffect(() => {
    if (!isPlaying || lexerTrace.length === 0) return;
    const timer = setInterval(() => {
      setSimStep(prev => {
        if (prev >= lexerTrace.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, lexerTrace.length, setSimStep, setIsPlaying]);

  return (
    <>
      {result.lexerErrors?.map((e, i) => <div key={i} className="error">{e}</div>)}

      <div className="visualizer-tabs">
        <button
          className={`visualizer-tab-btn ${lexerTab === 'table' ? 'active' : ''}`}
          onClick={() => { setLexerTab('table'); setIsPlaying(false); }}
        >
          Token Table
        </button>
        <button
          className={`visualizer-tab-btn ${lexerTab === 'sim' ? 'active' : ''}`}
          onClick={() => {
            setLexerTab('sim');
            setSimStep(0);
            setIsPlaying(false);
          }}
        >
          Scanner Simulation
        </button>
      </div>

      {lexerTab === 'table' ? (
        <table>
          <thead><tr><th>Type</th><th>Value</th><th>Line:Col</th></tr></thead>
          <tbody>
            {result.tokens?.map((t, i) => (
              <tr key={i}>
                <td className={t.type === 'KEYWORD' ? 'token-keyword' : t.type === 'IDENTIFIER' ? 'token-identifier' : t.type === 'NUMBER' ? 'token-number' : 'token-default'}>{t.type}</td>
                <td>{t.value}</td>
                <td>{t.line}:{t.column}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="lexer-sim-grid">
          <div>
            {/* Playback toolbar */}
            {(() => {
              const isFirst = simStep === 0;
              const isLast = simStep === lexerTrace.length - 1;
              return (
                <div className="playback-toolbar">
                  <button
                    className="playback-btn"
                    onClick={() => { setSimStep(0); setIsPlaying(false); }}
                    disabled={isFirst}
                    title="Reset"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    className="playback-btn"
                    onClick={() => { setSimStep(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
                    disabled={isFirst}
                    title="Step Backward"
                  >
                    <SkipBack size={14} />
                  </button>
                  <button
                    className="playback-btn"
                    onClick={() => setIsPlaying(!isPlaying)}
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                  </button>
                  <button
                    className="playback-btn"
                    onClick={() => { setSimStep(prev => Math.min(lexerTrace.length - 1, prev + 1)); setIsPlaying(false); }}
                    disabled={isLast}
                    title="Step Forward"
                  >
                    <SkipForward size={14} />
                  </button>

                  <div className="speed-slider-container">
                    <span>SPEED:</span>
                    <input
                      type="range"
                      min="150"
                      max="1200"
                      step="50"
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                      className="speed-slider"
                    />
                    <span>{playbackSpeed}ms</span>
                  </div>
                </div>
              );
            })()}

            {/* Code scrubber with character highlight */}
            {(() => {
              if (lexerTrace.length === 0 || simStep >= lexerTrace.length) {
                return <div className="code-scrubber-box">{code}</div>;
              }
              const step = lexerTrace[simStep];
              const idx = step.charIndex;
              const before = code.substring(0, idx);
              const cursor = code.substring(idx, idx + 1);
              const after = code.substring(idx + 1);
              return (
                <div className="code-scrubber-box">
                  {before}
                  {cursor ? (
                    <span className="char-highlight">{cursor === '\n' ? '↵\n' : cursor}</span>
                  ) : (
                    <span className="char-highlight">EOF</span>
                  )}
                  {after}
                </div>
              );
            })()}

            {/* Emitted tokens table */}
            {(() => {
              if (lexerTrace.length === 0 || simStep >= lexerTrace.length) return null;
              const step = lexerTrace[simStep];
              return (
                <div className="parser-input-buffer-table-container" style={{ marginTop: '0.75rem', maxHeight: '180px' }}>
                  <table className="parser-history-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                        <th style={{ width: '150px' }}>Token Type</th>
                        <th>Token Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step.emitted.map((tok, idx) => (
                        <tr key={idx} className="history-row">
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                            {idx + 1}
                          </td>
                          <td className={tok.type === 'KEYWORD' ? 'token-keyword' : tok.type === 'IDENTIFIER' ? 'token-identifier' : tok.type === 'NUMBER' ? 'token-number' : 'token-default'} style={{ fontWeight: '600' }}>
                            {tok.type}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                            {tok.value}
                          </td>
                        </tr>
                      ))}
                      {step.emitted.length === 0 && (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '1rem' }}>
                            No tokens emitted yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          <div>
            {/* DFA Visualizer */}
            {lexerTrace.length > 0 && simStep < lexerTrace.length && (
              <LexerDfa activeState={(!isPlaying && simStep === 0) ? null : lexerTrace[simStep].state} />
            )}

            {/* Scanner state variables */}
            {(() => {
              if (lexerTrace.length === 0 || simStep >= lexerTrace.length) return null;
              const step = lexerTrace[simStep];
              return (
                <div className="scanner-status-box">
                  <div className="status-row">
                    <span className="status-label">CURRENT CHAR:</span>
                    <span className="status-value">
                      {step.char === '\n' ? '\\n' : step.char === ' ' ? 'space' : step.char}
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">DFA STATE:</span>
                    <span className="status-value" style={{ color: step.state === 'DONE' ? 'rgb(13, 148, 136)' : 'var(--accent-primary)' }}>
                      {step.state}
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">BUFFER:</span>
                    <span className="status-value">
                      {step.buffer ? `"${step.buffer}"` : 'empty'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
