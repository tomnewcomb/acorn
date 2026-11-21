/* Presentation-only BBC BASIC / ARM lexer. The archival text is never mutated. */
const ArchiveSource = (() => {
  const words = (`ENDWHILE ENDPROC OTHERWISE ENDCASE RECTANGLE COLOUR STRING$ REPEAT RESTORE REPORT$ REPORT RETURN INKEY$ INKEY GET$ GET BGET BPUT OPENOUT OPENIN CLOSE INPUT PRINT LOCAL ERROR ENDIF WHILE UNTIL FALSE TRUE THEN ELSE WHEN CASE IF STEP NEXT FOR TO OF ON DEF PROC FN DIM MODE GCOL CIRCLE FILL MOVE LINE MOUSE OFF WAIT VDU TAB SYS OSCLI CALL OPT EVAL INSTR LEFT$ RIGHT$ MID$ STR$ CHR$ ASC LEN INT ABS SGN VAL EOF ERL ERR NOT AND EOR OR DIV MOD SWAP CLS END`).split(/\s+/).sort((a,b)=>b.length-a.length);
  const wordOperators = new Set(['AND','OR','EOR','DIV','MOD','NOT']);
  const armWords = new Set('STMFD MOV ORR SWI CMP LDMHIFD MUL ADD BHI BLS LDMFD LDR LDRB STRB SUBS BNE TEQP EQUD LSR LSL AND EQUS EQUB ALIGN ADDCC B ADR ORRS STR EOR ANDS ORRNE BIC'.split(' '));
  const prefixContexts = new Set(['(', '[', '{', ',', ';', ':', 'THEN', 'ELSE', 'TO', 'STEP', 'WHEN']);
  const escape = text => text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function tokenize(text, assembly = false) {
    const tokens=[];
    let i=0, expectName=false, previous=null;
    const add=(value,kind)=>{const token={text:value,kind};tokens.push(token);if(kind!=='space')previous=token;i+=value.length;return token};
    while(i<text.length){
      const rest=text.slice(i);
      const whitespace=/^\s+/.exec(rest);
      if(whitespace){add(whitespace[0],'space');continue}
      if(rest[0]==='"'){
        let j=i+1;
        while(j<text.length){if(text[j]==='"'){if(text[j+1]==='"'){j+=2;continue}j++;break}j++}
        add(text.slice(i,j),'string');expectName=false;continue;
      }
      // REM and assembler comments are opaque: never reformat their contents.
      if((!assembly&&rest.startsWith('REM'))||(assembly&&rest[0]===';')){add(rest,'comment');break}
      // A star command consumes the rest of its BASIC line; its arguments are opaque too.
      if(!assembly&&rest[0]==='*'&&(!previous||[':', 'THEN', 'ELSE'].includes(previous.text))){add(rest,'command');break}
      if(expectName){
        const name=/^[A-Za-z_][A-Za-z0-9_]*[%$]?/.exec(rest);
        if(name){add(name[0],'name');expectName=false;continue}expectName=false;
      }
      if(assembly){
        const label=/^\.[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
        if(label){add(label[0],'label');continue}
        const register=/^(?:R(?:1[0-5]|[0-9])|PC|LR|SP)(?![A-Za-z0-9_])/.exec(rest);
        if(register){add(register[0],'register');continue}
        const instruction=/^[A-Z]+/.exec(rest);
        if(instruction&&armWords.has(instruction[0])&&(!previous||previous.kind==='label'||previous.text===':'||['LSR','LSL'].includes(instruction[0]))){add(instruction[0],'instruction');continue}
      }
      const number=/^(?:&[0-9A-Fa-f]+|%[01]+|(?:\d+(?:\.\d*)?|\.\d+)(?:E[+-]?\d+)?)/.exec(rest);
      if(number){add(number[0],'number');continue}
      const keyword=words.find(word=>rest.startsWith(word));
      if(keyword){add(keyword,wordOperators.has(keyword)?'operator-word':'keyword');if(['PROC','FN','CALL'].includes(keyword))expectName=true;continue}
      const name=/^[A-Za-z_][A-Za-z0-9_]*[%$]?/.exec(rest);
      if(name){add(name[0],'identifier');continue}
      const operator=/^(?:<>|<=|>=|\+=|-=|\*=|\/=|<<|>>|[=+*/<>-])/.exec(rest);
      if(operator){
        const unary=['+','-'].includes(operator[0])&&(!previous||['operator','operator-word','unary'].includes(previous.kind)||prefixContexts.has(previous.text));
        add(operator[0],unary?'unary':'operator');continue;
      }
      add(rest[0],rest[0]==='~'?'unary':'punctuation');
    }
    return tokens;
  }

  function needsSpace(left,right){
    if(!left||left.kind==='space'||right.kind==='space')return false;
    if([')',']','}',',',';',':','!','^'].includes(right.text))return false;
    if(['(','[','{','#','.'].includes(left.text)||left.kind==='unary')return false;
    if([',',';',':'].includes(left.text))return true;
    if(right.text==='(')return ['IF','WHILE','UNTIL','CASE'].includes(left.text)||['operator','operator-word'].includes(left.kind);
    if(['operator','operator-word'].includes(left.kind)||['operator','operator-word'].includes(right.kind))return true;
    if(right.kind==='unary')return right.text!=='~'&&left.kind==='keyword';
    if(right.text==='#')return left.kind==='instruction';
    if(right.text==='$')return ['keyword','string','identifier','number'].includes(left.kind);
    if(['[','{'].includes(right.text))return ['keyword','instruction'].includes(left.kind);
    if(left.text==='!'||left.text==='^')return false;
    const readable = new Set(['keyword','instruction','register','number','string','identifier','name','label','comment','command']);
    return (readable.has(left.kind)||[')',']','}'].includes(left.text))&&readable.has(right.kind);
  }

  function formatBody(text,assembly=false){
    const tokens=tokenize(text,assembly);let previous=null,plain='',html='';
    for(const token of tokens){
      const gap=needsSpace(previous,token)?' ':'';plain+=gap+token.text;html+=gap;
      html+=token.kind==='space'?escape(token.text):`<span class="syn-${token.kind}">${escape(token.text)}</span>`;
      previous=token;
    }
    return {plain,html,tokens};
  }

  function formatListing(source){
    const result=new Map();let assembly=false;const blocks=[];
    const depth=()=>blocks.reduce((n,b)=>n+1+(b.type==='CASE'&&b.arm?1:0),0);
    const close=type=>{const at=blocks.map(b=>b.type).lastIndexOf(type);if(at>=0)blocks.splice(at)};
    for(const line of source.split(/\r\n|\n|\r/)){
      const match=/^(\s*)(\d+)([ \t]*)(.*)$/.exec(line);if(!match)continue;
      const [,margin,number,,body]=match;
      const text=body.trimStart();
      const entering=text.startsWith('['),leaving=assembly&&text.startsWith(']');
      if(entering)assembly=true;
      const tokens=tokenize(text,assembly).filter(t=>!['space','comment'].includes(t.kind));
      const first=tokens[0]?.text;
      const definition=!assembly&&first==='DEF'&&['PROC','FN'].includes(tokens[1]?.text);
      if(definition)blocks.length=0;
      const closers={ENDPROC:'PROC',ENDIF:'IF',ENDWHILE:'WHILE',NEXT:'FOR',UNTIL:'REPEAT',ENDCASE:'CASE'};
      let firstClosed=false;
      if(!assembly&&closers[first]){const earlyReturn=first==='ENDPROC'&&!['PROC','FN'].includes(blocks.at(-1)?.type);if(!earlyReturn){close(first==='ENDPROC'&&blocks.at(-1)?.type==='FN'?'FN':closers[first]);firstClosed=true}}
      let level=depth();
      if(!assembly&&first==='ELSE')level=Math.max(0,level-1);
      if(!assembly&&['WHEN','OTHERWISE'].includes(first)){
        const active=blocks.at(-1);if(active?.type==='CASE'){if(active.arm)level--;active.arm=true}
      }
      if(assembly&&!entering&&!leaving&&text&&!text.startsWith('.')&&!text.startsWith(';'))level++;
      const formatted=formatBody(text,assembly);
      const separator=text?' '+'  '.repeat(level):'';
      result.set(Number(number),{plain:margin+number+separator+formatted.plain,html:escape(margin)+`<span class="syn-line-number">${number}</span>`+escape(separator)+formatted.html,assembly,indentLevel:level});
      if(!assembly){
        if(definition)blocks.push({type:tokens[1].text==='PROC'?'PROC':'FN'});
        for(let i=0;i<tokens.length;i++){
          const t=tokens[i];if(t.kind!=='keyword')continue;
          if(t.text==='FOR'||t.text==='WHILE'||t.text==='REPEAT'||t.text==='CASE')blocks.push({type:t.text});
          if(t.text==='IF'){
            // Only an IF whose THEN ends the physical line opens a multiline block.
            const then=tokens.findIndex((v,j)=>j>i&&v.kind==='keyword'&&v.text==='THEN');
            if(then===tokens.length-1&&then>=0)blocks.push({type:'IF'});
          }
          if(closers[t.text]&&!(i===0&&firstClosed)&&t.text!=='ENDPROC'&&t.text!=='ENDIF'&&t.text!=='ENDCASE')close(closers[t.text]);
        }
      }
      if(leaving){assembly=false;for(const t of tokens)if(t.text==='NEXT')close('FOR')}
    }
    return result;
  }
  return {tokenize,formatBody,formatListing};
})();
