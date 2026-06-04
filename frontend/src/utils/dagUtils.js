const buildDagGraph = (ast) => {
  if (!ast) return [];
  const nodesMap = new Map();
  let idCounter = 0;

  const getLeaf = (type, value) => {
    const key = `leaf_${type}_${value}`;
    if (nodesMap.has(key)) return nodesMap.get(key);
    const node = {
      id: `dag_node_${++idCounter}`,
      type,
      label: value,
      children: []
    };
    nodesMap.set(key, node);
    return node;
  };

  const processExpr = (node) => {
    if (!node) return null;
    
    if (node.type === 'NumberLiteral') {
      return getLeaf('NumberLiteral', node.value);
    }
    if (node.type === 'Identifier') {
      return getLeaf('Identifier', node.value);
    }
    
    if (node.type === 'BinaryExpression') {
      const leftChild = processExpr(node.left);
      const rightChild = processExpr(node.right);
      
      const leftId = leftChild ? leftChild.id : 'null';
      const rightId = rightChild ? rightChild.id : 'null';
      const key = `Binary_${node.value}_${leftId}_${rightId}`;
      
      if (nodesMap.has(key)) {
        return nodesMap.get(key);
      }
      
      const dagNode = {
        id: `dag_node_${++idCounter}`,
        type: 'BinaryExpression',
        label: node.value,
        children: [leftChild, rightChild].filter(c => c !== null)
      };
      nodesMap.set(key, dagNode);
      return dagNode;
    }
    
    if (node.type === 'DeclareStmt' || node.type === 'AssignStmt') {
      const leftChild = processExpr(node.left);
      const rightChild = processExpr(node.right);
      
      const leftId = leftChild ? leftChild.id : 'null';
      const rightId = rightChild ? rightChild.id : 'null';
      const key = `${node.type}_=${leftId}_${rightId}`;
      
      if (nodesMap.has(key)) {
        return nodesMap.get(key);
      }
      
      const dagNode = {
        id: `dag_node_${++idCounter}`,
        type: node.type,
        label: '=',
        children: [leftChild, rightChild].filter(c => c !== null)
      };
      nodesMap.set(key, dagNode);
      return dagNode;
    }
    
    return null;
  };

  if (ast.type === 'Program') {
    ast.body?.forEach(stmt => processExpr(stmt));
  } else {
    processExpr(ast);
  }

  return Array.from(nodesMap.values());
};


const buildDagFromTac = (tacList) => {
  if (!tacList || tacList.length === 0) return [];
  
  const nodesMap = new Map();
  const valueNodes = {};
  let idCounter = 0;
  
  const getOrCreateLeaf = (val) => {
    if (!val) return null;
    if (valueNodes[val]) {
      return valueNodes[val];
    }
    const key = `leaf_${val}`;
    if (nodesMap.has(key)) return nodesMap.get(key);
    const node = {
      id: `tac_node_${++idCounter}`,
      label: val,
      type: 'Leaf',
      children: []
    };
    nodesMap.set(key, node);
    valueNodes[val] = node;
    return node;
  };
  
  tacList.forEach(inst => {
    const op = inst.op;
    const arg1 = inst.arg1;
    const arg2 = inst.arg2;
    const res = inst.result;
    
    if (op === '=') {
      const sourceNode = getOrCreateLeaf(arg1);
      if (sourceNode) {
        valueNodes[res] = sourceNode;
      }
    } else {
      const leftNode = getOrCreateLeaf(arg1);
      const rightNode = getOrCreateLeaf(arg2);
      
      const leftId = leftNode ? leftNode.id : 'null';
      const rightId = rightNode ? rightNode.id : 'null';
      const key = `op_${op}_${leftId}_${rightId}`;
      
      let opNode;
      if (nodesMap.has(key)) {
        opNode = nodesMap.get(key);
      } else {
        opNode = {
          id: `tac_node_${++idCounter}`,
          label: op,
          type: 'Operator',
          children: [leftNode, rightNode].filter(c => c !== null)
        };
        nodesMap.set(key, opNode);
      }
      valueNodes[res] = opNode;
    }
  });
  
  return Array.from(nodesMap.values());
};

export { buildDagGraph, buildDagFromTac };
