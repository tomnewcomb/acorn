/* 3D illustration of a retained region, separate from the original cutting path. */
const PrismView=(()=>{
 const EPS=1e-8;
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const area=p=>p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1]},0)/2;
 function outline(shape,kerf=0){
  if(![0,.5,1,1.5,2,2.5,3].includes(kerf))throw Error('Unsupported illustrative cut width');
  const data=kerf===0?wirePrisms[shape.name]:wireKerfs[String(kerf)]?.[shape.name];
  if(!Object.hasOwn(wirePrisms,shape.name)||!data)return null;
  return {polygon:data.regions[0].outer,regions:data.regions,triangles:data.triangles,area:data.area,pieces:data.pieces,openings:data.openings,kerf};
 }
 function triangulate(polygon){
  const remaining=polygon.map((_,i)=>i),triangles=[];
  const inside=(p,a,b,c)=>cross(a,b,p)>=-EPS&&cross(b,c,p)>=-EPS&&cross(c,a,p)>=-EPS;
  while(remaining.length>3){let clipped=false;
   for(let i=0;i<remaining.length;i++){
    const a=remaining[(i+remaining.length-1)%remaining.length],b=remaining[i],c=remaining[(i+1)%remaining.length];
    if(cross(polygon[a],polygon[b],polygon[c])<=EPS)continue;
    if(remaining.some(k=>k!==a&&k!==b&&k!==c&&inside(polygon[k],polygon[a],polygon[b],polygon[c])))continue;
    triangles.push([a,b,c]);remaining.splice(i,1);clipped=true;break;
   }
   if(!clipped)throw Error('The retained outline could not be triangulated');
  }
  triangles.push([...remaining]);return triangles;
 }
 function mesh(shape,depth,kerf=0){
  if(!Number.isFinite(depth)||depth<10||depth>300)throw Error('Depth outside 10–300 mm');
  const region=outline(shape,kerf);if(!region)return null;
  const all=region.regions.flatMap(r=>r.outer);
  const minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
  const center=[(minX+maxX)/2,(minY+maxY)/2],radius=Math.hypot((maxX-minX)/2,(maxY-minY)/2,depth/2);
  const project=([x,y],side)=>[(x-center[0])/radius,(y-center[1])/radius,side*depth/2/radius];
  const faces=[],positions=[],normals=[];
  function face(vertices,normal){faces.push({vertices,normal});for(let i=1;i<vertices.length-1;i++){for(const v of [vertices[0],vertices[i],vertices[i+1]]){positions.push(...v);normals.push(...normal)}}}
  for(const [a,b,c]of region.triangles){face([project(a,1),project(b,1),project(c,1)],[0,0,1]);face([project(c,-1),project(b,-1),project(a,-1)],[0,0,-1])}
  for(const component of region.regions){
   // Outer rings are counterclockwise, openings clockwise. Both get outward walls.
   for(const ring of [component.outer,...component.holes])for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length<=EPS)continue;
    face([project(a,-1),project(b,-1),project(b,1),project(a,1)],[dy/length,-dx/length,0]);
   }
  }
  return {positions:new Float32Array(positions),normals:new Float32Array(normals),faces,polygon:region.polygon,regions:region.regions,area:region.area,pieces:region.pieces,openings:region.openings,kerf,width:maxX-minX,height:maxY-minY,depth,radius};
 }
 function render(){return `<section class="prism-section"><div class="section-head"><div><h3>3D shape</h3><p>The selected outline extruded through an illustrative block depth. Both ends of the wire follow the same path.</p></div></div><div class="prism-layout"><div class="prism-stage"><canvas id="prism-canvas" width="1000" height="620" tabindex="0" role="img" aria-label="Rotatable 3D shape. Drag to rotate, use arrow keys to turn, plus or minus to zoom, and Home to reset."></canvas><div id="prism-unavailable" class="prism-unavailable" hidden><p>A retained region could not be found for this file. The complete 2D path is still available above.</p><button type="button" class="button secondary" id="prism-choose-car">Show CAR</button></div><span class="prism-hint" id="prism-hint">Drag to rotate · scroll to zoom</span></div><div class="prism-controls"><p id="prism-name" class="eyebrow">CAR</p><label for="prism-depth">Illustrative block depth <output id="prism-depth-value">80 mm</output><input type="range" id="prism-depth" min="10" max="300" step="5" value="80"></label><label for="prism-kerf">Illustrative cut width <output id="prism-kerf-value">2.0 mm</output><input type="range" id="prism-kerf" min="0" max="3" step="0.5" value="2"></label><label class="prism-auto"><input type="checkbox" id="prism-auto" checked> Rotate slowly</label><div class="prism-buttons"><button type="button" class="button secondary" id="prism-reset">Reset view</button><button type="button" class="button secondary" id="prism-zoom-in" aria-label="Zoom in on 3D shape">+</button><button type="button" class="button secondary" id="prism-zoom-out" aria-label="Zoom out of 3D shape">−</button></div><p id="prism-dimensions" class="micro"></p><p class="micro">DEPTH AND EFFECTIVE CUT WIDTH ARE NOT RECORDED. BOTH SLIDERS ARE ILLUSTRATIVE.</p><p id="prism-status" class="micro" role="status" aria-live="polite"></p></div></div><details class="shape-notes"><summary>Which part of the path forms this solid?</summary><p>The solid uses closed regions bounded by the saved cuts. The complete saved path is swept with the selected cut width and subtracted from the retained material before extrusion. This leaves real gaps through the full block depth wherever an approach or connecting cut crosses the piece, including the slit into the O. Cuts lying entirely outside the retained pieces do not add material. CAR and CAR1 close where the entry and exit paths cross near the left wheel.</p><p>Hello is shown as five separate letters in their saved positions, with an opening through the O. Its explicit letter loops are used so a connecting cut does not fill the gap below the H. HOUSE has five window openings and an open doorway. The connected lettering in the other files remains connected.</p><p>The effective cut width (kerf) represents material removed by the wire, including any melting allowance. Its actual value is unknown; 2.0 mm is a visible illustrative default. Choose 0 for the earlier zero-width comparison. The original path coordinates remain unchanged. This model uses a constant-width cut and does not reproduce temperature-dependent melting, surface finish or the surrounding waste block. The light material is only an illustration of polystyrene.</p></details></section>`}
 function rotate(v,yaw,pitch){const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),x=cy*v[0]+sy*v[2],z=-sy*v[0]+cy*v[2];return [x,cp*v[1]-sp*z,sp*v[1]+cp*z]}
 function renderer(canvas){
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true});
  if(gl){
   const vertex=`attribute vec3 position;attribute vec3 normal;uniform float yaw;uniform float pitch;uniform float aspect;uniform float zoom;varying vec3 surfaceNormal;varying vec3 localPosition;vec3 turn(vec3 v){float c=cos(yaw),s=sin(yaw);vec3 a=vec3(c*v.x+s*v.z,v.y,-s*v.x+c*v.z);c=cos(pitch);s=sin(pitch);return vec3(a.x,c*a.y-s*a.z,s*a.y+c*a.z);}void main(){vec3 p=turn(position);surfaceNormal=turn(normal);localPosition=position;float w=4.0-p.z;gl_Position=vec4(p.x*2.7*zoom/aspect,p.y*2.7*zoom,1.222222*w-2.222222,w);}`;
   const fragment=`precision mediump float;varying vec3 surfaceNormal;varying vec3 localPosition;void main(){vec3 n=normalize(surfaceNormal);float light=0.48+0.52*max(dot(n,normalize(vec3(-0.4,0.7,1.0))),0.0);float grain=fract(sin(dot(floor(localPosition*850.0),vec3(12.9898,78.233,37.719)))*43758.5453);vec3 colour=vec3(0.91,0.92,0.85)*light+(grain-0.5)*0.025;gl_FragColor=vec4(colour,1.0);}`;
   const shader=(type,text)=>{const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('3D shader unavailable');return s};
   const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('3D renderer unavailable');
   gl.useProgram(program);gl.enable(gl.DEPTH_TEST);const buffers=[gl.createBuffer(),gl.createBuffer()];let count=0;
   ['position','normal'].forEach((name,i)=>{const a=gl.getAttribLocation(program,name);gl.bindBuffer(gl.ARRAY_BUFFER,buffers[i]);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0)});
   const uniforms=Object.fromEntries(['yaw','pitch','aspect','zoom'].map(n=>[n,gl.getUniformLocation(program,n)]));
   return {set(model){count=model.positions.length/3;[model.positions,model.normals].forEach((data,i)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffers[i]);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW)})},draw(yaw,pitch,zoom){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.047,.071,.051,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(uniforms.yaw,yaw);gl.uniform1f(uniforms.pitch,pitch);gl.uniform1f(uniforms.aspect,canvas.width/canvas.height);gl.uniform1f(uniforms.zoom,zoom);gl.drawArrays(gl.TRIANGLES,0,count)},dispose(){buffers.forEach(b=>gl.deleteBuffer(b));gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs)}};
  }
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('3D rendering is not supported');let model;
  return {set(m){model=m},draw(yaw,pitch,zoom){ctx.fillStyle='#0c120d';ctx.fillRect(0,0,canvas.width,canvas.height);const faces=model.faces.map(f=>({vertices:f.vertices.map(p=>rotate(p,yaw,pitch)),normal:rotate(f.normal,yaw,pitch)})).sort((a,b)=>a.vertices.reduce((n,p)=>n+p[2],0)/a.vertices.length-b.vertices.reduce((n,p)=>n+p[2],0)/b.vertices.length);for(const f of faces){const light=.48+.52*Math.max(0,(-.4*f.normal[0]+.7*f.normal[1]+f.normal[2])/Math.hypot(.4,.7,1));ctx.fillStyle=`rgb(${Math.round(232*light)},${Math.round(235*light)},${Math.round(217*light)})`;ctx.beginPath();f.vertices.forEach((p,i)=>{const k=canvas.height*1.35*zoom/(4-p[2]),x=canvas.width/2+p[0]*k,y=canvas.height/2-p[1]*k;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fill()}},dispose(){}};
 }
 function init(root){
  const q=s=>root.querySelector(s),canvas=q('#prism-canvas'),depth=q('#prism-depth'),kerf=q('#prism-kerf'),auto=q('#prism-auto');
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;auto.checked=!reduced;
  let drawEngine=null,current=null,model=null,yaw=-.45,pitch=-.24,zoom=1,frame=null,last=null,disposed=false,drag=null;
  const listeners=[];const on=(target,name,fn,options)=>{target.addEventListener(name,fn,options);listeners.push(()=>target.removeEventListener(name,fn,options))};
  function halt(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null}
  function paint(){if(!model||!drawEngine)return;const box=canvas.getBoundingClientRect(),ratio=Math.min(2,typeof devicePixelRatio==='number'?devicePixelRatio:1),w=Math.max(1,Math.round((box.width||600)*ratio)),h=Math.max(1,Math.round((box.height||372)*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}drawEngine.draw(yaw,pitch,zoom)}
  function animate(t){frame=null;if(disposed||!model||!auto.checked||drag||document.hidden){last=null;return}if(last!==null)yaw+=Math.min(100,t-last)*.00012;last=t;paint();frame=requestAnimationFrame(animate)}
  function schedule(){halt();if(!disposed&&model&&auto.checked&&!drag&&!document.hidden)frame=requestAnimationFrame(animate)}
  function setShape(shape){halt();current=shape;model=null;const supported=Object.hasOwn(wirePrisms,shape.name);q('#prism-unavailable').hidden=supported;canvas.hidden=!supported;q('#prism-hint').hidden=!supported;q('#prism-name').textContent=shape.name;for(const selector of ['#prism-depth','#prism-kerf','#prism-auto','#prism-reset','#prism-zoom-in','#prism-zoom-out'])q(selector).disabled=!supported;
   if(!supported){q('#prism-dimensions').textContent='';q('#prism-status').textContent='No retained region available for this path.';return}
   try{if(!drawEngine)drawEngine=renderer(canvas);model=mesh(shape,Number(depth.value),Number(kerf.value));drawEngine.set(model);q('#prism-depth-value').textContent=depth.value+' mm';q('#prism-kerf-value').textContent=Number(kerf.value).toFixed(1)+' mm';q('#prism-dimensions').textContent=`${model.width.toFixed(1)} × ${model.height.toFixed(1)} mm solid · ${depth.value} mm depth · ${Number(kerf.value).toFixed(1)} mm cut width · ${model.pieces} ${model.pieces===1?'piece':'pieces'} · ${model.openings} ${model.openings===1?'opening':'openings'}`;canvas.setAttribute('aria-label','Rotatable 3D '+shape.name+' shape. Drag to rotate; arrow keys turn; plus and minus zoom; Home resets.');q('#prism-status').textContent='Illustrative solid from '+shape.name;paint();schedule()}catch{q('#prism-status').textContent='The 3D preview could not be rendered in this browser. The 2D path remains available.';model=null}
  }
  on(depth,'input',()=>{if(current)setShape(current)});on(kerf,'input',()=>{if(current)setShape(current)});on(auto,'change',schedule);
  const reset=()=>{yaw=-.45;pitch=-.24;zoom=1;paint();schedule()};on(q('#prism-reset'),'click',reset);
  const scale=factor=>{zoom=Math.max(.45,Math.min(2.5,zoom*factor));paint()};on(q('#prism-zoom-in'),'click',()=>scale(1.12));on(q('#prism-zoom-out'),'click',()=>scale(1/1.12));
  on(q('#prism-choose-car'),'click',()=>{const select=q('#shape-select');select.value='CAR';select.onchange()});
  on(canvas,'pointerdown',event=>{if(!model||drag)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture?.(event.pointerId);halt()});
  on(canvas,'pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;yaw+=(event.clientX-drag.x)*.009;pitch=Math.max(-1.35,Math.min(1.35,pitch+(event.clientY-drag.y)*.009));drag.x=event.clientX;drag.y=event.clientY;paint()});
  const release=event=>{if(drag?.id!==event.pointerId)return;drag=null;schedule()};on(canvas,'pointerup',release);on(canvas,'pointercancel',release);on(canvas,'lostpointercapture',release);
  on(canvas,'wheel',event=>{if(!model)return;event.preventDefault();scale(Math.exp(-Math.max(-100,Math.min(100,event.deltaY))*.002))},{passive:false});
  on(canvas,'keydown',event=>{if(!model)return;let handled=true;switch(event.key){case'ArrowLeft':yaw-=.12;break;case'ArrowRight':yaw+=.12;break;case'ArrowUp':pitch=Math.max(-1.35,pitch-.12);break;case'ArrowDown':pitch=Math.min(1.35,pitch+.12);break;case'+':case'=':scale(1.12);break;case'-':scale(1/1.12);break;case'Home':reset();break;case' ':auto.checked=!auto.checked;schedule();break;default:handled=false}if(handled){event.preventDefault();paint()}});
  on(document,'visibilitychange',()=>document.hidden?halt():schedule());
  let observer;if(typeof ResizeObserver==='function'){observer=new ResizeObserver(paint);observer.observe(canvas)}else if(typeof window!=='undefined')on(window,'resize',paint);
  on(canvas,'webglcontextlost',event=>{event.preventDefault();halt();q('#prism-status').textContent='3D rendering paused. Reopen the demo to restore it.';model=null});
  return {setShape,dispose(){disposed=true;halt();listeners.forEach(remove=>remove());observer?.disconnect();drawEngine?.dispose()}};
 }
 return {outline,triangulate,mesh,render,init,rotate,area};
})();
