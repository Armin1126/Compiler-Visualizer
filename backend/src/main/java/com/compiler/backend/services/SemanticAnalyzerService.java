package com.compiler.backend.services;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.compiler.backend.models.AstNode;
import com.compiler.backend.models.Symbol;

@Service
public class SemanticAnalyzerService {

    /**
     * Entry point — the singleton is stateless; all mutable state lives inside
     * a short-lived AnalysisContext that is created fresh for every call.
     * This makes concurrent requests completely independent of one another.
     */
    public void analyze(AstNode root, Map<String, Symbol> symbolTable, List<String> errors) {
        new AnalysisContext(symbolTable, errors).analyzeRoot(root);
    }

    // -----------------------------------------------------------------------
    // Inner context class — one instance per analyze() invocation, never shared
    // -----------------------------------------------------------------------
    private static final class AnalysisContext {

        private final Map<String, Symbol> symbolTable;
        private final List<String> errors;

        AnalysisContext(Map<String, Symbol> symbolTable, List<String> errors) {
            this.symbolTable = symbolTable;
            this.errors      = errors;
        }

        void analyzeRoot(AstNode root) {
            if (root != null && "Program".equals(root.getType())) {
                for (AstNode stmt : root.getBody()) {
                    analyzeStatement(stmt);
                }
            }
        }

        private void analyzeStatement(AstNode stmt) {
            switch (stmt.getType()) {
                case "DeclareStmt" -> {
                    String varName = stmt.getLeft().getValue();
                    if (symbolTable.containsKey(varName)) {
                        errors.add("Semantic error: Variable '" + varName + "' is already declared.");
                    } else {
                        symbolTable.put(varName, new Symbol(varName, "Number", true, true, null));
                    }
                    analyzeExpression(stmt.getRight());
                }
                case "AssignStmt" -> {
                    String varName = stmt.getLeft().getValue();
                    if (!symbolTable.containsKey(varName)) {
                        errors.add("Semantic error: Variable '" + varName + "' is used before declaration.");
                    } else {
                        Symbol sym = symbolTable.get(varName);
                        sym.setInitialized(true);
                    }
                    analyzeExpression(stmt.getRight());
                }
                default -> {
                    // no-op for other statement types
                }
            }
        }

        private void analyzeExpression(AstNode expr) {
            switch (expr.getType()) {
                case "BinaryExpression" -> {
                    analyzeExpression(expr.getLeft());
                    analyzeExpression(expr.getRight());
                }
                case "Identifier" -> {
                    String varName = expr.getValue();
                    if (!symbolTable.containsKey(varName)) {
                        errors.add("Semantic error: Variable '" + varName + "' is used before declaration.");
                    }
                }
                case "NumberLiteral" -> {
                    // Numbers are always valid
                }
                default -> {
                    // no-op
                }
            }
        }
    }
}
