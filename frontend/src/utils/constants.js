import { Code, Layers, Activity, Terminal, Settings, Cpu } from 'lucide-react';

const DEFAULT_CODE = `let a = 10;
let b = 20;
let result = a * 2 + b;
`;

const PHASES = ['LEXER', 'PARSER', 'SEMANTICS', 'ICG', 'OPTIMIZER', 'CODEGEN'];

const FEATURES = [
  { tag: "PHASE 01", title: "Lexical Scanner", desc: "Break raw code into structured tokens with precise line and column annotations.", icon: Code },
  { tag: "PHASE 02", title: "AST Parser", desc: "Construct a hierarchical Abstract Syntax Tree mapping syntax tree nodes.", icon: Layers },
  { tag: "PHASE 03", title: "Semantic Analyzer", desc: "Validate symbol tables, declarations, types, and identifier assignments.", icon: Activity },
  { tag: "PHASE 04", title: "Intermediate Code (TAC)", desc: "Translate high-level commands into standard Three-Address Code instructions.", icon: Terminal },
  { tag: "PHASE 05", title: "Code Optimizer", desc: "Perform optimizations like constant folding and dead code removal on TAC code.", icon: Settings },
  { tag: "PHASE 06", title: "Machine Assembly", desc: "Synthesize target machine assembler codes complete with diagnostic comments.", icon: Cpu }
];

const MOCK_DIAGNOSTICS = [
  { text: ">> SYSTEM BOOT: COMPILER VISUALIZER v1.0.0", type: "cyan" },
  { text: ">> LOADED TinyLang SPECIFICATION STANDARD V2", type: "muted" },
  { text: ">> ATTACHING COMPILER PIPELINES...", type: "muted" },
  { text: ">> LEXER MODULE STACK STATUS: OK", type: "green" },
  { text: ">> AST CONTEXT FREE GRAMMAR RESOLVED: OK", type: "green" },
  { text: ">> TYPE DICTIONARY LOADED: INT, FLOAT, VOID", type: "muted" },
  { text: ">> SEMANTIC ENGINE ONLINE: OK", type: "green" },
  { text: ">> THREE-ADDRESS-CODE GENERATOR READY", type: "green" },
  { text: ">> CORE OPTIMIZER ENGINE O2 READY", type: "green" },
  { text: ">> COMPILER KERNEL STEADY. SYSTEM OPERATIONAL.", type: "cyan" },
  { text: ">> SIMULATING SOURCE DATA...", type: "rust" },
  { text: ">> [TOKENS GENERATED]: 12 TOKENS RESOLVED", type: "muted" },
  { text: ">> [AST ROOT]: PROGRAM → BLOCK → STATEMENTS", type: "muted" },
  { text: ">> [OPTIMIZATIONS]: CONSTANT FOLDING APPLIED", type: "muted" },
  { text: ">> ASSEMBLY CODE EMITTED: 4 SEGMENTS", type: "green" },
  { text: ">> CONSOLE STANDBY. AWAITING USER INPUT SYSTEM...", type: "cyan" }
];

export const PHASE_LABELS = {
  LEXER: 'LEXICAL ANALYZER',
  PARSER: 'SYNTAX ANALYZER (AST)',
  SEMANTICS: 'SEMANTIC ANALYZER',
  ICG: 'INTERMEDIATE CODE GENERATOR',
  OPTIMIZER: 'CODE OPTIMIZER',
  CODEGEN: 'TARGET CODE GENERATOR'
};

export { DEFAULT_CODE, PHASES, FEATURES, MOCK_DIAGNOSTICS };
