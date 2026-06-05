package com.compiler.backend.services;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.compiler.backend.models.AstNode;
import com.compiler.backend.models.Symbol;

@Service
public class SemanticAnalyzerService {

    private Map<String, Symbol> symbolTable;
    private List<String> errors;

    public void analyze(AstNode root, Map<String, Symbol> symbolTable, List<String> errors) {
        this.symbolTable = symbolTable;
        this.errors = errors;
        
        if (root != null && "Program".equals(root.getType())) {
            for (AstNode stmt : root.getBody()) {
                analyzeStatement(stmt);
            }
        }
    }

    private void analyzeStatement(AstNode stmt) {
        if (stmt.getType().equals("DeclareStmt")) {
            String varName = stmt.getLeft().getValue();
            if (symbolTable.containsKey(varName)) {
                errors.add("Semantic error: Variable '" + varName + "' is already declared.");
            } else {
                symbolTable.put(varName, new Symbol(varName, "Number", true, true, null));
            }
            analyzeExpression(stmt.getRight());
        } else if (stmt.getType().equals("AssignStmt")) {
            String varName = stmt.getLeft().getValue();
            if (!symbolTable.containsKey(varName)) {
                errors.add("Semantic error: Variable '" + varName + "' is used before declaration.");
            } else {
                Symbol sym = symbolTable.get(varName);
                sym.setInitialized(true);
            }
            analyzeExpression(stmt.getRight());
        }
    }

    private void analyzeExpression(AstNode expr) {
        if (expr.getType().equals("BinaryExpression")) {
            analyzeExpression(expr.getLeft());
            analyzeExpression(expr.getRight());
        } else if (expr.getType().equals("Identifier")) {
            String varName = expr.getValue();
            if (!symbolTable.containsKey(varName)) {
                errors.add("Semantic error: Variable '" + varName + "' is used before declaration.");
            }
        } else if (expr.getType().equals("NumberLiteral")) {
            // Numbers are always valid
        }
    }
}
