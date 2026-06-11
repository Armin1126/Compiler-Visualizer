import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Zap, ArrowRight, ChevronDown, ChevronUp, Trash2, Plus, Sparkles, Clipboard, Calculator } from 'lucide-react';
import DagVisualizer from '../visualizers/DagVisualizer';
import { diffOptimizerTraces } from '../../utils/tacUtils';

/* ────────────────────────────────────────────
   Helper: format a TAC instruction as a string
   ──────────────────────────────────────────── */
const formatTac = (t) => {
  if (!t) return '—';
  if (t.op === '=') return `${t.result} = ${t.arg1}`;
  return `${t.result} = ${t.arg1} ${t.op} ${t.arg2}`;
};

/* ────────────────────────────────────────────
   Helper: get optimization icon & color
   ──────────────────────────────────────────── */
const OPT_META = {
  'Constant Folding':          { icon: Zap, color: '#0d9488', bg: 'rgba(13,148,136,0.08)', label: 'CF' },
  'Algebraic Simplification':  { icon: Calculator, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'AS' },
  'Additive identity rule':    { icon: Plus, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: 'AI' },
  'Removed':                   { icon: Trash2, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'RM' },
  'Optimization':              { icon: Sparkles, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'OP' },
  'None':                      { icon: null,  color: 'var(--text-muted)', bg: 'transparent', label: '—' },
};

const getMeta = (type) => OPT_META[type] || OPT_META['None'];

export default function OptimizerPhase({ result, optimizerTab, setOptimizerTab }) {
  /* ── derived data ── */
  const originalCount = result.intermediateCode ? result.intermediateCode.length : 0;
  const optimizedCount = result.optimizedCode ? result.optimizedCode.length : 0;
  const reduction = originalCount > 0 ? Math.round(((originalCount - optimizedCount) / originalCount) * 100) : 0;
  const diffs = diffOptimizerTraces(result.intermediateCode, result.optimizedCode);
  const changedDiffs = diffs.filter(d => d.changed);
  const foldsCount = diffs.filter(d => d.type === 'Constant Folding').length;
  const simpsCount = diffs.filter(d => d.type.toLowerCase().includes('simplification') || d.type.toLowerCase().includes('identity')).length;

  /* ── step-by-step playback state ── */
  const [simStep, setSimStep] = useState(-1);          // -1 = show original, 0..N-1 = optimization steps
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200);
  const [showRules, setShowRules] = useState(true);
  const timerRef = useRef(null);
  const tableRef = useRef(null);

  const totalSteps = changedDiffs.length;

  /* Reset playback when result changes */
  useEffect(() => {
    setSimStep(-1);
    setIsPlaying(false);
  }, [result]);

  /* Auto-play timer */
  useEffect(() => {
    if (isPlaying && optimizerTab === 'walkthrough') {
      timerRef.current = setInterval(() => {
        setSimStep(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, playbackSpeed, totalSteps, optimizerTab]);

  /* Auto-scroll to current optimization */
  useEffect(() => {
    if (tableRef.current && simStep >= 0) {
      const activeRow = tableRef.current.querySelector('.opt-step-active');
      if (activeRow) activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [simStep]);

  const handlePlayPause = useCallback(() => {
    if (simStep >= totalSteps - 1 && !isPlaying) {
      setSimStep(-1);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }, [simStep, totalSteps, isPlaying]);

  const handleStepForward = () => {
    setIsPlaying(false);
    setSimStep(p => Math.min(p + 1, totalSteps - 1));
  };
  const handleStepBack = () => {
    setIsPlaying(false);
    setSimStep(p => Math.max(p - 1, -1));
  };
  const handleReset = () => {
    setIsPlaying(false);
    setSimStep(-1);
  };

  /* Which diff indices have been "applied" so far? */
  const appliedSet = new Set();
  if (simStep >= 0) {
    for (let i = 0; i <= simStep; i++) {
      const cd = changedDiffs[i];
      const idx = diffs.indexOf(cd);
      if (idx >= 0) appliedSet.add(idx);
    }
  }

  /* Current optimization being animated */
  const currentOpt = simStep >= 0 && simStep < totalSteps ? changedDiffs[simStep] : null;
  const currentOptIdx = currentOpt ? diffs.indexOf(currentOpt) : -1;

  /* Build the optimization rules summary */
  const rulesSummary = {};
  changedDiffs.forEach(d => {
    const key = d.type;
    if (!rulesSummary[key]) rulesSummary[key] = { count: 0, examples: [] };
    rulesSummary[key].count++;
    if (rulesSummary[key].examples.length < 2) {
      rulesSummary[key].examples.push({ before: formatTac(d.original), after: formatTac(d.optimized) });
    }
  });

  return (
    <>
      {/* ── Educational Banner ── */}
      <div className="phase-educational-banner">
        <h3>Phase 5: Intermediate Code Optimizer</h3>
        <p>
          This module analyzes the Three-Address Code and performs compiler optimizations to improve execution speed
          and reduce target machine footprint. Active optimizations include <strong>Constant Folding</strong> (pre-computing
          operations on literal numbers) and <strong>Algebraic Simplification</strong> (applying math identities like
          multiplying by 1 or adding 0).
        </p>
      </div>

      {/* ── Premium Stats Grid ── */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-value">{originalCount} → {optimizedCount}</div>
          <div className="stat-label">Instructions Count</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #0d9488' }}>
          <div className="stat-value" style={{ color: '#0d9488' }}>{reduction}%</div>
          <div className="stat-label">Instruction Savings</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
          <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>{foldsCount}</div>
          <div className="stat-label">Constants Folded</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #3b82f6' }}>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{simpsCount}</div>
          <div className="stat-label">Algebraic Rules</div>
        </div>
      </div>

      {/* ── Instruction Reduction Waterfall ── */}
      {originalCount > 0 && (
        <div className="opt-waterfall">
          <div className="opt-waterfall-label">Instruction Reduction</div>
          <div className="opt-waterfall-track">
            <div className="opt-waterfall-bar opt-waterfall-original" style={{ width: '100%' }}>
              <span>{originalCount} instrs</span>
            </div>
            <div
              className="opt-waterfall-bar opt-waterfall-optimized"
              style={{ width: `${Math.max(((optimizedCount / originalCount) * 100), 8)}%` }}
            >
              <span>{optimizedCount} instrs</span>
            </div>
          </div>
          {reduction > 0 && <div className="opt-waterfall-savings">↓ {reduction}% fewer instructions</div>}
        </div>
      )}

      {/* ── Tab Switcher ── */}
      <div className="visualizer-tabs">
        <button
          className={`visualizer-tab-btn ${optimizerTab === 'walkthrough' ? 'active' : ''}`}
          onClick={() => setOptimizerTab('walkthrough')}
        >
          <Zap size={13} style={{ marginRight: 4 }} /> Step-by-Step Optimizer
        </button>
        <button
          className={`visualizer-tab-btn ${optimizerTab === 'table' ? 'active' : ''}`}
          onClick={() => setOptimizerTab('table')}
        >
          Optimizer Comparison (Diff)
        </button>
        <button
          className={`visualizer-tab-btn ${optimizerTab === 'dag' ? 'active' : ''}`}
          onClick={() => setOptimizerTab('dag')}
        >
          Optimized DAG
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          TAB 1: STEP-BY-STEP OPTIMIZER WALKTHROUGH
          ═══════════════════════════════════════════ */}
      {optimizerTab === 'walkthrough' && (
        <div className="opt-sim-container">
          {/* Playback Controls */}
          <div className="opt-sim-controls">
            <div className="opt-sim-controls-left">
              <button className="sim-btn" onClick={handleReset} title="Reset"><RotateCcw size={14} /></button>
              <button className="sim-btn" onClick={handleStepBack} disabled={simStep <= -1} title="Step Back"><SkipBack size={14} /></button>
              <button className="sim-btn primary" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button className="sim-btn" onClick={handleStepForward} disabled={simStep >= totalSteps - 1} title="Step Forward"><SkipForward size={14} /></button>
            </div>

            <div className="opt-sim-controls-center">
              <span className="opt-step-counter">
                {simStep < 0 ? 'Original Code' : `Optimization ${simStep + 1} / ${totalSteps}`}
              </span>
            </div>

            <div className="opt-sim-controls-right">
              <label className="speed-label">Speed</label>
              <input
                type="range"
                min={300} max={2500} step={100}
                value={2800 - playbackSpeed}
                onChange={(e) => setPlaybackSpeed(2800 - Number(e.target.value))}
                className="speed-slider"
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="opt-progress-track">
            <div
              className="opt-progress-fill"
              style={{ width: `${totalSteps > 0 ? ((simStep + 1) / totalSteps) * 100 : 0}%` }}
            />
            {changedDiffs.map((_, i) => (
              <div
                key={i}
                className={`opt-progress-dot ${i <= simStep ? 'done' : ''} ${i === simStep ? 'active' : ''}`}
                style={{ left: `${((i + 0.5) / totalSteps) * 100}%` }}
                onClick={() => { setIsPlaying(false); setSimStep(i); }}
                title={`Optimization ${i + 1}`}
              />
            ))}
          </div>

          {/* Current Optimization Explanation Banner */}
          {currentOpt && (
            <div className="opt-current-banner" key={simStep}>
              <div className="opt-current-icon" style={{ color: getMeta(currentOpt.type).color, display: 'flex', alignItems: 'center' }}>
                {(() => {
                  const Icon = getMeta(currentOpt.type).icon;
                  return Icon ? <Icon size={18} /> : null;
                })()}
              </div>
              <div className="opt-current-info">
                <div className="opt-current-type" style={{ color: getMeta(currentOpt.type).color }}>
                  {currentOpt.type}
                </div>
                <div className="opt-current-explanation">{currentOpt.explanation}</div>
              </div>
              <div className="opt-current-transform">
                <code className="opt-before">{formatTac(currentOpt.original)}</code>
                <ArrowRight size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <code className="opt-after">{formatTac(currentOpt.optimized)}</code>
              </div>
            </div>
          )}
          {simStep === -1 && (
            <div className="opt-current-banner opt-current-banner-idle">
              <div className="opt-current-icon" style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
                <Clipboard size={18} />
              </div>
              <div className="opt-current-info">
                <div className="opt-current-type">Original Three-Address Code</div>
                <div className="opt-current-explanation">
                  Press <strong>Play</strong> or <strong>Step Forward</strong> to watch each optimization being applied to the TAC instructions one by one.
                  {totalSteps > 0
                    ? ` There are ${totalSteps} optimization(s) to apply.`
                    : ' No optimizations were applicable to this code.'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Animated Instruction Table */}
          <div className="opt-sim-table-container" ref={tableRef}>
            <table className="opt-sim-table">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>#</th>
                  <th style={{ width: 220 }}>Instruction</th>
                  <th style={{ width: 90, textAlign: 'center' }}>Status</th>
                  <th>Applied Rule</th>
                </tr>
              </thead>
              <tbody>
                {diffs.map((diff, i) => {
                  const isApplied = appliedSet.has(i);
                  const isCurrent = i === currentOptIdx;
                  const meta = getMeta(diff.type);

                  return (
                    <tr
                      key={i}
                      className={[
                        'opt-sim-row',
                        isCurrent ? 'opt-step-active' : '',
                        isApplied && !isCurrent ? 'opt-step-applied' : '',
                        !diff.changed ? 'opt-step-unchanged' : '',
                      ].join(' ')}
                    >
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        {i + 1}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {/* Show original if not applied yet, otherwise show optimized */}
                        {isApplied ? (
                          <div className="opt-transform-cell">
                            <span className="opt-original-strike">{formatTac(diff.original)}</span>
                            <span className="opt-optimized-value" style={{ color: meta.color }}>
                              {formatTac(diff.optimized)}
                            </span>
                          </div>
                        ) : (
                          <span>{formatTac(diff.original)}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isApplied ? (
                          <span className="opt-status-badge opt-status-optimized">Optimized</span>
                        ) : diff.changed ? (
                          <span className="opt-status-badge opt-status-pending">Pending</span>
                        ) : (
                          <span className="opt-status-badge opt-status-kept">Kept</span>
                        )}
                      </td>
                      <td>
                        {isApplied && diff.changed ? (
                          <span className="opt-rule-badge" style={{ background: meta.bg, color: meta.color, borderColor: meta.color }}>
                            {(() => {
                              const Icon = meta.icon;
                              return Icon ? <Icon size={11} style={{ marginRight: 3 }} /> : null;
                            })()}
                            {diff.type}
                          </span>
                        ) : diff.changed ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                            Waiting…
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {diffs.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No intermediate code to optimize
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Optimization Rules Breakdown (collapsible) */}
          {Object.keys(rulesSummary).length > 0 && (
            <div className="opt-rules-panel">
              <div className="opt-rules-header" onClick={() => setShowRules(r => !r)}>
                <span>Optimization Rules Applied</span>
                {showRules ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {showRules && (
                <div className="opt-rules-body">
                  {Object.entries(rulesSummary).map(([type, info]) => {
                    const meta = getMeta(type);
                    return (
                      <div key={type} className="opt-rule-card">
                        <div className="opt-rule-card-header" style={{ borderLeftColor: meta.color }}>
                          <span className="opt-rule-icon" style={{ display: 'flex', alignItems: 'center' }}>
                            {(() => {
                              const Icon = meta.icon;
                              return Icon ? <Icon size={14} /> : null;
                            })()}
                          </span>
                          <span className="opt-rule-name">{type}</span>
                          <span className="opt-rule-count" style={{ color: meta.color }}>{info.count}×</span>
                        </div>
                        <div className="opt-rule-examples">
                          {info.examples.map((ex, j) => (
                            <div key={j} className="opt-rule-example">
                              <code>{ex.before}</code>
                              <ArrowRight size={11} style={{ color: meta.color, flexShrink: 0 }} />
                              <code style={{ color: meta.color }}>{ex.after}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
          TAB 2: FULL DIFF TABLE (original view)
          ═══════════════════════════════════════ */}
      {optimizerTab === 'table' && (
        <div className="parser-input-buffer-table-container">
          <table className="parser-history-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Step</th>
                <th style={{ width: '220px' }}>Original Code (TAC)</th>
                <th style={{ width: '220px' }}>Optimized Code (TAC)</th>
                <th style={{ width: '180px' }}>Optimization Type</th>
                <th>Mathematical Explanation</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((diff, i) => {
                const orig = diff.original;
                const opt = diff.optimized;

                let badgeClass = 'badge-yellow';
                if (diff.type === 'Constant Folding') badgeClass = 'badge-green';
                if (diff.type.toLowerCase().includes('simplification') || diff.type.toLowerCase().includes('identity')) badgeClass = 'badge-green';
                if (diff.type === 'Removed') badgeClass = 'badge-red';

                return (
                  <tr key={i} className={`history-row ${diff.changed ? 'row-optimized-highlight' : ''}`}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                      ({i + 1})
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      <span>{orig.result}</span>
                      <span style={{ margin: '0 0.4rem' }}>=</span>
                      {orig.op === '=' ? (
                        <span>{orig.arg1}</span>
                      ) : (
                        <>
                          <span>{orig.arg1}</span>
                          <span style={{ margin: '0 0.3rem' }}>{orig.op}</span>
                          <span>{orig.arg2}</span>
                        </>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                      {opt ? (
                        <>
                          <span className={diff.changed ? 'tac-result' : ''}>{opt.result}</span>
                          <span style={{ margin: '0 0.4rem', color: 'var(--text-muted)' }}>=</span>
                          {opt.op === '=' ? (
                            <span className={diff.changed ? 'tac-arg' : ''}>{opt.arg1}</span>
                          ) : (
                            <>
                              <span className={diff.changed ? 'tac-arg' : ''}>{opt.arg1}</span>
                              <span className={diff.changed ? 'tac-op' : ''} style={{ margin: '0 0.3rem' }}>{opt.op}</span>
                              <span className={diff.changed ? 'tac-arg' : ''}>{opt.arg2}</span>
                            </>
                          )}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>ELIMINATED</span>
                      )}
                    </td>
                    <td>
                      {diff.type !== 'None' ? (
                        <span className={`symbol-badge ${badgeClass}`} style={{ fontSize: '0.6rem' }}>
                          {diff.type}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: diff.changed ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {diff.explanation}
                    </td>
                  </tr>
                );
              })}
              {diffs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                    No instructions to optimize
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════
          TAB 3: DAG VISUALIZER
          ═══════════════════════════════════ */}
      {optimizerTab === 'dag' && result.optimizedCode && <DagVisualizer tac={result.optimizedCode} />}
    </>
  );
}
