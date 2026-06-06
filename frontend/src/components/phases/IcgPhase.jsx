import DagVisualizer from '../visualizers/DagVisualizer';
import { getTacExplanation, mapTacToSourceLines } from '../../utils/tacUtils';

export default function IcgPhase({ result, icgTab, setIcgTab, onSelectLine }) {
  const mappedCode = mapTacToSourceLines(result.ast, result.intermediateCode);

  return (
    <>
            <div className="phase-educational-banner">
              <h3>Phase 4: Intermediate Code Generation (Three-Address Code)</h3>
              <p>
                In this phase, the compiler translates the hierarchical AST structure into a linearized, flattened representation called <strong>Three-Address Code (TAC)</strong>. Each instruction has at most one operator and at most three operands, mimicking assembly instructions to simplify target code emission.
              </p>
            </div>

            <div className="visualizer-tabs">
              <button 
                className={`visualizer-tab-btn ${icgTab === 'table' ? 'active' : ''}`}
                onClick={() => setIcgTab('table')}
              >
                TAC Walkthrough Table
              </button>
              <button 
                className={`visualizer-tab-btn ${icgTab === 'dag' ? 'active' : ''}`}
                onClick={() => setIcgTab('dag')}
              >
                Expression DAG
              </button>
            </div>

            {icgTab === 'table' && (
              <div className="parser-input-buffer-table-container">
                <table className="parser-history-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Step</th>
                      <th style={{ width: '250px' }}>Three-Address Code (TAC)</th>
                      <th>English Code Explanation Walkthrough</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedCode?.map((tac, i) => (
                      <tr 
                        key={i} 
                        className="history-row"
                        onMouseEnter={() => onSelectLine && onSelectLine(tac.line)}
                        onMouseLeave={() => onSelectLine && onSelectLine(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                          ({i + 1})
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                          <span className="tac-result">{tac.result}</span>
                          <span style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }}>=</span>
                          {tac.op === '=' ? (
                            <span className="tac-arg">{tac.arg1}</span>
                          ) : (
                            <>
                              <span className="tac-arg">{tac.arg1}</span>
                              <span className="tac-op" style={{ margin: '0 0.4rem' }}>{tac.op}</span>
                              <span className="tac-arg">{tac.arg2}</span>
                            </>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                          {getTacExplanation(tac)}
                        </td>
                      </tr>
                    ))}
                    {(!mappedCode || mappedCode.length === 0) && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                          No intermediate code generated
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {icgTab === 'dag' && result.intermediateCode && <DagVisualizer tac={result.intermediateCode} />}
          </>
  );
}
