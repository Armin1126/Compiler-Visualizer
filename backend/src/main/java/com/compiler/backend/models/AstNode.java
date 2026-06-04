package com.compiler.backend.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class AstNode {
    private String type; // Program, VariableDeclaration, Assignment, BinaryExpression, Identifier, NumberLiteral
    private String value;
    private AstNode left;
    private AstNode right;
    private List<AstNode> body = new ArrayList<>();

    public AstNode(String type) {
        this.type = type;
    }

    public AstNode(String type, String value) {
        this.type = type;
        this.value = value;
    }
}
