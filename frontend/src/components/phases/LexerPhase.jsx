import { useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import LexerDfa from '../visualizers/LexerDfa';

export default function LexerPhase({
  result, code, lexerTab, setLexerTab, lexerTrace, simStep, setSimStep,
  isPlaying, setIsPlaying, playbackSpeed, setPlaybackSpeed, onTokenClick, selectedToken
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

  // Scroll selected emitted token into view when selection changes
  useEffect(() => {
    if(!selectedToken) return;
    const table = document.querySelector('.parser-history-table');
    if(!table) return;
    const rows = table.querySelectorAll('tbody tr.history-row');
    for(const r of rows){
      if(r.dataset.line == selectedToken.line && r.dataset.col == selectedToken.column && r.dataset.val == selectedToken.value){
        try{ r.scrollIntoView({ behavior: 'smooth', block: 'center' }); }catch{ void 0; }
        break;
      }
    }
  }, [selectedToken]);

  // Highlight most recently emitted token row when simStep changes
  useEffect(() => {
    if(!lexerTrace || lexerTrace.length === 0) return;
    const step = lexerTrace[simStep];
    if(!step) return;
    const table = document.querySelector('.parser-history-table');
    if(!table) return;
    const rows = table.querySelectorAll('tbody tr.history-row');
    rows.forEach(r => r.classList.remove('recent'));
    if(step.emitted && step.emitted.length > 0){
      const last = step.emitted[step.emitted.length - 1];
      for(const r of rows){
        if(r.dataset.line == last.line && r.dataset.col == last.column && r.dataset.val == last.value){
          r.classList.add('recent');
          setTimeout(()=> r.classList.remove('recent'), 700);
          break;
        }
      }
    }
  }, [simStep, lexerTrace]);

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
          <thead><tr><th style={{width:'20%'}}>Type</th><th>Value</th><th style={{width:'20%'}}>Line:Col</th></tr></thead>
          <tbody>
            {result.tokens?.map((t, i) => (
              <tr key={i} onClick={() => onTokenClick && onTokenClick(t)} style={{cursor: 'pointer'}}>
                <td>
                  <span className={`token-chip chip-${t.type.toLowerCase()}`}>{t.type}</span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{t.value}</td>
                <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{t.line}:{t.column}</td>
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
                      {step.emitted.map((tok, idx) => {
                        const isSelected = selectedToken && selectedToken.line === tok.line && selectedToken.column === tok.column && selectedToken.value === tok.value;
                        return (
                          <tr key={idx} data-line={tok.line} data-col={tok.column} data-val={tok.value} className={"history-row" + (isSelected ? ' selected' : '')} onClick={() => onTokenClick && onTokenClick(tok)} style={{cursor: 'pointer'}}>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                              {idx + 1}
                            </td>
                            <td>
                              <span className={`token-chip chip-${tok.type.toLowerCase()}`}>{tok.type}</span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                              {tok.value}
                            </td>
                          </tr>
                        );
                      })}
                        
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
            {/* animate emitted tokens: scroll selected into view */}
            <div style={{height:8}} />
          </div>
        </div>
      )}
    </>
  );
}
