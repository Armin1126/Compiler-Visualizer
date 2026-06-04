import { useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, ChevronRight, Check } from 'lucide-react';
import TreeVisualizer from '../visualizers/TreeVisualizer';
import DagVisualizer from '../visualizers/DagVisualizer';
import { getAstNodeExplanation } from '../../utils/astUtils';

export default function ParserPhase({
  result, parserTab, setParserTab, parserMethod, setParserMethod,
  parserViewMode, setParserViewMode, parserSimStep, setParserSimStep,
  isParserPlaying, setIsParserPlaying, parserPlaybackSpeed, setParserPlaybackSpeed,
  parserTrace, srTrace
}) {
  // Auto-play timer for parser simulation
  useEffect(() => {
    if (!isParserPlaying) return;
    const activeTrace = parserMethod === 'll1' ? parserTrace : srTrace;
    if (activeTrace.length === 0) return;
    const timer = setInterval(() => {
      setParserSimStep(prev => {
        if (prev >= activeTrace.length - 1) {
          setIsParserPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, parserPlaybackSpeed);
    return () => clearInterval(timer);
  }, [isParserPlaying, parserPlaybackSpeed, parserMethod, parserTrace, srTrace, setParserSimStep, setIsParserPlaying]);

  const renderAst = (node, key = 'root') => {
    if (!node) return null;
    return (
      <div key={key} className="ast-node">
        <div className="ast-node-header">
          <strong>{node.type}</strong> {node.value && <span>({node.value})</span>}
        </div>
        <p className="ast-explanation">{getAstNodeExplanation(node)}</p>
        {node.left && renderAst(node.left, key + '-left')}
        {node.right && renderAst(node.right, key + '-right')}
        {node.body && node.body.map((child, i) => renderAst(child, key + '-child-' + i))}
      </div>
    );
  };

  return (
    <>
            {result.parserErrors?.map((e, i) => <div key={i} className="error">{e}</div>)}
            <div className="visualizer-tabs">
              <button 
                className={`visualizer-tab-btn ${parserTab === 'text' ? 'active' : ''}`}
                onClick={() => { setParserTab('text'); setIsParserPlaying(false); }}
              >
                Text AST
              </button>
              <button 
                className={`visualizer-tab-btn ${parserTab === 'tree' ? 'active' : ''}`}
                onClick={() => { setParserTab('tree'); setIsParserPlaying(false); }}
              >
                AST Graph
              </button>
              <button 
                className={`visualizer-tab-btn ${parserTab === 'dag' ? 'active' : ''}`}
                onClick={() => { setParserTab('dag'); setIsParserPlaying(false); }}
              >
                Expression DAG
              </button>
              <button 
                className={`visualizer-tab-btn ${parserTab === 'sim' ? 'active' : ''}`}
                onClick={() => {
                  setParserTab('sim');
                  setParserSimStep(0);
                  setParserViewMode('playback');
                  setIsParserPlaying(false);
                }}
              >
                Parsing Simulation
              </button>
            </div>
            {parserTab === 'text' && result.ast && (
              <>
                <div className="phase-educational-banner">
                  <h3>Abstract Syntax Tree (Textual Representation)</h3>
                  <p>
                    An <strong>Abstract Syntax Tree (AST)</strong> is a hierarchical tree representation of the abstract syntactic structure of source code. 
                    This textual (indented) view demonstrates how program components (such as declarations, assignment statements, and nested expressions) 
                    are grouped as parent-child nodes according to the language's Context-Free Grammar.
                  </p>
                </div>
                {renderAst(result.ast)}
              </>
            )}
            {parserTab === 'tree' && result.ast && (
              <>
                <div className="phase-educational-banner">
                  <h3>Abstract Syntax Tree (Graphical Representation)</h3>
                  <p>
                    This graph visualizes the program's structural hierarchy. The compiler processes code from the top (<strong>Program Root</strong>) 
                    downward. Statements (like <code>let =</code>) act as branch nodes, arithmetic operators (like <code>+</code>, <code>*</code>) act as sub-trees, 
                    and literal values or variables form the <strong>leaf nodes</strong>. 
                    Parentheses influence the evaluation order, creating deeper sub-tree nests (such as nested expression structures) to enforce correct mathematical operator precedence.
                  </p>
                </div>
                <TreeVisualizer ast={result.ast} />
              </>
            )}
            {parserTab === 'dag' && result.ast && (
              <>
                <div className="phase-educational-banner">
                  <h3>Directed Acyclic Graph (Expression DAG)</h3>
                  <p>
                    A <strong>Directed Acyclic Graph (DAG)</strong> represents expressions by sharing nodes for common sub-expressions. 
                    Unlike a standard AST, which duplicates identical values or variables as separate nodes, a DAG collapses duplicate leaves and sub-trees 
                    to point to a single shared reference. This structure is a primary foundation for compiler optimizations, such as <strong>Common Subexpression Elimination (CSE)</strong>.
                  </p>
                </div>
                <DagVisualizer ast={result.ast} />
              </>
            )}
            {parserTab === 'sim' && (
              <>
                {/* Parser Method Toggle */}
                <div className="parser-method-selector">
                  <button 
                    className={`parser-method-btn ${parserMethod === 'll1' ? 'active' : ''}`}
                    onClick={() => { setParserMethod('ll1'); setParserSimStep(0); setIsParserPlaying(false); }}
                  >
                    LL(1) Predictive Parser (Top-Down)
                  </button>
                  <button 
                    className={`parser-method-btn ${parserMethod === 'sr' ? 'active' : ''}`}
                    onClick={() => { setParserMethod('sr'); setParserSimStep(0); setIsParserPlaying(false); }}
                  >
                    Shift-Reduce Parser (Bottom-Up)
                  </button>
                </div>

                {/* Parser View Mode Toggle (Playback vs Table) */}
                <div className="parser-method-selector" style={{ marginTop: '0.5rem' }}>
                  <button 
                    className={`parser-method-btn ${parserViewMode === 'playback' ? 'active' : ''}`}
                    onClick={() => { setParserViewMode('playback'); }}
                    style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
                  >
                    Interactive Playback
                  </button>
                  <button 
                    className={`parser-method-btn ${parserViewMode === 'table' ? 'active' : ''}`}
                    onClick={() => { setParserViewMode('table'); setIsParserPlaying(false); }}
                    style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
                  >
                    Full Derivation Table
                  </button>
                </div>

                <div className="parser-sim-header-banner">
                  {parserMethod === 'll1' ? (
                    <>
                      <h3>LL(1) Top-Down Predictive Parser (Leftmost Derivation)</h3>
                      <p>
                        This simulator demonstrates how the parser constructs a program's syntax step-by-step. 
                        It starts with the start symbol <strong>Program</strong> and uses grammar production rules to expand non-terminals, 
                        matching terminals against the <strong>INPUT BUFFER</strong> to construct the leftmost derivation string.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3>Shift-Reduce Bottom-Up Parser (Rightmost Derivation in Reverse)</h3>
                      <p>
                        This simulator demonstrates how the parser builds the AST from the bottom up. 
                        It shifts incoming tokens onto the <strong>STACK</strong> and reduces matching handles (suffix of stack) to non-terminals 
                        until it reduces the entire program back to the start symbol <strong>Program</strong>.
                      </p>
                    </>
                  )}
                </div>

                {parserViewMode === 'playback' ? (
                  <div className="parser-sim-grid">
                  {/* Left Column: Stack */}
                  <div className="parser-stack-column">
                    <div className="parser-stack-title">
                      <span>STACK</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Top is Orange</span>
                    </div>
                    <div className="parser-stack-container">
                      {(() => {
                        const activeTrace = parserMethod === 'll1' ? parserTrace : srTrace;
                        const stackToRender = parserMethod === 'll1'
                          ? (activeTrace[parserSimStep]?.stack || [])
                          : [...(activeTrace[parserSimStep]?.stack || [])].reverse();

                        return (
                          <>
                            {activeTrace.length > 0 && parserSimStep < activeTrace.length && (
                              stackToRender.map((symbol, i) => {
                                const isTop = i === 0;
                                return (
                                  <div key={i} className={`stack-item ${isTop ? 'top-of-stack' : ''}`}>
                                    {symbol}
                                  </div>
                                );
                              })
                            )}
                            {(!activeTrace || activeTrace.length === 0 || (activeTrace[parserSimStep] && activeTrace[parserSimStep].stack.length === 0)) && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', margin: 'auto' }}>
                                Empty Stack
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                </div>

                {/* Right Column: Active Action & Token Input Buffer */}
                <div className="parser-content-column">
                  {/* Playback controls toolbar */}
                  {(() => {
                    const activeTrace = parserMethod === 'll1' ? parserTrace : srTrace;
                    const isFirst = parserSimStep === 0;
                    const isLast = activeTrace.length === 0 || parserSimStep === activeTrace.length - 1;
                    return (
                      <div className="playback-toolbar">
                        <button 
                          className="playback-btn" 
                          onClick={() => { setParserSimStep(0); setIsParserPlaying(false); }}
                          disabled={isFirst}
                          title="Reset"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button 
                          className="playback-btn" 
                          onClick={() => { setParserSimStep(prev => Math.max(0, prev - 1)); setIsParserPlaying(false); }}
                          disabled={isFirst}
                          title="Step Backward"
                        >
                          <SkipBack size={14} />
                        </button>
                        <button 
                          className="playback-btn" 
                          onClick={() => setIsParserPlaying(!isParserPlaying)}
                          title={isParserPlaying ? 'Pause' : 'Play'}
                        >
                          {isParserPlaying ? <Pause size={14} /> : <Play size={14} />}
                          <span>{isParserPlaying ? 'PAUSE' : 'PLAY'}</span>
                        </button>
                        <button 
                          className="playback-btn" 
                          onClick={() => { setParserSimStep(prev => Math.min(activeTrace.length - 1, prev + 1)); setIsParserPlaying(false); }}
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
                            max="2500" 
                            step="50"
                            value={parserPlaybackSpeed}
                            onChange={(e) => setParserPlaybackSpeed(parseInt(e.target.value))}
                            className="speed-slider"
                          />
                          <span>{parserPlaybackSpeed}ms</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Active Grammar Rule / Parser Action Card */}
                  <div className="parser-sim-card">
                    <div className="parser-sim-card-title">PARSER DERIVATION ACTION</div>
                    <div className="grammar-action-display">
                      {(() => {
                        const activeTrace = parserMethod === 'll1' ? parserTrace : srTrace;
                        return activeTrace.length > 0 && parserSimStep < activeTrace.length ? (
                          <>
                            <span className="grammar-action-title">Action taken:</span>
                            <span className="grammar-action-rule">
                              {activeTrace[parserSimStep].action}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Simulation ready. Click Play.</span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Step-by-Step Sentential Form / Derivation String */}
                  <div className="parser-sim-card">
                    <div className="parser-sim-card-title">
                      {parserMethod === 'll1' ? 'STEP-BY-STEP SENTENTIAL FORM (LEFTMOST DERIVATION)' : 'PARSER CONFIGURATION (STACK | INPUT)'}
                    </div>
                    <div className="grammar-action-display" style={{ minHeight: '80px', background: 'rgba(92, 73, 58, 0.03)' }}>
                      {(() => {
                        const activeTrace = parserMethod === 'll1' ? parserTrace : srTrace;
                        if (activeTrace.length === 0 || parserSimStep >= activeTrace.length) {
                          return <span style={{ color: 'var(--text-muted)' }}>Simulation ready.</span>;
                        }

                        const step = activeTrace[parserSimStep];
                        if (parserMethod === 'll1') {
                          const matchedSlice = result.tokens.slice(0, step.tokenIndex).map(t => t.value);
                          const stackSymbols = step.stack.filter(s => s !== '$');
                          const hasMatched = matchedSlice.length > 0;
                          const hasStack = stackSymbols.length > 0;

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <span className="grammar-action-title">Sentential Form string:</span>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: '1.4', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                <strong style={{ color: 'var(--text-muted)' }}>Program</strong>
                                <span style={{ margin: '0 0.5rem', color: 'var(--accent-primary)' }}>⇒</span>
                                
                                {hasMatched && (
                                  <span style={{ color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '2px 4px', borderRadius: '3px', marginRight: '4px' }}>
                                    {matchedSlice.join(" ")}
                                  </span>
                                )}
                                
                                {hasStack ? (
                                  <>
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', background: 'var(--accent-primary-light)', padding: '2px 6px', borderRadius: '3px', border: '1px solid var(--accent-primary)' }}>
                                      {stackSymbols[0]}
                                    </span>
                                    {stackSymbols.slice(1).length > 0 && (
                                      <span style={{ color: 'var(--text-main)', marginLeft: '6px' }}>
                                        {stackSymbols.slice(1).join(" ")}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>ε (empty stack)</span>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          const stackSymbols = step.stack;
                          const remainingTokens = result.tokens.slice(step.tokenIndex).map(t => t.value);
                          
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <span className="grammar-action-title">Configuration: (Stack | Input Buffer)</span>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: '1.4', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                {stackSymbols.length > 0 ? (
                                  <span style={{ color: 'var(--text-main)', background: 'var(--panel-header-bg)', padding: '2px 6px', borderRadius: '3px', border: '1px solid var(--border-color)', marginRight: '4px' }}>
                                    {stackSymbols.join(" ")}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginRight: '4px' }}>[empty stack]</span>
                                )}
                                
                                <span style={{ margin: '0 0.5rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>|</span>
                                
                                {remainingTokens.length > 0 ? (
                                  <span style={{ color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '2px 4px', borderRadius: '3px' }}>
                                    {remainingTokens.join(" ")}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>$ (EOF)</span>
                                )}
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  {/* Input Buffer of Tokens */}
                  <div className="parser-sim-card">
                    <div className="parser-sim-card-title">REMAINING TOKENS INPUT BUFFER</div>
                    <div className="parser-input-buffer-table-container">
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>Status</th>
                            <th>Token Type</th>
                            <th>Token Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.tokens?.map((t, idx) => {
                            const activeTrace = parserMethod === 'll1' ? parserTrace : srTrace;
                            const currentIdx = activeTrace.length > 0 && parserSimStep < activeTrace.length ? activeTrace[parserSimStep].tokenIndex : 0;
                            const isParsed = idx < currentIdx;
                            const isCurrent = idx === currentIdx;
                            
                            let rowClass = '';
                            if (isParsed) rowClass = 'parsed-row';
                            if (isCurrent) rowClass = 'current-row';

                            return (
                              <tr key={idx} id={`parser-token-row-${idx}`} className={rowClass}>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                  {isParsed && <Check size={14} color="var(--accent-primary)" />}
                                  {isCurrent && <ChevronRight size={14} color="var(--accent-primary)" />}
                                </td>
                                <td style={{ fontStyle: isParsed ? 'italic' : 'normal' }}>{t.type}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{t.value}</td>
                              </tr>
                            );
                          })}
                          {(!result.tokens || result.tokens.length === 0) && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                No tokens to parse
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="parser-history-table-container">
                <table className="parser-history-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Step</th>
                      <th style={{ width: '35%' }}>Stack</th>
                      <th style={{ width: '35%' }}>Input Buffer</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const activeTrace = parserMethod === 'll1' ? parserTrace : srTrace;
                      return activeTrace.map((step, idx) => {
                        const remainingTokens = result.tokens.slice(step.tokenIndex).map(t => t.value);
                        
                        const stackStr = step.stack.join(" ");

                        let inputStr = remainingTokens.join(" ");
                        if (!inputStr) inputStr = "$"; // EOF marker

                        const isCurrentStep = idx === parserSimStep;

                        return (
                          <tr 
                            key={idx} 
                            onClick={() => {
                              setParserSimStep(idx);
                              setParserViewMode('playback');
                            }}
                            className={`history-row ${isCurrentStep ? 'active-history-row' : ''}`}
                            title="Click to jump to this simulation step"
                          >
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{stackStr}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#0d9488' }}>{inputStr}</td>
                            <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{step.action}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </>
            )}
    </>
  );
}
