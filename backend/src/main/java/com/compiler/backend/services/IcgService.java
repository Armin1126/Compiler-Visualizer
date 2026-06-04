package com.compiler.backend.services;

import com.compiler.backend.models.AstNode;
import com.compiler.backend.models.TacInstruction;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class IcgService {

    private int tempCounter;
    private List<TacInstruction> instructions;

    public List<TacInstruction> generate(AstNode root) {
        this.tempCounter = 0;
        this.instructions = new ArrayList<>();
        
        if (root != null && "Program".equals(root.getType())) {
            for (AstNode stmt : root.getBody()) {
                generateStatement(stmt);
            }
        }
        return instructions;
    }

    private void generateStatement(AstNode stmt) {
        if (stmt.getType().equals("DeclareStmt") || stmt.getType().equals("AssignStmt")) {
            String varName = stmt.getLeft().getValue();
            String res = generateExpression(stmt.getRight());
            instructions.add(new TacInstruction("=", res, null, varName));
        }
    }

    private String generateExpression(AstNode expr) {
        if (expr.getType().equals("NumberLiteral") || expr.getType().equals("Identifier")) {
            return expr.getValue();
        } else if (expr.getType().equals("BinaryExpression")) {
            String left = generateExpression(expr.getLeft());
            String right = generateExpression(expr.getRight());
            String temp = nextTemp();
            instructions.add(new TacInstruction(expr.getValue(), left, right, temp));
            return temp;
        }
        return null;
    }

    private String nextTemp() {
        return "t" + (tempCounter++);
    }
}
