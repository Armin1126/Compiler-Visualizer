const getLeafCount = (node) => {
  if (!node) return 0;
  const children = [];
  if (node.left) children.push(node.left);
  if (node.right) children.push(node.right);
  if (node.body) children.push(...node.body);
  if (children.length === 0) return 1;
  return children.reduce((sum, child) => sum + getLeafCount(child), 0);
};

const getTreeDepth = (node) => {
  if (!node) return 0;
  const children = [];
  if (node.left) children.push(node.left);
  if (node.right) children.push(node.right);
  if (node.body) children.push(...node.body);
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map(getTreeDepth));
};

const buildTreeLayout = (node, xStart, xEnd, y, ySpacing) => {
  if (!node) return { nodes: [], edges: [] };

  const x = (xStart + xEnd) / 2;
  const currentId = Math.random().toString(36).substring(2, 9);
  
  let label = node.type;
  let val = node.value ? node.value : '';
  
  if (node.type === "BinaryExpression") label = node.value || "Op";
  if (node.type === "NumberLiteral") label = node.value;
  if (node.type === "Identifier") label = node.value;
  if (node.type === "DeclareStmt") label = "let =";
  if (node.type === "AssignStmt") label = "=";

  if (label === val) {
    val = '';
  }
  
  const current = {
    id: currentId,
    type: node.type,
    label,
    val,
    x,
    y
  };

  let nodes = [current];
  let edges = [];

  const children = [];
  if (node.left) children.push(node.left);
  if (node.right) children.push(node.right);
  if (node.body) children.push(...node.body);

  if (children.length > 0) {
    const totalLeaves = children.reduce((sum, child) => sum + getLeafCount(child), 0);
    let currentX = xStart;

    children.forEach((child) => {
      const leafCount = getLeafCount(child);
      const childWidth = ((xEnd - xStart) * leafCount) / totalLeaves;
      const childStart = currentX;
      const childEnd = currentX + childWidth;
      
      const childResult = buildTreeLayout(child, childStart, childEnd, y + ySpacing, ySpacing);
      
      nodes = [...nodes, ...childResult.nodes];
      edges = [...edges, ...childResult.edges];
      if (childResult.nodes.length > 0) {
        edges.push({
          id: `${currentId}-${childResult.nodes[0].id}`,
          fromX: x,
          fromY: y,
          toX: childResult.nodes[0].x,
          toY: childResult.nodes[0].y
        });
      }
      currentX = childEnd;
    });
  }

  return { nodes, edges };
};


const getAstNodeExplanation = (node) => {
  if (!node) return '';
  switch (node.type) {
    case 'Program': return 'Root node representing the entire program.';
    case 'BlockStatement': return 'A block of grouped statements.';
    case 'VariableDeclaration': return `Declares a new variable.`;
    case 'AssignmentExpression': return `Assigns a value to a variable.`;
    case 'BinaryExpression': return `Performs a binary operation (${node.value || 'operator'}).`;
    case 'Identifier': return `Variable reference '${node.value}'.`;
    case 'NumericLiteral': return `Constant numeric value (${node.value}).`;
    case 'StringLiteral': return `Constant string value ("${node.value}").`;
    case 'ExpressionStatement': return 'A statement that evaluates an expression.';
    default: return `AST node representing ${node.type}.`;
  }
};


const stringifyAstNode = (node) => {
  if (!node) return '';
  switch (node.type) {
    case 'DeclareStmt':
      return `let ${stringifyAstNode(node.left)} = ${stringifyAstNode(node.right)}`;
    case 'AssignStmt':
      return `${stringifyAstNode(node.left)} = ${stringifyAstNode(node.right)}`;
    case 'BinaryExpression':
      return `${stringifyAstNode(node.left)} ${node.value || '+'} ${stringifyAstNode(node.right)}`;
    case 'Identifier':
    case 'NumberLiteral':
      return node.value || '';
    default:
      return '';
  }
};

// Generates reference timeline (Declaration, Reads, Writes) for a variable from the AST
const getVariableLifecycle = (ast, varName) => {
  if (!ast || !ast.body) return [];
  const events = [];
  
  const checkExprForVar = (node) => {
    if (!node) return false;
    if (node.type === 'Identifier' && node.value === varName) return true;
    return checkExprForVar(node.left) || checkExprForVar(node.right);
  };

  ast.body.forEach((stmt, idx) => {
    const stmtStr = stringifyAstNode(stmt);
    if (stmt.type === 'DeclareStmt') {
      if (stmt.left?.value === varName) {
        events.push({ 
          type: 'Declaration', 
          statement: stmtStr, 
          details: 'Variable declared in symbol table', 
          line: idx + 1 
        });
      } else if (checkExprForVar(stmt.right)) {
        events.push({ 
          type: 'Read', 
          statement: stmtStr, 
          details: `Read value of '${varName}'`, 
          line: idx + 1 
        });
      }
    } else if (stmt.type === 'AssignStmt') {
      if (stmt.left?.value === varName) {
        events.push({ 
          type: 'Write', 
          statement: stmtStr, 
          details: `Assigned new value to '${varName}'`, 
          line: idx + 1 
        });
      } else if (checkExprForVar(stmt.right)) {
        events.push({ 
          type: 'Read', 
          statement: stmtStr, 
          details: `Read value of '${varName}'`, 
          line: idx + 1 
        });
      }
    }
  });

  return events;
};

export { getLeafCount, getTreeDepth, buildTreeLayout, getAstNodeExplanation, stringifyAstNode, getVariableLifecycle };
