const svg = document.getElementById("svg");
const statusEl = document.getElementById("status");
const baseY = 560;
const marginX = 160;

function v(id){ return +document.getElementById(id).value; }
function set(id,val){ document.getElementById(id).value = val; }

function line(x1,y1,x2,y2,color="#333",w=2,dash=false){
  const l=document.createElementNS("http://www.w3.org/2000/svg","line");
  l.setAttribute("x1",x1); l.setAttribute("y1",y1);
  l.setAttribute("x2",x2); l.setAttribute("y2",y2);
  l.setAttribute("stroke",color);
  l.setAttribute("stroke-width",w);
  if(dash) l.setAttribute("stroke-dasharray","6,6");
  svg.appendChild(l);
}

function text(t,x,y,a="middle"){
  const el=document.createElementNS("http://www.w3.org/2000/svg","text");
  el.setAttribute("x",x);
  el.setAttribute("y",y);
  el.setAttribute("font-size","12");
  el.setAttribute("text-anchor",a);
  el.textContent=t;
  svg.appendChild(el);
}

function dimH(x1,x2,y,t){
  line(x1,y,x2,y,"#555",1);
  line(x1,y-6,x1,y+6,"#555",1);
  line(x2,y-6,x2,y+6,"#555",1);
  text(t,(x1+x2)/2,y-8);
}

function dimV(x,y1,y2,t){
  line(x,y1,x,y2,"#555",1);
  line(x-6,y1,x+6,y1,"#555",1);
  line(x-6,y2,x+6,y2,"#555",1);
  text(t,x-10,(y1+y2)/2+4,"end");
}

function draw(){
  svg.innerHTML="";
  statusEl.textContent="";

  const mode = document.querySelector('input[name="mode"]:checked').value;

  let H = v("H");
  let L = v("L");

  let Lf=v("Lf"), Lb=v("Lb");
  let hf=v("hf"), hb=v("hb");
  let Sf=v("Sf")/100, Sb=v("Sb")/100;
  let Sm=v("Sm")/100;

  let hm, Lm;

  if(mode==="mode1"){
    hf = Lf * Sf;
    hb = Lb * Sb;
    hm = H - hf - hb;
    if(hm<=0){ statusEl.textContent="❌ 완화구간 높이 합 초과"; return; }
    Lm = hm / Sm;
    L = Lf + Lm + Lb;
    set("hf",hf.toFixed(0));
    set("hb",hb.toFixed(0));
    set("L",L.toFixed(0));
  }

  if(mode==="mode2"){
    if(Lf+Lb>=L){ statusEl.textContent="❌ 완화구간 길이 초과"; return; }
    hm = H - hf - hb;
    Lm = L - Lf - Lb;
    if(hm<=0||Lm<=0){ statusEl.textContent="❌ 조건 불가"; return; }
    Sf = hf / Lf;
    Sb = hb / Lb;
    Sm = hm / Lm;
    set("Sf",(Sf*100).toFixed(2));
    set("Sb",(Sb*100).toFixed(2));
    set("Sm",(Sm*100).toFixed(2));
  }

  const scale = (svg.viewBox.baseVal.width - 2*marginX) / L;
  const X=x=>marginX+x*scale;
  const Y=y=>baseY-y*scale;

  const p0={x:0,y:0};
  const p1={x:Lf,y:hf};
  const p2={x:Lf+Lm,y:hf+hm};
  const p3={x:L,y:H};

  // 바닥
  line(0,baseY,svg.viewBox.baseVal.width,baseY,"#ccc");

  // Y축 히든라인 (수평)
  [p1.y,p2.y,p3.y].forEach(y=>{
    line(0,Y(y),svg.viewBox.baseVal.width,Y(y),"#ddd",1,true);
  });

  // X축 히든라인
  line(X(p1.x),baseY,X(p1.x),Y(p1.y),"#aaa",1,true);
  line(X(p2.x),baseY,X(p2.x),Y(p2.y),"#aaa",1,true);

  // 경사로
  line(X(p0.x),Y(p0.y),X(p1.x),Y(p1.y),"#4A90E2",3);
  line(X(p1.x),Y(p1.y),X(p2.x),Y(p2.y),Sm>0.17?"red":"#333",3);
  line(X(p2.x),Y(p2.y),X(p3.x),Y(p3.y),"#7ED321",3);

  // 길이 치수
  dimH(X(p0.x),X(p1.x),baseY+40,`Lf ${(Lf/1000).toFixed(2)} m`);
  dimH(X(p1.x),X(p2.x),baseY+40,`Lm ${(Lm/1000).toFixed(2)} m`);
  dimH(X(p2.x),X(p3.x),baseY+40,`Lb ${(Lb/1000).toFixed(2)} m`);
  dimH(X(p0.x),X(p3.x),baseY+70,`L ${(L/1000).toFixed(2)} m`);

  // 높이 치수 (왼쪽 정렬)
  const vx = marginX-70;
  dimV(vx,baseY,Y(p1.y),`hf ${(hf/1000).toFixed(2)} m`);
  dimV(vx,Y(p1.y),Y(p2.y),`hm ${(hm/1000).toFixed(2)} m`);
  dimV(vx,Y(p2.y),Y(p3.y),`hb ${(hb/1000).toFixed(2)} m`);
  dimV(vx-40,baseY,Y(p3.y),`H ${(H/1000).toFixed(2)} m`);
}

document.querySelectorAll("input").forEach(i=>{
  i.addEventListener("input",draw);
});
draw();
