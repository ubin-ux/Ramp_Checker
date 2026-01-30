const svg = document.getElementById("svg");
const statusEl = document.getElementById("status");
const baseY = 600;
const marginX = 100;

// 모드 2 데이터 저장소
let midSegments = []; 

function v(id){ return +document.getElementById(id).value || 0; }
function set(id,val){ document.getElementById(id).value = val; }

// --- 이벤트 리스너 ---
document.getElementById('controls-panel').addEventListener('input', function(e) {
  const target = e.target;
  
  if(target.tagName === 'INPUT') {
    if(target.dataset.index !== undefined) {
      const idx = target.dataset.index;
      const key = target.dataset.key;
      midSegments[idx][key] = +target.value;
      updateSegmentUI(idx);
    }
    draw();
  }
  
  if(target.name === 'mode') {
    toggleMode();
  }
});

document.getElementById('btn-add').addEventListener('click', addSegment);

// --- 모드 전환 및 입력창 제어 (핵심 변경 부분) ---
function toggleMode() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const m1 = document.getElementById("mode1-mid");
  const m2 = document.getElementById("mode2-mid");
  const L_input = document.getElementById("L");
  
  // 완화구간 입력 필드들
  const hf = document.getElementById("hf");
  const hb = document.getElementById("hb");
  const Sf = document.getElementById("Sf");
  const Sb = document.getElementById("Sb");

  if (mode === "mode1") {
    // [모드 1] 길이 & 구배 입력 -> 높이 자동계산
    m1.style.display = "block";
    m2.style.display = "none";
    L_input.readOnly = true; 
    L_input.classList.add("readonly-input");

    // 구배(Sf, Sb)는 입력 가능
    Sf.readOnly = false;
    Sb.readOnly = false;
    Sf.classList.remove("readonly-input");
    Sb.classList.remove("readonly-input");

    // 높이(hf, hb)는 자동계산되므로 잠금
    hf.readOnly = true;
    hb.readOnly = true;
    hf.classList.add("readonly-input");
    hb.classList.add("readonly-input");

  } else {
    // [모드 2] 길이 & 높이 입력 -> 구배 자동계산
    m1.style.display = "none";
    m2.style.display = "block";
    L_input.readOnly = false;
    L_input.classList.remove("readonly-input");

    // 높이(hf, hb)는 입력 가능
    hf.readOnly = false;
    hb.readOnly = false;
    hf.classList.remove("readonly-input");
    hb.classList.remove("readonly-input");

    // 구배(Sf, Sb)는 자동계산되므로 잠금
    Sf.readOnly = true;
    Sb.readOnly = true;
    Sf.classList.add("readonly-input");
    Sb.classList.add("readonly-input");
  }
  draw();
}

// --- 구간 관리 로직 ---
function addSegment() {
  midSegments.push({ l: 3000, h: 500 });
  renderSegments();
  draw();
}

function removeSegment(index) {
  midSegments.splice(index, 1);
  renderSegments();
  draw();
}

function renderSegments() {
  const container = document.getElementById("segment-container");
  container.innerHTML = "";
  
  midSegments.forEach((seg, idx) => {
    const div = document.createElement("div");
    div.className = "segment-row";
    div.innerHTML = `
      <div class="seg-header">
        <span>중간구간 ${idx + 1}</span>
        <button type="button" class="btn-del" onclick="removeSegment(${idx})">삭제</button>
      </div>
      <div class="input-row">
        <label>길이 
          <input type="number" value="${seg.l}" data-index="${idx}" data-key="l">
        </label>
        <label>높이 
          <input type="number" value="${seg.h}" data-index="${idx}" data-key="h">
        </label>
      </div>
      <div class="seg-info" id="seg-info-${idx}">
        구배: <b>${(seg.l > 0 ? (seg.h/seg.l*100).toFixed(2) : "0.00")}%</b>
      </div>
    `;
    container.appendChild(div);
  });
}

function updateSegmentUI(idx) {
  const seg = midSegments[idx];
  const info = document.getElementById(`seg-info-${idx}`);
  if(info) {
    const grade = seg.l > 0 ? (seg.h / seg.l * 100).toFixed(2) : "0.00";
    info.innerHTML = `구배: <b>${grade}%</b>`;
  }
}

// --- SVG 그리기 헬퍼 ---
function line(x1,y1,x2,y2,color="#333",w=2,dash=false){
  const l=document.createElementNS("http://www.w3.org/2000/svg","line");
  l.setAttribute("x1",x1); l.setAttribute("y1",y1);
  l.setAttribute("x2",x2); l.setAttribute("y2",y2);
  l.setAttribute("stroke",color);
  l.setAttribute("stroke-width",w);
  if(dash) l.setAttribute("stroke-dasharray","5,5");
  svg.appendChild(l);
}

function text(t,x,y,a="middle", color="#333", w="normal"){
  const el=document.createElementNS("http://www.w3.org/2000/svg","text");
  el.setAttribute("x",x);
  el.setAttribute("y",y);
  el.setAttribute("font-size","12");
  el.setAttribute("fill", color);
  el.setAttribute("text-anchor",a);
  el.setAttribute("font-weight", w);
  el.textContent=t;
  svg.appendChild(el);
}

function dimH(x1,x2,y,t){
  line(x1,y,x2,y,"#555",1);
  line(x1,y-4,x1,y+4,"#555",1);
  line(x2,y-4,x2,y+4,"#555",1);
  text(t,(x1+x2)/2,y-6);
}

function dimV(x,y1,y2,t){
  line(x,y1,x,y2,"#555",1);
  line(x-4,y1,x+4,y1,"#555",1);
  line(x-4,y2,x+4,y2,"#555",1);
  text(t,x-8,(y1+y2)/2+4,"end");
}

// --- 메인 그리기 함수 (draw) ---
function draw(){
  svg.innerHTML="";
  statusEl.textContent="";
  
  const mode = document.querySelector('input[name="mode"]:checked').value;
  let H = v("H");
  
  // 공통 변수 (일단 선언만)
  let Lf = v("Lf"), hf = 0, Sf = 0;
  let Lb = v("Lb"), hb = 0, Sb = 0;

  // 포인트 저장용
  let points = []; 
  points.push({x:0, y:0}); 

  // ==========================
  // MODE 1: 최소 길이 검토
  // ==========================
  if(mode === "mode1"){
    // 모드 1은 구배(Sf, Sb)가 입력값
    Sf = v("Sf");
    Sb = v("Sb");
    let Sm = v("Sm");
    
    // 높이 자동 계산 (h = L * S)
    hf = Lf * (Sf/100);
    hb = Lb * (Sb/100);
    
    // 계산된 높이를 input창에 보여줌 (잠겨있음)
    set("hf", hf.toFixed(0));
    set("hb", hb.toFixed(0));

    let hm = H - hf - hb;

    if(hm <= 0) {
      statusEl.textContent = "❌ 높이 초과 (완화구간이 층고보다 높음)";
      return; 
    }

    let Lm = hm / (Sm/100);
    let L_calc = Lf + Lm + Lb;

    // 전체 길이 input 업데이트
    set("L", L_calc.toFixed(0));

    points.push({ x: Lf, y: hf, slope: Sf });
    points.push({ x: Lf+Lm, y: hf+hm, slope: Sm });
    points.push({ x: L_calc, y: H, slope: Sb });
  }

  // ==========================
  // MODE 2: 전체 길이 기준 설계
  // ==========================
  else {
    let L = v("L");
    if(!L) return;
    
    // 모드 2는 높이(hf, hb)가 입력값
    hf = v("hf");
    hb = v("hb");

    // 구배 자동 계산 및 표시
    Sf = Lf > 0 ? (hf / Lf) * 100 : 0;
    Sb = Lb > 0 ? (hb / Lb) * 100 : 0;
    
    set("Sf", Sf.toFixed(2));
    set("Sb", Sb.toFixed(2));

    // 1. 시점 완화구간
    points.push({ x: Lf, y: hf, slope: Sf });

    // 2. 중간 구간들
    let currentX = Lf;
    let currentY = hf;
    
    midSegments.forEach(seg => {
      let slope = seg.l > 0 ? (seg.h / seg.l * 100) : 0;
      currentX += seg.l;
      currentY += seg.h;
      points.push({ x: currentX, y: currentY, slope: slope });
    });

    // 3. 나머지 구간
    let usedL = currentX + Lb; 
    let usedH = currentY + hb;
    let remainL = L - usedL;
    let remainH = H - usedH;
    
    const remainTxt = document.getElementById("remain-txt");

    if(Math.abs(remainL) < 1) remainL = 0;
    if(Math.abs(remainH) < 1) remainH = 0;

    if(remainL < 0 || remainH < 0) {
       remainTxt.innerHTML = `<span style="color:red">❌ 초과: 길이 ${remainL.toFixed(0)} / 높이 ${remainH.toFixed(0)}</span>`;
       statusEl.textContent = "❌ 설정한 구간이 전체 크기를 초과했습니다.";
    } else if (remainL === 0 && remainH === 0) {
       remainTxt.innerHTML = `<span style="color:green; font-weight:bold;">✅ 설계 완료 (딱 맞음)</span>`;
       statusEl.textContent = "";
    } else {
       let rSlope = remainL > 0 ? (remainH / remainL * 100) : 0;
       remainTxt.innerHTML = `길이: ${remainL.toFixed(0)} / 높이: ${remainH.toFixed(0)} / 구배: <b>${rSlope.toFixed(2)}%</b>`;
       currentX += remainL;
       currentY += remainH;
       points.push({ x: currentX, y: currentY, slope: rSlope });
    }

    // 4. 종점 완화구간
    points.push({ x: L, y: H, slope: Sb });
  }

  // --- 화면 그리기 ---
  const lastP = points[points.length-1];
  const maxW = svg.viewBox.baseVal.width - 2 * marginX;
  const scale = lastP.x > 0 ? maxW / lastP.x : 1;
  
  const X = val => marginX + val * scale;
  const Y = val => baseY - val * scale;

  line(0, baseY, svg.viewBox.baseVal.width, baseY, "#eee");

  for(let i=0; i<points.length-1; i++){
    let p1 = points[i];
    let p2 = points[i+1];
    let slope = p2.slope; 
    let color = slope > 17.01 ? "#e74c3c" : "#4A90E2";
    if(i === 0 || i === points.length-2) color = "#7ED321";

    line(X(p1.x), Y(p1.y), X(p2.x), Y(p2.y), color, 4);
    line(X(p2.x), baseY, X(p2.x), Y(p2.y), "#ddd", 1, true);

    let len = p2.x - p1.x;
    if(len > 1) {
       dimH(X(p1.x), X(p2.x), baseY + 30 + (i%2)*20, `${(len/1000).toFixed(2)}m`);
       let mx = (X(p1.x) + X(p2.x)) / 2;
       let my = (Y(p1.y) + Y(p2.y)) / 2;
       text(`${slope.toFixed(2)}%`, mx, my - 15, "middle", color, "bold");
    }
  }

  dimH(X(0), X(lastP.x), baseY + 80, `Total L ${(lastP.x/1000).toFixed(2)}m`);
  dimV(marginX - 40, baseY, Y(lastP.y), `Total H ${(lastP.y/1000).toFixed(2)}m`);
}

// 초기화
toggleMode();
