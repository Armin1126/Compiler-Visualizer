import DagVisualizer from '../visualizers/DagVisualizer';
import { diffOptimizerTraces } from '../../utils/tacUtils';

export default function OptimizerPhase({ result, optimizerTab, setOptimizerTab }) {
        const originalCount = result.intermediateCode ? result.intermediateCode.length : 0;
        const optimizedCount = result.optimizedCode ? result.optimizedCode.length : 0;
        const reduction = originalCount > 0 ? Math.round(((originalCount - optimizedCount) / originalCount) * 100) : 0;
        const diffs = diffOptimizerTraces(result.intermediateCode, result.optimizedCode);
        const foldsCount = diffs.filter(d => d.type === 'Constant Folding').length;
        const simpsCount = diffs.filter(d => d.type.toLowerCase().includes('simplification') || d.type.toLowerCase().includes('identity')).length;

        return (
          <>
            <div className="phase-educational-banner">
              <h3>Phase 5: Intermediate Code Optimizer</h3>
              <p>
                This module analyzes the Three-Address Code and performs compiler optimizations to improve execution speed and reduce target machine footprint. Active optimizations include <strong>Constant Folding</strong> (pre-computing operations on literal numbers) and <strong>Algebraic Simplification</strong> (applying math identities like multiplying by 1 or adding 0).
              </p>
            </div>

            {/* Premium Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
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

            <div className="visualizer-tabs">
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
                          {/* Original TAC */}
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
                          {/* Optimized TAC */}
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
                          {/* Optimization Badge */}
                          <td>
                            {diff.type !== 'None' ? (
                              <span className={`symbol-badge ${badgeClass}`} style={{ fontSize: '0.6rem' }}>
                                {diff.type}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>
                            )}
                          </td>
                          {/* Explanation */}
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
            {optimizerTab === 'dag' && result.optimizedCode && <DagVisualizer tac={result.optimizedCode} />}
          </>
        );
}
