import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Code, Layers, ChevronLeft } from 'lucide-react';
import { DEFAULT_CODE, PHASES, PHASE_LABELS } from './utils/constants';
import { generateLexerTrace, generateParserTrace, generateShiftReduceTrace } from './utils/traceUtils';

// Layout
import LandingPage from './components/layout/LandingPage';

// Phases
import LexerPhase from './components/phases/LexerPhase';
import ParserPhase from './components/phases/ParserPhase';
import SemanticsPhase from './components/phases/SemanticsPhase';
import IcgPhase from './components/phases/IcgPhase';
import OptimizerPhase from './components/phases/OptimizerPhase';
import CodegenPhase from './components/phases/CodegenPhase';

import './App.css';
import ConsoleEditor from './components/layout/ConsoleEditor';

function App() {
  const [view, setView] = useState('landing');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [result, setResult] = useState(null);
  const [activePhase, setActivePhase] = useState('LEXER');
  const [loading, setLoading] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  
  // Graphical sub-view tabs
  const [parserTab, setParserTab] = useState('text');
  const [icgTab, setIcgTab] = useState('table');
  const [optimizerTab, setOptimizerTab] = useState('table');

  // Lexer simulator state
  const [lexerTab, setLexerTab] = useState('table');
  const [lexerTrace, setLexerTrace] = useState([]);
  const [simStep, setSimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(400);

  // Parser simulator state
  const [parserSimStep, setParserSimStep] = useState(0);
  const [parserTrace, setParserTrace] = useState([]);
  const [srTrace, setSrTrace] = useState([]);
  const [parserMethod, setParserMethod] = useState('ll1');
  const [parserViewMode, setParserViewMode] = useState('playback');
  const [isParserPlaying, setIsParserPlaying] = useState(false);
  const [parserPlaybackSpeed, setParserPlaybackSpeed] = useState(1200);

  // Semantics state
  const [selectedSemanticsVar, setSelectedSemanticsVar] = useState(null);
  const [editorHighlight, setEditorHighlight] = useState(null);
  const [leftWidth, setLeftWidth] = useState(420);
  const dragRef = useRef(false);
  const splitterRef = useRef(null);
  const [selectedToken, setSelectedToken] = useState(null);

  const handleCompile = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await axios.post(`${baseUrl}/api/compiler/compile`, {
        sourceCode: code
      });
      setResult(res.data);
      
      // Pre-compute Lexer trace
      const trace = generateLexerTrace(code);
      setLexerTrace(trace);
      setSimStep(0);
      setIsPlaying(false);

      // Pre-compute Parser trace
      if (res.data.tokens) {
        const ll1Trace = generateParserTrace(res.data.tokens);
        setParserTrace(ll1Trace);
        const shiftReduceTrace = generateShiftReduceTrace(res.data.tokens);
        setSrTrace(shiftReduceTrace);
      }
      setParserSimStep(0);
      setIsParserPlaying(false);

      setActivePhase('LEXER');
      setEditorHighlight(null);
      setLexerTab('table');
      setParserTab('text');
      setIcgTab('table');
      setOptimizerTab('table');
    } catch (err) {
      console.error(err);
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      alert(`Compilation error. Is the backend running? (Endpoint: ${baseUrl})`);
    } finally {
      setLoading(false);
    }
  };

  // History-aware navigation helper so browser Back/Forward works
  const navigate = (v) => {
    setView(v);
    try {
      const url = v === 'landing' ? '/' : '/console';
      window.history.pushState({ view: v }, '', url);
    } catch {
      void 0;
    }
  };

  // Initialize history state and listen for back/forward
  useEffect(() => {
    try {
      const initUrl = window.location.pathname.includes('console') || window.location.hash.includes('console') ? '/console' : '/';
      const initialView = window.location.pathname.includes('console') || window.location.hash.includes('console') ? 'console' : 'landing';
      window.history.replaceState({ view: initialView }, '', initUrl);
    } catch {
      void 0;
    }

    const onPop = (e) => {
      const st = e.state;
      if (st && st.view) setView(st.view);
      else {
        const v = window.location.pathname.includes('console') || window.location.hash.includes('console') ? 'console' : 'landing';
        setView(v);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(()=>{
    // Fallback mouse handlers (kept for older browsers)
    const onMove = (e) => {
      if(!dragRef.current) return;
      const container = document.querySelector('.main-content');
      if(!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const min = 260; const max = rect.width - 260;
      const newW = Math.max(min, Math.min(max, x));
      setLeftWidth(newW);
    };
    const onUp = () => { dragRef.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Pointer-based splitter handler: more reliable across elements and captures pointer
  useEffect(()=>{
    const splitter = splitterRef.current;
    if(!splitter) return;
    const onPointerDown = (e) => {
      console.log('splitter pointerdown', { pointerId: e.pointerId, x: e.clientX, y: e.clientY });
      try{ splitter.setPointerCapture(e.pointerId); }catch{ void 0; }
      dragRef.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onPointerMove = (ev) => {
        if(!dragRef.current) return;
        const container = document.querySelector('.main-content');
        if(!container) return;
        const rect = container.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const min = 260; const max = rect.width - 260;
        const newW = Math.max(min, Math.min(max, x));
        setLeftWidth(newW);
      };

      const onPointerUp = (ev) => {
        dragRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        try{ splitter.releasePointerCapture(ev.pointerId); }catch{ void 0; }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    };
    splitter.addEventListener('pointerdown', onPointerDown);
    return () => { splitter.removeEventListener('pointerdown', onPointerDown); };
  }, []);

  const renderVisualizer = () => {
    if (!result) return <div className="placeholder">Awaiting compilation...</div>;
    
    switch (activePhase) {
      case 'LEXER':
        return <LexerPhase 
          result={result} code={code} lexerTab={lexerTab} setLexerTab={setLexerTab} 
          lexerTrace={lexerTrace} simStep={simStep} setSimStep={setSimStep} 
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} 
          playbackSpeed={playbackSpeed} setPlaybackSpeed={setPlaybackSpeed}
          onTokenClick={(tok)=>{
            setEditorHighlight({ line: tok.line, column: tok.column });
            setSelectedToken(tok);
          }}
          selectedToken={selectedToken}
        />;
      case 'PARSER':
        return <ParserPhase 
          result={result} parserTab={parserTab} setParserTab={setParserTab}
          parserMethod={parserMethod} setParserMethod={setParserMethod}
          parserViewMode={parserViewMode} setParserViewMode={setParserViewMode}
          parserSimStep={parserSimStep} setParserSimStep={setParserSimStep}
          isParserPlaying={isParserPlaying} setIsParserPlaying={setIsParserPlaying}
          parserPlaybackSpeed={parserPlaybackSpeed} setParserPlaybackSpeed={setParserPlaybackSpeed}
          parserTrace={parserTrace} srTrace={srTrace}
        />;
      case 'SEMANTICS':
        return <SemanticsPhase 
          result={result} 
          selectedSemanticsVar={selectedSemanticsVar} 
          setSelectedSemanticsVar={setSelectedSemanticsVar} 
        />;
      case 'ICG':
        return <IcgPhase result={result} icgTab={icgTab} setIcgTab={setIcgTab} />;
      case 'OPTIMIZER':
        return <OptimizerPhase result={result} optimizerTab={optimizerTab} setOptimizerTab={setOptimizerTab} />;
      case 'CODEGEN':
        return <CodegenPhase result={result} />;
      default:
        return null;
    }
  };

  const scannerIndex = (activePhase === 'LEXER' && lexerTrace && lexerTrace.length > 0 && simStep < lexerTrace.length) ? lexerTrace[simStep].charIndex : null;

  // Fallback: overlay-based drag that guarantees pointer capture across the viewport
  const startOverlayDrag = (startEvent) => {
    // eslint-disable-next-line no-console
    console.log('startOverlayDrag', { x: startEvent.clientX, y: startEvent.clientY });
    startEvent.preventDefault();
    const container = document.querySelector('.main-content');
    if(!container) return;
    const rect = container.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '99999';
    overlay.style.cursor = 'col-resize';
    overlay.style.background = 'transparent';
    document.body.appendChild(overlay);

    const onMove = (ev) => {
      // eslint-disable-next-line no-console
      console.log('overlay move', { x: ev.clientX, y: ev.clientY });
      const x = ev.clientX - rect.left;
      const min = 260; const max = rect.width - 260;
      const newW = Math.max(min, Math.min(max, x));
      setLeftWidth(newW);
    };

    const onUp = () => {
      // eslint-disable-next-line no-console
      console.log('overlay up');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      try{ document.body.removeChild(overlay); }catch{ void 0; }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <>
      <div className="scanlines"></div>
      
      {view === 'landing' ? (
        <LandingPage 
          view={view} setView={navigate} 
          terminalLogs={terminalLogs} setTerminalLogs={setTerminalLogs}
          setCode={setCode}
        />
      ) : (
        <div className="app-container">
          <div className="toolbar compact">
            <div className="toolbar-left">
              <div className="console-back-nav" onClick={() => { setTerminalLogs([]); navigate('landing'); }}>
                <ChevronLeft size={16} />
                <span>[ ESC ]</span>
              </div>
            </div>
            <div className="toolbar-center">
              <h2>Compiler Console</h2>
            </div>
            <div className="toolbar-right">
              <button className="btn" onClick={handleCompile} disabled={loading}>
                <Play size={14} /> {loading ? 'Compiling...' : 'Run Compiler'}
              </button>
            </div>
          </div>

          <div className="pipeline-row">
            {PHASES.map((phase, idx) => (
              <div key={phase} className={`pipeline-phase ${activePhase === phase ? 'active' : ''} ${idx < PHASES.indexOf(activePhase) ? 'completed' : ''}`} onClick={() => setActivePhase(phase)}>
                <div className="phase-label">{phase}</div>
                <div className="phase-sub">{PHASE_LABELS[phase]}</div>
              </div>
            ))}
          </div>

          <div className="main-content">
            <div className="panel" style={{ width: leftWidth }}>
              <div className="panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Code size={16}/> Source Code</span>
              </div>
              <div className="panel-content">
                <ConsoleEditor code={code} setCode={setCode} highlight={editorHighlight} scannerIndex={scannerIndex} onCaretChange={(c)=>{
                  if(!result || !result.tokens) return;
                  // find token by line/column
                  const found = result.tokens.find(t => t.line === c.line && t.column === c.column);
                  if(found){
                    setSelectedToken(found);
                  } else {
                    setSelectedToken(null);
                  }
                }} onClickPosition={(p)=>{
                  if(!result || !result.tokens) return;
                  const found = result.tokens.find(t => t.line === p.line && t.column === p.column);
                  if(found){ setSelectedToken(found); setEditorHighlight({ line: found.line, column: found.column }); }
                }} />
              </div>
            </div>

            <div ref={splitterRef} className="splitter" onMouseDown={(e)=>{ dragRef.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; startOverlayDrag(e); }} />

            <div className="panel" style={{ flex: 1 }}>
              <div className="panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={16}/> {PHASE_LABELS[activePhase] || activePhase}
                </span>
              </div>
              <div className="panel-content">
                {renderVisualizer()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
