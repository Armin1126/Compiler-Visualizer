import { getVariableLifecycle } from '../../utils/astUtils';

export default function SemanticsPhase({ result, selectedSemanticsVar, setSelectedSemanticsVar }) {
        const symbolsList = Object.values(result.symbolTables || {});
        const activeVar = selectedSemanticsVar || (symbolsList.length > 0 ? symbolsList[0].name : null);
        const lifecycleEvents = activeVar ? getVariableLifecycle(result.ast, activeVar) : [];

        const warningLogs = [];
        symbolsList.forEach((sym) => {
          const events = getVariableLifecycle(result.ast, sym.name);
          const hasReads = events.some(e => e.type === 'Read');
          if (sym.isDeclared && !hasReads) {
            warningLogs.push(`Variable '${sym.name}' is declared but never read (unused variable).`);
          }
          if (sym.isDeclared && !sym.isInitialized) {
            warningLogs.push(`Variable '${sym.name}' is declared but never initialized.`);
          }
        });

        return (
          <>
            <div className="parser-sim-header-banner" style={{ marginTop: '1.25rem', marginBottom: '1.5rem', background: 'rgba(13, 148, 136, 0.04)', borderColor: 'rgba(13, 148, 136, 0.15)' }}>
              <h3 style={{ color: '#0d9488' }}>Phase 3: Semantic Analysis & Symbol Tables</h3>
              <p>
                In this phase, the compiler performs context-sensitive checks on the Abstract Syntax Tree. It ensures all 
                variables are declared before use, detects scope redeclarations, verifies basic type constraints, and maps 
                each identifier to its active lifecycle context within the compiled program.
              </p>
            </div>

            <div className="semantics-grid">
              <div className="semantics-left-column">
                <div className="parser-sim-card">
                  <div className="parser-sim-card-title">ACTIVE SYMBOL TABLE</div>
                  <div className="parser-input-buffer-table-container" style={{ maxHeight: '220px' }}>
                    <table className="parser-history-table">
                      <thead>
                        <tr>
                          <th>Variable</th>
                          <th>Type</th>
                          <th style={{ textAlign: 'center' }}>Scope</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {symbolsList.map((sym, idx) => {
                          const isSelected = sym.name === activeVar;
                          let statusText = 'Declared';
                          let badgeClass = 'badge-yellow';
                          
                          if (sym.isDeclared && sym.isInitialized) {
                            statusText = 'Initialized';
                            badgeClass = 'badge-green';
                          } else if (!sym.isDeclared) {
                            statusText = 'Undeclared';
                            badgeClass = 'badge-red';
                          }

                          return (
                            <tr 
                              key={idx}
                              onClick={() => setSelectedSemanticsVar(sym.name)}
                              className={`history-row ${isSelected ? 'active-history-row' : ''}`}
                              style={{ cursor: 'pointer' }}
                            >
                              <td style={{ fontWeight: 'bold' }}>{sym.name}</td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{sym.type}</td>
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Global</td>
                              <td>
                                <span className={`symbol-badge ${badgeClass}`}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {symbolsList.length === 0 && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                              No symbols declared in source program
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {activeVar && (
                  <div className="parser-sim-card" style={{ marginTop: '1rem' }}>
                    <div className="parser-sim-card-title">
                      LIFECYCLE TIMELINE // Reference Trace for <span style={{ color: 'var(--accent-primary)', textTransform: 'none' }}>'{activeVar}'</span>
                    </div>
                    <div className="lifecycle-timeline-container">
                      {lifecycleEvents.map((ev, idx) => (
                        <div key={idx} className="timeline-event">
                          <div className="timeline-badge-column">
                            <div className={`timeline-dot ${ev.type.toLowerCase()}`}></div>
                            {idx < lifecycleEvents.length - 1 && <div className="timeline-line"></div>}
                          </div>
                          <div className="timeline-content-column">
                            <div className="timeline-header">
                              <span className="timeline-type">{ev.type}</span>
                              <span className="timeline-line-num">Line {ev.line}</span>
                            </div>
                            <div className="timeline-stmt">
                              <code>{ev.statement}</code>
                            </div>
                            <div className="timeline-desc">{ev.details}</div>
                          </div>
                        </div>
                      ))}
                      {lifecycleEvents.length === 0 && (
                        <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          No reference lifecycle details available.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="semantics-right-column">
                <div className="parser-sim-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="parser-sim-card-title">COMPILER DIAGNOSTIC CONSOLE</div>
                  <div className="diagnostic-console">
                    <div className="console-header">
                      <span>STDOUT / STDERR Checker Stream</span>
                    </div>
                    <div className="console-logs-container">
                      {result.semanticErrors && result.semanticErrors.length > 0 ? (
                        result.semanticErrors.map((err, idx) => (
                          <div key={idx} className="console-line error-line">
                            <span className="console-tag">[ERROR]</span> {err}
                          </div>
                        ))
                      ) : (
                        <div className="console-line success-line">
                          <span className="console-tag">[INFO]</span> Semantic compilation check succeeded. 0 errors.
                        </div>
                      )}

                      {warningLogs.map((warn, idx) => (
                        <div key={idx} className="console-line warning-line">
                          <span className="console-tag">[WARN]</span> {warn}
                        </div>
                      ))}

                      {(!result.semanticErrors || result.semanticErrors.length === 0) && warningLogs.length === 0 && (
                        <div className="console-line info-line">
                          <span className="console-tag">[INFO]</span> All variables are declared, initialized, and referenced correctly. Perfect score!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
}
