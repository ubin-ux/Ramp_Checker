const svg = document.getElementById("svg");
const statusEl = document.getElementById("status");
const baseY = 600;
const marginX = 100;

// 모드 2 데이터 저장소
let midSegments = []; 

function v(id){ return +document.getElementById(id).value || 0; }
function set(id,val){ document.getElementById(id).value = val; }

// --- 이벤트 리스너 (실시간 감지 핵심) ---
// 컨트롤 패널 전체에 이벤트를 걸어서, 나중에 추가된 input도 감지하게 만듦
document.getElementById('controls-panel').addEventListener('input', function(e) {
  const target = e.target;
  
  // 1. 일반 input 변경 시 바로 그리기
  if(target.tagName === 'INPUT') {
    // 만약 동적으로 생성된 구간 input이라면 데이터 업데이트
    if(target.dataset.index !== undefined) {
      const idx = target.dataset.index;
      const key = target.dataset.key; // 'l' or 'h'
      midSegments[idx][key] = +target.value;
      updateSegmentUI(idx); // 해당 구간 구배 텍스트 갱신
    }
    draw();
  }
  
  // 2. 라디오 버튼 변경 시 모드 전환
  if(target.name === 'mode') {
    toggleMode();
  }
});

document.getElementById('btn-add').addEventListener('click', addSegment);

// --- 모드 로직 ---
function toggleMode() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const m1 = document.getElementById("mode1-mid");
  const m2 = document.getElementById("mode2-mid");
  const L_input = document.getElementById("L");

  if (mode === "mode1") {
    m1.style.display = "block";
    m2.style.display = "none";
    // 모드 1에서는 L을 사용자가 입력하지 않고 결과로 보여줌
    // L_input.readOnly = true; 
  } else {
    m1.style.display = "none";
    m2.style.display = "block";
    L_input.readOnly = false;
  }
  draw();
}

// --- 구간 관리 로직 ---
function addSegment() {
  midSegments.push({ l: 3000, h: 500 }); // 기본값
  renderSegments(); // UI 다시 만들기
  draw();
}

function removeSegment(index) {
  midSegments.splice(index, 1);
  renderSegments();
  draw();
}

// 구간 UI를 싹 지우고 다시 만드는 함수
function renderSegments() {
  const container = document.getElementById("segment-container");
  container.innerHTML = "";
  
  midSegments.forEach((seg, idx) => {
    const div = document.createElement("div");
    div.className = "segment-row";
    
    // HTML 생성
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

// 특정 구간의 구배 텍스트만 업데이트 (입력할 때마다 깜빡이지 않게)
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
  
  // 공통 변수
  let Lf = v("Lf"), hf = v("hf");
  let Lb = v("Lb"), hb = v("hb");
  let Sf = 0, Sb = 0;

  // 포인트 저장용
  let points = []; 
  points.push({x:0, y:0}); // 시점

  // ==========================
  // MODE 1: 최소 길이 검토
  // ==========================
  if(mode === "mode1"){
    let Sf_in = v("Sf"), Sb_in = v("Sb"), Sm_in = v("Sm");
    
    // 계산
    hf = Lf * (Sf_in/100);
    hb = Lb * (Sb_in/100);
    let hm = H - hf - hb;

    if(hm <= 0) {
      statusEl.textContent = "❌ 높이 초과 (완화구간이 층고보다 높음)";
      return; 
    }

    let Lm = hm / (Sm_in/100);
    let L_calc = Lf + Lm + Lb;

    // 값 세팅
    set("hf", hf.toFixed(0));
    set("hb", hb.toFixed(0));
    set("L", L_calc.toFixed(0));
    set("Sf", Sf_in); // 모드1은 입력값 그대로
    set("Sb", Sb_in);

    points.push({ x: Lf, y: hf, slope: Sf_in });
    points.push({ x: Lf+Lm, y: hf+hm, slope: Sm_in });
    points.push({ x: L_calc, y: H, slope: Sb_in });
  }

  // ==========================
  // MODE 2: 전체 길이 기준 설계
  // ==========================
  else {
    let L = v("L");
    if(!L) return;

    // Sf, Sb 역계산 및 표시
    Sf = Lf > 0 ? (hf / Lf) * 100 : 0;
    Sb = Lb > 0 ? (hb / Lb) * 100 : 0;
    
    // readonly input에 값 넣어주기 (소수점 2자리)
    set("Sf", Sf.toFixed(2));
    set("Sb", Sb.toFixed(2));

    // 1. 시점 완화구간
    points.push({ x: Lf, y: hf, slope: Sf });

    // 2. 중간 구간들 누적
    let currentX = Lf;
    let currentY = hf;
    
    midSegments.forEach(seg => {
      let slope = seg.l > 0 ? (seg.h / seg.l * 100) : 0;
      currentX += seg.l;
      currentY += seg.h;
      points.push({ x: currentX, y: currentY, slope: slope });
    });

    // 3. 나머지 구간 계산
    // 전체 L, H 에서 (완화구간 앞뒤 + 중간구간들)을 뺀 나머지
    let usedL = currentX + Lb; 
    let usedH = currentY + hb;
    
    let remainL = L - usedL;
    let remainH = H - usedH;
    
    const remainTxt = document.getElementById("remain-txt");

    // 오차범위 (1mm) 내외면 0으로 간주
    if(Math.abs(remainL) < 1) remainL = 0;
    if(Math.abs(remainH) < 1) remainH = 0;

    if(remainL < 0 || remainH < 0) {
       // 초과됨
       remainTxt.innerHTML = `<span style="color:red">❌ 초과: 길이 ${remainL.toFixed(0)} / 높이 ${remainH.toFixed(0)}</span>`;
       statusEl.textContent = "❌ 설정한 구간이 전체 크기를 초과했습니다.";
    } else if (remainL === 0 && remainH === 0) {
       // 딱 맞음
       remainTxt.innerHTML = `<span style="color:green; font-weight:bold;">✅ 설계 완료 (딱 맞음)</span>`;
       statusEl.textContent = "";
    } else {
       // 남음 (그려야 함)
       let rSlope = remainL > 0 ? (remainH / remainL * 100) : 0;
       remainTxt.innerHTML = `길이: ${remainL.toFixed(0)} / 높이: ${remainH.toFixed(0)} / 구배: <b>${rSlope.toFixed(2)}%</b>`;
       
       // 나머지 구간 포인트 추가
       currentX += remainL;
       currentY += remainH;
       points.push({ x: currentX, y: currentY, slope: rSlope });
    }

    // 4. 종점 완화구간
    // 마지막 점은 무조건 L, H여야 함 (그래야 그래프가 끝까지 감)
    points.push({ x: L, y: H, slope: Sb });
  }

  // --- 화면 그리기 ---
  
  // 스케일 계산
  const lastP = points[points.length-1];
  const maxW = svg.viewBox.baseVal.width - 2 * marginX;
  const scale = lastP.x > 0 ? maxW / lastP.x : 1;
  
  const X = val => marginX + val * scale;
  const Y = val => baseY - val * scale;

  // 바닥선
  line(0, baseY, svg.viewBox.baseVal.width, baseY, "#eee");

  // 좌표 순회하며 선 긋기
  for(let i=0; i<points.length-1; i++){
    let p1 = points[i];
    let p2 = points[i+1];
    
    // 기울기는 p2에 저장된 slope 사용
    let slope = p2.slope; 
    
    // 색상 결정 (17% 초과시 빨강)
    let color = slope > 17.01 ? "#e74c3c" : "#4A90E2"; // 기본 파랑
    if(i === 0 || i === points.length-2) color = "#7ED321"; // 완화구간 초록

    // 선 그리기
    line(X(p1.x), Y(p1.y), X(p2.x), Y(p2.y), color, 4);
    
    // 보조선
    line(X(p2.x), baseY, X(p2.x), Y(p2.y), "#ddd", 1, true);

    // 치수 (길이)
    let len = p2.x - p1.x;
    if(len > 1) { // 길이가 0 이상일 때만 표기
       dimH(X(p1.x), X(p2.x), baseY + 30 + (i%2)*20, `${(len/1000).toFixed(2)}m`);
       
       // 구배 텍스트
       let mx = (X(p1.x) + X(p2.x)) / 2;
       let my = (Y(p1.y) + Y(p2.y)) / 2;
       text(`${slope.toFixed(2)}%`, mx, my - 15, "middle", color, "bold");
    }
  }

  // 전체 L 치수
  dimH(X(0), X(lastP.x), baseY + 80, `Total L ${(lastP.x/1000).toFixed(2)}m`);

  // 높이 치수 (H)
  dimV(marginX - 40, baseY, Y(lastP.y), `Total H ${(lastP.y/1000).toFixed(2)}m`);

}

// 초기화
toggleMode();
