package com.compiler.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TacInstruction {
    private String op; // +, -, *, /, =, let
    private String arg1;
    private String arg2;
    private String result;

    @Override
    public String toString() {
        if (op.equals("=")) return result + " = " + arg1;
        if (op.equals("let")) return "let " + result;
        return result + " = " + arg1 + " " + op + " " + arg2;
    }
}
