package com.compiler.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssemblyInstruction {
    private String opcode; // LOAD, STORE, ADD, SUB, MUL, DIV
    private String arg1;
    private String arg2;
    private String arg3;
    private String comment;
    
    public AssemblyInstruction(String opcode, String arg1, String arg2, String comment) {
        this.opcode = opcode;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.comment = comment;
    }

    @Override
    public String toString() {
        String instr = opcode + " " + (arg1 != null ? arg1 : "") + (arg2 != null ? ", " + arg2 : "") + (arg3 != null ? ", " + arg3 : "");
        if (comment != null && !comment.isEmpty()) {
            return instr + " // " + comment;
        }
        return instr;
    }
}
