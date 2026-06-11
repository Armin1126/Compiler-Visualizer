import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

/**
 * CodegenPhase visualizer with step‑by‑step playback, dynamic register allocation
 * simulator, and a memory map simulator.
 */
export default function CodegenPhase({ result }) {
  // Assembly instructions
  const assembly = result?.assemblyCode || [];

  // Playback state
  const [simStep, setSimStep] = useState(-1); // -1 means before first instruction
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200);
  const timerRef = useRef(null);
  const tableRef = useRef(null);

  const totalSteps = assembly.length;

  // Auto‑play timer
  useEffect(() => {
    if (isPlaying) {
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
  }, [isPlaying, playbackSpeed, totalSteps]);

  // Auto‑scroll to current row
  useEffect(() => {
    if (tableRef.current && simStep >= 0) {
      const row = tableRef.current.querySelector('.codegen-step-active');
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

  // Compute dynamic simulation state (Registers & Memory) based on instructions up to current step
  const getSimulationStateAtStep = (step) => {
    const regs = { ACC: '—', R1: '—', R2: '—' };
    const mem = {};

    for (let i = 0; i <= step; i++) {
      const inst = assembly[i];
      if (!inst) continue;

      const op = inst.opcode;
      const a1 = inst.arg1;
      const a2 = inst.arg2;
      const a3 = inst.arg3;

      if (op === 'LOAD') {
        // e.g. LOAD ACC, arg1 or LOAD R1, arg1
        if (a1 in regs) {
          regs[a1] = a2;
        }
      } else if (op === 'STORE') {
        // e.g. STORE res, ACC
        mem[a1] = regs[a2] || a2;
      } else if (['ADD', 'SUB', 'MUL', 'DIV', 'MOD'].includes(op)) {
        // e.g. ADD ACC, R1, R2
        const val1 = regs[a2] || a2;
        const val2 = regs[a3] || a3;
        
        let symbol = '+';
        if (op === 'SUB') symbol = '-';
        if (op === 'MUL') symbol = '*';
        if (op === 'DIV') symbol = '/';
        if (op === 'MOD') symbol = '%';

        regs[a1] = `${val1} ${symbol} ${val2}`;
      }
    }

    return { regs, mem };
  };

  const { regs, mem } = getSimulationStateAtStep(simStep);

  return (
    <>
      {/* Educational Banner */}
      <div className="phase-educational-banner">
        <h3>Phase 6: Code Generation & Register Allocation</h3>
        <p>
          This is the final phase of the compiler pipeline. It translates the optimized Three-Address Code (TAC) into
          target machine assembly instructions. This simulator models register assignment (accumulator-based and scratch registers)
          and visualizes memory state changes as instructions execute.
        </p>
      </div>

      {/* Playback Controls */}
      <div className="codegen-sim-container">
        <div className="codegen-sim-controls">
          <div className="codegen-sim-controls-left">
            <button className="sim-btn" onClick={handleReset} title="Reset"><RotateCcw size={14} /></button>
            <button className="sim-btn" onClick={handleStepBack} disabled={simStep <= -1} title="Step Back"><SkipBack size={14} /></button>
            <button className="sim-btn primary" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button className="sim-btn" onClick={handleStepForward} disabled={simStep >= totalSteps - 1} title="Step Forward"><SkipForward size={14} /></button>
          </div>
          <div className="codegen-sim-controls-center">
            <span className="codegen-step-counter">
              {simStep < 0 ? 'Ready to Start' : `Instruction ${simStep + 1} of ${totalSteps}`}
            </span>
          </div>
          <div className="codegen-sim-controls-right">
            <label className="speed-label">Speed</label>
            <input
              type="range"
              min={300}
              max={2500}
              step={100}
              value={2800 - playbackSpeed}
              onChange={e => setPlaybackSpeed(2800 - Number(e.target.value))}
              className="speed-slider"
            />
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="codegen-progress-track">
          <div className="codegen-progress-fill" style={{ width: `${totalSteps > 0 ? ((simStep + 1) / totalSteps) * 100 : 0}%` }} />
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`codegen-progress-dot ${i <= simStep ? 'done' : ''} ${i === simStep ? 'active' : ''}`}
              style={{ left: `${((i + 0.5) / totalSteps) * 100}%` }}
              onClick={() => { setIsPlaying(false); setSimStep(i); }}
              title={`Instruction ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        {/* Register Allocation Panel */}
        <div className="codegen-reg-panel" style={{ marginTop: 0 }}>
          <h4>Registers</h4>
          <div className="codegen-reg-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {Object.entries(regs).map(([reg, val]) => (
              <div key={reg} className="codegen-reg-cell">
                <span className="codegen-reg-name">{reg}</span>
                <span className="codegen-reg-val" title={val}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Memory Map Simulator Panel */}
        <div className="codegen-mem-panel" style={{ marginTop: 0 }}>
          <h4>Active Memory Variables</h4>
          <div className="codegen-mem-grid">
            {Object.entries(mem).map(([addr, val]) => (
              <div key={addr} className="codegen-mem-cell">
                <span className="codegen-mem-addr">{addr}</span>
                <span className="codegen-mem-val" title={val}>{val}</span>
              </div>
            ))}
            {Object.keys(mem).length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.5rem' }}>
                No active variables in memory yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assembly Table */}
      <div className="codegen-table-container" ref={tableRef}>
        <table className="codegen-table">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>#</th>
              <th style={{ width: 100 }}>Opcode</th>
              <th>Arg1</th>
              <th>Arg2</th>
              <th>Arg3</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {assembly.map((asm, i) => (
              <tr key={i} className={i === simStep ? 'codegen-step-active' : ''}>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'bold' }}>{i + 1}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{asm.opcode}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{asm.arg1 || '—'}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{asm.arg2 || '—'}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{asm.arg3 || '—'}</td>
                <td style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{asm.comment ? `// ${asm.comment}` : ''}</td>
              </tr>
            ))}
            {assembly.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Awaiting compiled assembly code
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

