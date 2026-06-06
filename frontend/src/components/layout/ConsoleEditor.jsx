import { useEffect, useRef, useState } from 'react';

export default function ConsoleEditor({ code, setCode, highlight, onCaretChange, onClickPosition, scannerIndex }){
  const taRef = useRef(null);
  const preRef = useRef(null);
  const gutterRef = useRef(null);
  const shellRef = useRef(null);
  const [lineHeightPx, setLineHeightPx] = useState(20);

  // initialize editor metrics to avoid offsets
  useEffect(()=>{
    const ta = taRef.current;
    if(!ta) return;
    // compute line-height from computed style (fallback to 20)
    const cs = getComputedStyle(ta);
    const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize||'14') * 1.6) || 20;
    setLineHeightPx(lh);
    // set CSS variables on shell for consistent styling
    if(shellRef.current){
      shellRef.current.style.setProperty('--editor-line-height', `${lh}px`);
      shellRef.current.style.setProperty('--editor-font-size', cs.fontSize || '14px');
    }
  }, []);

  // sync overlay/pre and gutter scroll with textarea
  useEffect(()=>{
    const ta = taRef.current;
    const pre = preRef.current;
    const gutter = gutterRef.current;
    if(!ta || !pre || !gutter) return;
    const onScroll = ()=>{
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
      gutter.scrollTop = ta.scrollTop;
    };
    ta.addEventListener('scroll', onScroll);
    return ()=> ta.removeEventListener('scroll', onScroll);
  }, []);

  // caret change handler
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
    ta.addEventListener('select', handler);
    return ()=>{
      ta.removeEventListener('keyup', handler);
      ta.removeEventListener('click', handler);
      ta.removeEventListener('input', handler);
      ta.removeEventListener('select', handler);
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

  // render highlighted HTML; escape and insert scanner marker
  const renderHighlighted = ()=>{
    if(code == null) return '';
    const lines = code.split('\n');
    return lines.map((ln, idx)=>{
      const lnNo = idx+1;
      let isActive = highlight && highlight.line === lnNo;
      let lineClassSuffix = isActive ? ' active-line' : '';
      
      let content = ln.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      
      if (highlight && highlight.varName) {
        const escapedVarName = highlight.varName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedVarName}\\b`, 'g');
        const eventOnLine = highlight.events && highlight.events.find(e => e.line === lnNo);
        
        let tokenClassSuffix = '';
        if (eventOnLine) {
          lineClassSuffix = ` active-line-${eventOnLine.type.toLowerCase()}`;
          tokenClassSuffix = ` highlight-var-token-${eventOnLine.type.toLowerCase()}`;
        } else {
          tokenClassSuffix = '';
        }
        content = content.replace(regex, `<span class="highlight-var-token${tokenClassSuffix}">${highlight.varName}</span>`);
      }

      if(typeof scannerIndex === 'number'){
        const startOfLine = lines.slice(0, idx).join('\n').length + (idx>0?1:0);
        const rel = scannerIndex - startOfLine;
        if(rel >= 0 && rel <= ln.length){
          const before = content.substring(0, rel);
          const ch = content.substring(rel, rel+1) || '';
          const after = content.substring(rel+1);
          content = `${before}<span class="scanner-cursor">${ch || ' '}</span>${after}`;
        }
      }
      return `<div class="editor-line${lineClassSuffix}" data-line="${lnNo}" style="height:var(--editor-line-height);">${content||' '}</div>`;
    }).join('');
  };

  // generate gutter lines
  const gutterLines = ()=>{
    const lines = (code||'').split('\n');
    return lines.map((_,i)=> (
      <div key={i} className="gutter-line" style={{height: `var(--editor-line-height)`}}>{i+1}</div>
    ));
  };

  return (
    <div ref={shellRef} className="editor-shell" style={{['--editor-line-height']: `${lineHeightPx}px`}}>
      <div ref={gutterRef} className="editor-gutter" aria-hidden>
        {gutterLines()}
      </div>
      <div className="editor-main">
        <pre ref={preRef} className="editor-highlight" dangerouslySetInnerHTML={{ __html: renderHighlighted() }} />
        <textarea
          ref={taRef}
          className="editor-textarea enhanced"
          value={code}
          onChange={(e)=>{ setCode(e.target.value); }}
          onClick={handleClick}
        />
      </div>
    </div>
  );
}
