import { useState, useEffect } from 'react';
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

  const renderVisualizer = () => {
    if (!result) return <div className="placeholder">Awaiting compilation...</div>;
    
    switch (activePhase) {
      case 'LEXER':
        return <LexerPhase 
          result={result} code={code} lexerTab={lexerTab} setLexerTab={setLexerTab} 
          lexerTrace={lexerTrace} simStep={simStep} setSimStep={setSimStep} 
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} 
          playbackSpeed={playbackSpeed} setPlaybackSpeed={setPlaybackSpeed} 
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

  return (
    <>
      <div className="scanlines"></div>
      
      {view === 'landing' ? (
        <LandingPage 
          view={view} setView={navigate} 
          terminalLogs={terminalLogs} setTerminalLogs={setTerminalLogs} 
        />
      ) : (
        <div className="app-container">
          <div className="header">
            <div className="console-back-nav" onClick={() => { setTerminalLogs([]); navigate('landing'); }}>
              <ChevronLeft size={18} />
              <span>[ ESCAPE ]</span>
            </div>
            <h1>CONSOLE</h1>
            <button className="btn" onClick={handleCompile} disabled={loading}>
              <Play size={16} /> {loading ? 'Compiling...' : 'Run Compiler'}
            </button>
          </div>

          {result && (
            <div className="stepper">
              {PHASES.map(phase => (
                <div 
                  key={phase} 
                  className={`step ${activePhase === phase ? 'active' : ''}`}
                  onClick={() => {
                    setActivePhase(phase);
                    // Reset toggles to default view
                    setParserTab('text');
                    setIcgTab('table');
                    setOptimizerTab('table');
                  }}
                >
                  {phase}
                </div>
              ))}
            </div>
          )}

          <div className="main-content">
            <div className="panel">
              <div className="panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Code size={18}/> Source Code (TinyLang)</span>
              </div>
              <div className="panel-content">
                <textarea 
                  className="editor-textarea"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck="false"
                />
              </div>
            </div>

            <div className="panel" style={{ flex: 2 }}>
              <div className="panel-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18}/> {PHASE_LABELS[activePhase] || activePhase}
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
