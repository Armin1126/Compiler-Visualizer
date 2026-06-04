package com.compiler.backend.services;

import com.compiler.backend.models.AssemblyInstruction;
import com.compiler.backend.models.TacInstruction;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CodegenService {

    public List<AssemblyInstruction> generate(List<TacInstruction> tac) {
        List<AssemblyInstruction> assembly = new ArrayList<>();
        
        for (TacInstruction inst : tac) {
            String op = inst.getOp();
            String res = inst.getResult();
            String arg1 = inst.getArg1();
            String arg2 = inst.getArg2();
            
            if (op.equals("=")) {
                assembly.add(new AssemblyInstruction("LOAD", "ACC", arg1, "Load " + arg1 + " into accumulator"));
                assembly.add(new AssemblyInstruction("STORE", res, "ACC", "Store accumulator into " + res));
            } else {
                assembly.add(new AssemblyInstruction("LOAD", "R1", arg1, "Load left operand"));
                assembly.add(new AssemblyInstruction("LOAD", "R2", arg2, "Load right operand"));
                
                String asmOp = "";
                switch (op) {
                    case "+": asmOp = "ADD"; break;
                    case "-": asmOp = "SUB"; break;
                    case "*": asmOp = "MUL"; break;
                    case "/": asmOp = "DIV"; break;
                    case "%": asmOp = "MOD"; break;
                }
                
                assembly.add(new AssemblyInstruction(asmOp, "ACC", "R1", "R2", "Perform " + op));
                assembly.add(new AssemblyInstruction("STORE", res, "ACC", "Store result"));
            }
        }
        
        assembly.add(new AssemblyInstruction("HALT", null, null, "End of program"));
        return assembly;
    }
}
