const generateLexerTrace = (source) => {
  if (!source) return [];
  const trace = [];
  let index = 0;
  let buffer = "";
  let state = "START";
  const emitted = [];
  
  const addStep = (char, newState, newBuffer) => {
    trace.push({
      charIndex: index,
      char: char || "EOF",
      state: newState,
      buffer: newBuffer,
      emitted: [...emitted]
    });
  };

  while (index < source.length) {
    const char = source[index];
    
    if (state === "START") {
      if (/\s/.test(char)) {
        addStep(char, "START", "");
        index++;
      } else if (/[a-zA-Z_]/.test(char)) {
        state = "IN_IDENTIFIER";
        buffer = char;
        addStep(char, "IN_IDENTIFIER", buffer);
        index++;
      } else if (/[0-9]/.test(char)) {
        state = "IN_NUMBER";
        buffer = char;
        addStep(char, "IN_NUMBER", buffer);
        index++;
      } else if ("-+*/%=".includes(char)) {
        buffer = char;
        addStep(char, "DONE", buffer);
        emitted.push({ type: "OPERATOR", value: buffer });
        index++;
        addStep(source[index], "START", "");
        buffer = "";
        state = "START";
      } else if ("();".includes(char)) {
        buffer = char;
        addStep(char, "DONE", buffer);
        emitted.push({ type: "PUNCTUATION", value: buffer });
        index++;
        addStep(source[index], "START", "");
        buffer = "";
        state = "START";
      } else {
        buffer = char;
        addStep(char, "DONE", buffer);
        emitted.push({ type: "ERROR", value: buffer });
        index++;
        buffer = "";
        state = "START";
      }
    } 
    else if (state === "IN_IDENTIFIER") {
      if (/[a-zA-Z0-9_]/.test(char)) {
        buffer += char;
        addStep(char, "IN_IDENTIFIER", buffer);
        index++;
      } else {
        const type = (buffer === "let" || buffer === "int" || buffer === "float" || buffer === "void") ? "KEYWORD" : "IDENTIFIER";
        emitted.push({ type, value: buffer });
        addStep(char, "DONE", "");
        buffer = "";
        state = "START";
      }
    }
    else if (state === "IN_NUMBER") {
      if (/[0-9]/.test(char)) {
        buffer += char;
        addStep(char, "IN_NUMBER", buffer);
        index++;
      } else {
        emitted.push({ type: "NUMBER", value: buffer });
        addStep(char, "DONE", "");
        buffer = "";
        state = "START";
      }
    }
  }

  if (buffer.length > 0) {
    if (state === "IN_IDENTIFIER") {
      const type = (buffer === "let" || buffer === "int" || buffer === "float" || buffer === "void") ? "KEYWORD" : "IDENTIFIER";
      emitted.push({ type, value: buffer });
    } else if (state === "IN_NUMBER") {
      emitted.push({ type: "NUMBER", value: buffer });
    }
    addStep("EOF", "DONE", "");
  }

  trace.push({
    charIndex: source.length,
    char: "EOF",
    state: "DONE",
    buffer: "",
    emitted: [...emitted]
  });

  return trace;
};

const generateParserTrace = (tokens = []) => {
  if (!tokens || tokens.length === 0) return [];
  const trace = [];
  const stack = ["Program", "$"];
  let tokenIndex = 0;
  
  const getTerminal = (token) => {
    if (!token) return "$";
    if (token.type === "EOF") return "$";
    if (token.type === "KEYWORD" && (token.value === "let" || token.value === "int" || token.value === "float" || token.value === "void")) return "let";
    if (token.type === "IDENTIFIER") return "id";
    if (token.type === "NUMBER") return "num";
    if (token.type === "OPERATOR") return token.value;
    if (token.type === "PUNCTUATION") return token.value;
    return token.value || "$";
  };

  const parsingTable = {
    "Program": {
      "let": ["StmtList"],
      "$": []
    },
    "StmtList": {
      "let": ["Stmt", "StmtList"],
      "$": []
    },
    "Stmt": {
      "let": ["DeclareStmt"]
    },
    "DeclareStmt": {
      "let": ["let", "id", "=", "Expr", ";"]
    },
    "Expr": {
      "id": ["Term", "ExprTail"],
      "num": ["Term", "ExprTail"],
      "(": ["Term", "ExprTail"]
    },
    "ExprTail": {
      "+": ["+", "Term", "ExprTail"],
      "-": ["-", "Term", "ExprTail"],
      ";": [],
      ")": [],
      "$": []
    },
    "Term": {
      "id": ["Factor", "TermTail"],
      "num": ["Factor", "TermTail"],
      "(": ["Factor", "TermTail"]
    },
    "TermTail": {
      "+": [],
      "-": [],
      "*": ["*", "Factor", "TermTail"],
      "/": ["/", "Factor", "TermTail"],
      ";": [],
      ")": [],
      "$": []
    },
    "Factor": {
      "id": ["id"],
      "num": ["num"],
      "(": ["(", "Expr", ")"]
    }
  };

  const addStep = (action) => {
    trace.push({
      stack: [...stack],
      tokenIndex: tokenIndex,
      action: action
    });
  };

  addStep("Initialize Stack");

  let loopCount = 0;
  while (stack.length > 0 && loopCount < 1000) {
    loopCount++;
    const top = stack[0];
    const currentToken = tokens[tokenIndex];
    const terminal = getTerminal(currentToken);

    if (top === terminal) {
      stack.shift();
      if (terminal !== "$") {
        tokenIndex++;
      }
      addStep(`Match terminal '${top}'`);
    } else if (parsingTable[top] !== undefined) {
      const production = parsingTable[top][terminal];
      if (production !== undefined) {
        stack.shift();
        stack.unshift(...production);
        const prodStr = production.length === 0 ? "ε" : production.join(" ");
        addStep(`Expand: ${top} → ${prodStr}`);
      } else {
        addStep(`Error: unexpected token '${terminal}' for non-terminal '${top}'`);
        break;
      }
    } else {
      addStep(`Error: expected '${top}' but found '${terminal}'`);
      break;
    }
  }

  if (stack.length === 0) {
    trace.push({
      stack: [],
      tokenIndex: tokenIndex,
      action: "Parsing Completed Successfully!"
    });
  }

  return trace;
};

const generateShiftReduceTrace = (tokens = []) => {
  if (!tokens || tokens.length === 0) return [];
  const trace = [];
  const stack = [];
  let tokenIndex = 0;

  const getReduction = (stk, nextToken) => {
    const len = stk.length;
    if (len === 0) return null;

    const nextVal = nextToken ? (nextToken.type === "EOF" ? "$" : nextToken.value) : "$";
    const nextSym = nextToken ? (nextToken.type === "IDENTIFIER" ? "id" : nextToken.type === "NUMBER" ? "num" : nextToken.value) : "$";

    const matchSuffix = (arr) => {
      if (len < arr.length) return false;
      for (let i = 0; i < arr.length; i++) {
        if (stk[len - arr.length + i] !== arr[i]) return false;
      }
      return true;
    };

    if (matchSuffix(["Stmt", "StmtList"])) {
      return { popped: ["Stmt", "StmtList"], lhs: "StmtList" };
    }
    if (matchSuffix(["Stmt"]) && nextVal !== "let") {
      return { popped: ["Stmt"], lhs: "StmtList" };
    }
    if (matchSuffix(["DeclareStmt"])) {
      return { popped: ["DeclareStmt"], lhs: "Stmt" };
    }
    if (matchSuffix(["let", "id", "=", "Expr", ";"])) {
      return { popped: ["let", "id", "=", "Expr", ";"], lhs: "DeclareStmt" };
    }
    if (matchSuffix(["Expr", "+", "Term"]) && nextSym !== "*" && nextSym !== "/") {
      return { popped: ["Expr", "+", "Term"], lhs: "Expr" };
    }
    if (matchSuffix(["Expr", "-", "Term"]) && nextSym !== "*" && nextSym !== "/") {
      return { popped: ["Expr", "-", "Term"], lhs: "Expr" };
    }
    if (matchSuffix(["Term", "*", "Factor"])) {
      return { popped: ["Term", "*", "Factor"], lhs: "Term" };
    }
    if (matchSuffix(["Term", "/", "Factor"])) {
      return { popped: ["Term", "/", "Factor"], lhs: "Term" };
    }
    if (matchSuffix(["Term"]) && nextSym !== "*" && nextSym !== "/") {
      return { popped: ["Term"], lhs: "Expr" };
    }
    if (matchSuffix(["Factor"])) {
      return { popped: ["Factor"], lhs: "Term" };
    }
    if (matchSuffix(["(", "Expr", ")"])) {
      return { popped: ["(", "Expr", ")"], lhs: "Factor" };
    }
    if (matchSuffix(["num"])) {
      return { popped: ["num"], lhs: "Factor" };
    }
    if (matchSuffix(["id"]) && nextVal !== "=") {
      return { popped: ["id"], lhs: "Factor" };
    }
    return null;
  };

  const addStep = (action) => {
    trace.push({
      stack: [...stack],
      tokenIndex: tokenIndex,
      action: action
    });
  };

  addStep("Initialize Stack (Empty)");

  let loopCount = 0;
  while ((tokenIndex < tokens.length || getReduction(stack, null) !== null) && loopCount < 1000) {
    loopCount++;
    const nextToken = tokens[tokenIndex];
    const reduction = getReduction(stack, nextToken);

    if (reduction) {
      const { popped, lhs } = reduction;
      for (let i = 0; i < popped.length; i++) {
        stack.pop();
      }
      stack.push(lhs);
      const prodStr = popped.join(" ");
      addStep(`Reduce: ${lhs} → ${prodStr}`);
    } else if (tokenIndex < tokens.length) {
      const tok = tokens[tokenIndex];
      if (tok.type !== "EOF") {
        let symbol = tok.value;
        if (tok.type === "IDENTIFIER") symbol = "id";
        if (tok.type === "NUMBER") symbol = "num";
        stack.push(symbol);
        tokenIndex++;
        addStep(`Shift: '${symbol}'`);
      } else {
        tokenIndex++;
        addStep("Match EOF ($)");
      }
    } else {
      break;
    }
  }

  if (stack.length === 1 && stack[0] === "StmtList") {
    stack.pop();
    stack.push("Program");
    addStep("Reduce: Program → StmtList");
    addStep("Accept: Parsing Completed Successfully!");
  } else if (stack.length === 1 && stack[0] === "Program") {
    addStep("Accept: Parsing Completed Successfully!");
  } else {
    addStep("Error: Shift-Reduce Parsing Failed.");
  }

  return trace;
};

export { generateLexerTrace, generateParserTrace, generateShiftReduceTrace };
