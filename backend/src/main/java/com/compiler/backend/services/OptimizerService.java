package com.compiler.backend.services;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.compiler.backend.models.TacInstruction;

@Service
public class OptimizerService {

    public List<TacInstruction> optimize(List<TacInstruction> input) {
        List<TacInstruction> optimized = new ArrayList<>();
        
        for (TacInstruction inst : input) {
            String op = inst.getOp();
            String arg1 = inst.getArg1();
            String arg2 = inst.getArg2();
            
            // Constant folding
            if (isOperator(op) && isNumber(arg1) && isNumber(arg2)) {
                int val1 = Integer.parseInt(arg1);
                int val2 = Integer.parseInt(arg2);
                int folded = switch (op) {
                    case "+" -> val1 + val2;
                    case "-" -> val1 - val2;
                    case "*" -> val1 * val2;
                    case "/" -> val1 / val2;
                    case "%" -> val1 % val2;
                    default -> 0;
                };

                optimized.add(new TacInstruction("=", String.valueOf(folded), null, inst.getResult()));
            } 
            // Algebraic Simplification (e.g. x * 1 -> x)
            else if (op.equals("*") && "1".equals(arg2)) {
                optimized.add(new TacInstruction("=", arg1, null, inst.getResult()));
            } else if (op.equals("*") && "1".equals(arg1)) {
                optimized.add(new TacInstruction("=", arg2, null, inst.getResult()));
            } else if (op.equals("+") && "0".equals(arg2)) {
                optimized.add(new TacInstruction("=", arg1, null, inst.getResult()));
            } else if (op.equals("+") && "0".equals(arg1)) {
                optimized.add(new TacInstruction("=", arg2, null, inst.getResult()));
            }
            else {
                // No optimization found
                optimized.add(inst);
            }
        }
        
        return optimized;
    }
    
    private boolean isOperator(String op) {
        return op.equals("+") || op.equals("-") || op.equals("*") || op.equals("/") || op.equals("%");
    }
    
    private boolean isNumber(String str) {
        if (str == null) return false;
        try {
            Integer.parseInt(str);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
