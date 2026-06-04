
export default function CodegenPhase({ result }) {
  return (
          <table>
            <thead><tr><th>Opcode</th><th>Arg1</th><th>Arg2</th><th>Arg3</th><th>Comment</th></tr></thead>
            <tbody>
              {result.assemblyCode?.map((asm, i) => (
                <tr key={i}>
                  <td className="asm-opcode">{asm.opcode}</td>
                  <td>{asm.arg1}</td>
                  <td>{asm.arg2}</td>
                  <td>{asm.arg3}</td>
                  <td style={{color: 'var(--text-muted)'}}>{asm.comment ? '// ' + asm.comment : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
  );
}
