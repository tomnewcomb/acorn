const ShapeDemo=(()=>{
 const stepsPerMM=32.072727777;
 const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 function makePath(shape){
  const targets=shape.points.map(p=>p.map(v=>Math.floor(v*stepsPerMM+.5)));
  let total=0;
  const segments=targets.slice(1).map((to,i)=>{const from=targets[i],dx=to[0]-from[0],dy=to[1]-from[1],count=Math.max(Math.abs(dx),Math.abs(dy)),start=total;total+=count;return {from,to,dx,dy,count,start,end:total,index:i}});
  return {shape,targets,segments,total};
 }
 function stateAt(path,tick){
  tick=Math.max(0,Math.min(path.total,Math.floor(tick)));
  const segment=path.segments.find(s=>tick<s.end)||path.segments.at(-1);
  if(!segment)return {tick,segment:0,step:0,position:path.targets[0]||[0,0]};
  const n=Math.min(segment.count,Math.max(0,tick-segment.start)),ax=Math.abs(segment.dx),ay=Math.abs(segment.dy);
  const minor=ax>ay?ay:ax;
  const small=segment.count?Math.floor(minor+n*minor/segment.count+.5)-minor:0;
  return {tick,segment:segment.index,step:n,position:[segment.from[0]+Math.sign(segment.dx)*(ax>ay?n:small),segment.from[1]+Math.sign(segment.dy)*(ax>ay?small:n)]};
 }
 function render(){return `<div class="shape-demo"><div class="section-head"><div><h2>Original shape files</h2><p>Choose a saved shape and play its path from the origin. The points are decoded from the original Shapes directory.</p></div></div><div class="shape-layout"><div class="shape-chart"><svg id="shape-svg" viewBox="0 0 900 490" role="img" aria-label="Original shape path, with its current playback position"><title>Wire Cutter saved shape</title></svg><div class="shape-key"><span>◯ Saved points</span><span class="shape-key-played">— Path travelled</span><span class="shape-key-head">● Current position</span></div><label class="shape-progress-label" for="shape-progress">Path progress <output id="shape-percent">0%</output></label><input id="shape-progress" class="shape-progress" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek along the shape path"></div><div class="shape-controls"><label for="shape-select">Saved shape<select id="shape-select">${wireShapes.map(s=>`<option value="${esc(s.name)}">${esc(s.name)} · ${s.points.length} points</option>`).join('')}</select></label><div class="shape-buttons"><button class="button" id="shape-play" type="button">Play path</button><button class="button secondary" id="shape-replay" type="button">Replay ↻</button></div><div class="shape-options"><label for="shape-speed">Animation speed<select id="shape-speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></label><label for="shape-view">View<select id="shape-view"><option value="fit">Fit shape</option><option value="bed">Full 600 × 250 mm area</option></select></label></div><label class="shape-checkbox"><input id="shape-nodes" type="checkbox" checked> Show saved points</label><dl class="shape-readout"><dt>Segment</dt><dd id="shape-segment">—</dd><dt>Position (mm)</dt><dd id="shape-position">0.00, 0.00</dd><dt>Motor steps X / Y</dt><dd id="shape-steps">0 / 0</dd><dt>Saved shape</dt><dd id="shape-info">—</dd></dl><p id="shape-state" class="micro" role="status" aria-live="polite">Ready to play</p><a id="shape-download" class="text-link" download>Download original shape ↓</a><p class="micro">ANIMATION SPEED IS FOR VIEWING, NOT THE MACHINE’S ORIGINAL CUTTING SPEED.</p></div></div>${PrismView.render()}<details class="shape-notes"><summary>How this playback relates to the original</summary><p>The original files contain a WIRE header followed by BBC BASIC numeric coordinate records. Each point is retained in file order, including repeated points and the approach from (0, 0). No curve fitting, smoothing or automatic closing segment is added.</p><p>As in PROC cut, target coordinates are rounded to motor steps using 32.072727777 steps per millimetre. Movement along each segment uses the major-axis stepping and rounded minor-axis position from PROC movewire. Small individual steps are not visible at this scale; the existing motor-step demonstration below shows them separately.</p><p>This is a JavaScript visualisation of the stored path and stepping logic. It does not control hardware, reproduce homing or heating, or emulate the original timing. Distances and axes are in millimetres.</p></details></div>`}
 function init(root){
  const q=s=>root.querySelector(s),svg=q('#shape-svg'),select=q('#shape-select'),play=q('#shape-play'),progress=q('#shape-progress');
  let path=makePath(wireShapes[0]),tick=0,playing=false,speed=1,last=null,frame=null,disposed=false,project;
  const prism=PrismView.init(root);
  const ns='http://www.w3.org/2000/svg';
  function element(tag,attrs,parent=svg){const node=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);parent.appendChild(node);return node}
  let travelled,head,target,nodes;
  function staticDrawing(){
   svg.replaceChildren();svg.setAttribute('aria-label',path.shape.name+' original cutting path and current position');const pts=path.shape.points;
   const bed=q('#shape-view').value==='bed';const maxX=bed?600:Math.max(1,...pts.map(p=>p[0])),maxY=bed?250:Math.max(1,...pts.map(p=>p[1]));
   const scale=Math.min(780/(maxX*1.08),370/(maxY*1.12)),x0=65,y0=430;
   project=p=>[x0+p[0]*scale,y0-p[1]*scale];
   const maxWorldX=780/scale,maxWorldY=370/scale;
   const spacing=bed?50:maxWorldX>400?50:maxWorldX>180?25:maxWorldX>80?10:5;
   element('rect',{x:0,y:0,width:900,height:490,fill:'#0c130d'});
   for(let x=0;x<=maxWorldX;x+=spacing){const [px]=project([x,0]);element('line',{x1:px,y1:45,x2:px,y2:y0,stroke:'#273321','stroke-width':1});element('text',{x:px,y:454,'text-anchor':'middle',fill:'#9aa98d','font-size':12,'font-family':'monospace'}).textContent=String(x)}
   for(let y=0;y<=maxWorldY;y+=spacing){const [,py]=project([0,y]);element('line',{x1:x0,y1:py,x2:850,y2:py,stroke:'#273321','stroke-width':1});element('text',{x:52,y:py+4,'text-anchor':'end',fill:'#9aa98d','font-size':12,'font-family':'monospace'}).textContent=String(y)}
   element('text',{x:850,y:478,'text-anchor':'end',fill:'#9aa98d','font-size':12,'font-family':'monospace'}).textContent='X / mm';
   element('text',{x:20,y:26,fill:'#9aa98d','font-size':12,'font-family':'monospace'}).textContent='Y / mm';
   element('text',{x:850,y:26,'text-anchor':'end',fill:'#c0d3aa','font-size':13,'font-family':'monospace'}).textContent=path.shape.name;
   if(bed){const [bx,by]=project([0,250]);element('rect',{x:bx,y:by,width:600*scale,height:250*scale,fill:'none',stroke:'#66745c','stroke-width':1.5,'stroke-dasharray':'5 5'})}
   const d=pts.map((p,i)=>(i?'L':'M')+project(p).join(',')).join(' ');
   element('path',{d,fill:'none',stroke:'#66745c','stroke-width':1.8});
   travelled=element('path',{fill:'none',stroke:'#b5d983','stroke-width':2.8,'stroke-linejoin':'round'});
   nodes=element('g',{});pts.forEach(p=>{const [cx,cy]=project(p);element('circle',{cx,cy,r:2.5,fill:'#0c130d',stroke:'#a1b492','stroke-width':1},nodes)});
   target=element('circle',{r:6,fill:'none',stroke:'#c3d7ac','stroke-width':1.5});
   head=element('circle',{r:5,fill:'#efc777',stroke:'#0c130d','stroke-width':1.5});
   const [ox,oy]=project([0,0]);element('text',{x:ox+8,y:oy-10,fill:'#c4b78c','font-size':11,'font-family':'monospace'}).textContent='origin';
   draw();
  }
  function draw(){
   const state=stateAt(path,tick),position=state.position.map(v=>v/stepsPerMM);
   const points=path.targets.slice(0,state.segment+1).map(p=>p.map(v=>v/stepsPerMM));points.push(position);
   travelled.setAttribute('d',points.map((p,i)=>(i?'L':'M')+project(p).join(',')).join(' '));
   const [cx,cy]=project(position);head.setAttribute('cx',cx);head.setAttribute('cy',cy);
   const destination=path.shape.points[Math.min(state.segment+1,path.shape.points.length-1)];const [tx,ty]=project(destination);target.setAttribute('cx',tx);target.setAttribute('cy',ty);
   nodes.setAttribute('visibility',q('#shape-nodes').checked?'visible':'hidden');
   const proportion=path.total?state.tick/path.total:1;progress.value=String(Math.round(proportion*1000));q('#shape-percent').textContent=(proportion*100).toFixed(0)+'%';
   q('#shape-segment').textContent=`${state.segment+1} / ${path.segments.length}`;
   q('#shape-position').textContent=`${position[0].toFixed(2)}, ${position[1].toFixed(2)}`;
   q('#shape-steps').textContent=`${state.position[0].toLocaleString('en-GB')} / ${state.position[1].toLocaleString('en-GB')}`;
  }
  function stop(message){playing=false;last=null;play.textContent=tick>=path.total?'Play again':'Play path';if(message)q('#shape-state').textContent=message;if(frame!==null){cancelAnimationFrame(frame);frame=null}}
  function advance(time){if(disposed||!playing)return;if(last!==null)tick=Math.min(path.total,tick+Math.max(0,Math.min(100,time-last))/1000*80*stepsPerMM*speed);last=time;draw();if(tick>=path.total){stop('Path complete');return}frame=requestAnimationFrame(advance)}
  function start(){if(tick>=path.total)tick=0;playing=true;last=null;play.textContent='Pause';q('#shape-state').textContent='Playing '+path.shape.name;frame=requestAnimationFrame(advance)}
  function choose(){stop();path=makePath(wireShapes.find(s=>s.name===select.value)||wireShapes[0]);tick=0;q('#shape-info').textContent=`${path.shape.points.length} points · ${path.shape.bytes.toLocaleString('en-GB')} bytes`;const link=q('#shape-download');link.href='shapes/originals/'+encodeURIComponent(path.shape.filename);link.download=path.shape.filename;play.textContent='Play path';q('#shape-state').textContent='Ready to play '+path.shape.name;staticDrawing();prism.setShape(path.shape)}
  select.onchange=choose;play.onclick=()=>playing?stop('Paused'):start();q('#shape-replay').onclick=()=>{stop();tick=0;draw();start()};
  progress.oninput=()=>{stop('Paused at selected position');tick=Number(progress.value)/1000*path.total;draw()};
  q('#shape-speed').onchange=()=>{speed=Number(q('#shape-speed').value)};q('#shape-view').onchange=staticDrawing;q('#shape-nodes').onchange=draw;
  const hide=()=>{if(document.hidden&&playing)stop('Paused while page is hidden')};document.addEventListener('visibilitychange',hide);
  choose();return ()=>{disposed=true;stop();prism.dispose();document.removeEventListener('visibilitychange',hide)};
 }
 return {render,init,makePath,stateAt,stepsPerMM};
})();
