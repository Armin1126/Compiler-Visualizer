const getTacExplanation = (tac) => {
  if (!tac) return '';
  const isTemp = (s) => s && s.startsWith('t') && !isNaN(s.substring(1));
  const formatName = (s) => isTemp(s) ? `temporary variable ${s}` : `variable '${s}'`;
  
  if (tac.op === '=') {
    return `Assign the value of ${formatName(tac.arg1)} to ${formatName(tac.result)}`;
  }
  
  const opNames = {
    '+': 'Add',
    '-': 'Subtract',
    '*': 'Multiply',
    '/': 'Divide',
    '%': 'Modulo'
  };
  const opName = opNames[tac.op] || `Apply operator '${tac.op}' to`;
  
  return `${opName} ${formatName(tac.arg1)} and ${formatName(tac.arg2)}, storing the result in ${formatName(tac.result)}`;
};


const diffOptimizerTraces = (original, optimized) => {
  if (!original) return [];
  const optimizedList = optimized || [];
  return original.map((orig, idx) => {
    const opt = idx < optimizedList.length ? optimizedList[idx] : null;
    if (!opt) {
      return {
        original: orig,
        optimized: null,
        changed: true,
        type: 'Removed',
        explanation: 'Instruction was eliminated during compiler pass'
      };
    }
    
    const changed = orig.op !== opt.op || orig.arg1 !== opt.arg1 || orig.arg2 !== opt.arg2 || orig.result !== opt.result;
    let type = 'None';
    let explanation = 'Instruction preserved with no changes';
    
    if (changed) {
      const isOperator = ['+', '-', '*', '/', '%'].includes(orig.op);
      const isNumber = (s) => s && !isNaN(s);
      
      if (isOperator && isNumber(orig.arg1) && isNumber(orig.arg2)) {
        type = 'Constant Folding';
        explanation = `Evaluated constant expression: ${orig.arg1} ${orig.op} ${orig.arg2} → ${opt.arg1}`;
      } else if (orig.op === '*' && (orig.arg1 === '1' || orig.arg2 === '1')) {
        const otherVal = orig.arg1 === '1' ? orig.arg2 : orig.arg1;
        type = 'Algebraic Simplification';
        explanation = `Multiplicative identity rule: ${otherVal} * 1 → ${otherVal}`;
      } else if (orig.op === '+' && (orig.arg1 === '0' || orig.arg2 === '0')) {
        const otherVal = orig.arg1 === '0' ? orig.arg2 : orig.arg1;
        type = 'Additive identity rule';
        explanation = `Additive identity rule: ${otherVal} + 0 → ${otherVal}`;
      } else {
        type = 'Optimization';
        explanation = `Simplified operation`;
      }
    }
    
    return {
      original: orig,
      optimized: opt,
      changed,
      type,
      explanation
    };
  });
};

const mapTacToSourceLines = (ast, intermediateCode) => {
  if (!intermediateCode || intermediateCode.length === 0) return [];
  
  const varAssignments = [];
  const statements = (ast && ast.body) ? ast.body : [];
  statements.forEach((stmt, idx) => {
    if (stmt.type === 'DeclareStmt' || stmt.type === 'AssignStmt') {
      varAssignments.push({
        varName: stmt.left?.value,
        line: idx + 1
      });
    }
  });

  let lastRealAssignIdx = -1;
  const mappedInstructions = intermediateCode.map((tac) => {
    const isTemp = (s) => s && s.startsWith('t') && !isNaN(s.substring(1));
    const isRealAssign = tac.op === '=' && !isTemp(tac.result);
    
    if (isRealAssign) {
      lastRealAssignIdx++;
    }
    
    const assignInfo = varAssignments[Math.min(lastRealAssignIdx + (isRealAssign ? 0 : 1), varAssignments.length - 1)];
    const lineNum = assignInfo ? assignInfo.line : 1;
    
    return {
      ...tac,
      line: lineNum
    };
  });
  
  return mappedInstructions;
};

export { getTacExplanation, diffOptimizerTraces, mapTacToSourceLines };
