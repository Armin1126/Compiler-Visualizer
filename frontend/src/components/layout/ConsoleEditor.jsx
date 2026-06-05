import { useEffect, useRef } from 'react';

export default function ConsoleEditor({ code, setCode, highlight, onCaretChange, onClickPosition, scannerIndex }){
  const taRef = useRef(null);

  useEffect(()=>{
    const ta = taRef.current;
    if(!ta) return;
    const handler = ()=>{
      const pos = ta.selectionStart;
      const before = ta.value.substring(0, pos);
      const lines = before.split('\n');
      const line = lines.length;
      const column = lines[lines.length-1].length + 1;
      onCaretChange && onCaretChange({ line, column, pos });
    };
    ta.addEventListener('keyup', handler);
    ta.addEventListener('click', handler);
    ta.addEventListener('input', handler);
    return ()=>{
      ta.removeEventListener('keyup', handler);
      ta.removeEventListener('click', handler);
      ta.removeEventListener('input', handler);
    };
  }, [onCaretChange]);

  const handleClick = ()=>{
    const ta = taRef.current;
    if(!ta) return;
    const pos = ta.selectionStart;
    const before = ta.value.substring(0, pos);
    const lines = before.split('\n');
    const line = lines.length;
    const column = lines[lines.length-1].length + 1;
    onClickPosition && onClickPosition({ line, column, pos });
  };

  // render highlighted code with active-line and scanner cursor
  const renderHighlighted = ()=>{
    if(!code) return '';
    const lines = code.split('\n');
    const html = lines.map((ln, idx)=>{
      const lnNo = idx+1;
      const isActive = highlight && highlight.line === lnNo;
      let content = ln.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      // if scannerIndex falls on this line, insert a marker span
      if(typeof scannerIndex === 'number'){
        // compute char index range for this line
        const startOfLine = lines.slice(0, idx).join('\n').length + (idx>0?1:0);
        const rel = scannerIndex - startOfLine;
        if(rel >= 0 && rel <= ln.length){
          const before = content.substring(0, rel);
          const ch = content.substring(rel, rel+1) || '';
          const after = content.substring(rel+1);
          content = `${before}<span class="scanner-cursor">${ch || ' '}</span>${after}`;
        }
      }
      return `<div class="editor-line ${isActive? 'active-line':''}" data-line="${lnNo}"><span class="code">${content}</span></div>`;
    }).join('\n');
    return html;
  };

  return (
    <div className="editor-shell">
      <div className="editor-gutter" aria-hidden>
        {code.split('\n').map((_,i)=>(
          <div key={i} className="gutter-line">{i+1}</div>
        ))}
      </div>
      <div className="editor-main">
        <pre className="editor-highlight" dangerouslySetInnerHTML={{ __html: renderHighlighted() }} />
        <textarea ref={taRef} className="editor-textarea enhanced" value={code} onChange={(e)=>{ setCode(e.target.value); }} onClick={handleClick} />
      </div>
    </div>
  );
}
