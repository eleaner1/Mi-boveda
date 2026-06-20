/* Bóveda — orientación → constelación, con animación sobre estrellas reales + congelar al tocar. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  let lat = null, lon = null;
  let haveOrientation = false;
  let smoothAz = null, smoothAlt = null;
  const SMOOTH = 0.15;
  let currentKey = null, animToken = 0;
  let frozen = false;            // congelado al tocar
  let candidateKey = null, candidateSince = 0;   // para histéresis anti-salto
  const HOLD_MS = 700;           // hay que sostener la nueva constelación este tiempo
  let lastData = null;           // datos de la constelación mostrada (para pausa)

  // ---------- starfield de fondo ----------
  (function starfield() {
    const c = $("stars"), x = c.getContext("2d");
    let w, h, stars = [];
    function resize() {
      w = c.width = innerWidth * devicePixelRatio;
      h = c.height = innerHeight * devicePixelRatio;
      stars = Array.from({ length: 140 }, () => ({
        x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.3*devicePixelRatio+0.2,
        a: Math.random()*0.6+0.2, tw: Math.random()*0.02+0.004, p: Math.random()*Math.PI*2 }));
    }
    function frame(t){ x.clearRect(0,0,w,h);
      for(const s of stars){ const a=s.a+Math.sin(t*s.tw+s.p)*0.25;
        x.globalAlpha=Math.max(0,Math.min(1,a)); x.fillStyle="#EAE6D9";
        x.beginPath(); x.arc(s.x,s.y,s.r,0,7); x.fill(); }
      requestAnimationFrame(frame); }
    addEventListener("resize",resize); resize(); requestAnimationFrame(frame);
  })();

  // ---------- orientación ----------
  function handleOrientation(e){
    let heading;
    if(typeof e.webkitCompassHeading==="number") heading=e.webkitCompassHeading;
    else if(typeof e.alpha==="number") heading=360-e.alpha; else return;
    let beta=e.beta||0, altitude=Math.max(-90,Math.min(90,90-Math.abs(beta)));
    if(smoothAz===null){smoothAz=heading;smoothAlt=altitude;}
    let d=heading-smoothAz; if(d>180)d-=360; if(d<-180)d+=360;
    smoothAz=(smoothAz+d*SMOOTH+360)%360; smoothAlt=smoothAlt+(altitude-smoothAlt)*SMOOTH;
    haveOrientation=true;
    if(!frozen) render();        // si está congelado, ignoramos el movimiento
  }

  function horizonToEquatorial(azDeg,altDeg,latDeg,lonDeg,time){
    const d2r=Math.PI/180,r2d=180/Math.PI;
    const A=azDeg*d2r,a=altDeg*d2r,phi=latDeg*d2r;
    const sinDec=Math.sin(a)*Math.sin(phi)+Math.cos(a)*Math.cos(phi)*Math.cos(A);
    const dec=Math.asin(Math.max(-1,Math.min(1,sinDec)));
    const cosH=(Math.sin(a)-Math.sin(phi)*Math.sin(dec))/(Math.cos(phi)*Math.cos(dec));
    let H=Math.acos(Math.max(-1,Math.min(1,cosH)));
    if(Math.sin(A)>0)H=2*Math.PI-H;
    const Hdeg=H*r2d, gst=Astronomy.SiderealTime(time), lst=(gst*15+lonDeg)%360;
    let raDeg=(lst-Hdeg)%360; if(raDeg<0)raDeg+=360;
    return {ra:raDeg/15, dec:dec*r2d};
  }

  function render(){
    if(!haveOrientation||lat===null)return;
    const az=smoothAz,alt=smoothAlt;
    $("degReadout").textContent=Math.round(az)+"°";
    $("needle").style.transform=`translateX(-50%) rotate(${az}deg)`;
    $("scanLine").textContent=`altura ${Math.round(alt)}° · azimut ${Math.round(az)}°`;
    let key=null,name="—",latin="";
    try{
      const time=new Astronomy.AstroTime(new Date());
      const eq=horizonToEquatorial(az,alt,lat,lon,time);
      const c=Astronomy.Constellation(eq.ra,eq.dec);
      key=c.name; latin=key; name=(CONSTELLATIONS_ES[key]||key);
    }catch(err){key=null;}
    if(alt<-5){key="__below";name="Bajo el horizonte";latin="apunta más arriba";}

    // Histéresis: solo cambiamos si la nueva constelación se sostiene un rato.
    // Esto evita el salto brusco por micro-temblores de la brújula en los bordes.
    const now=performance.now();
    if(key===currentKey){ candidateKey=null; return; }
    if(key!==candidateKey){ candidateKey=key; candidateSince=now; return; }
    if(now-candidateSince < HOLD_MS) return;     // aún no se sostiene lo suficiente
    currentKey=key; candidateKey=null;
    onConstellationChange(key,name,latin);
  }

  // Cambia nombre, mito y figura DE FORMA SINCRONIZADA (corrige el desfase)
  function onConstellationChange(key,name,latin){
    $("constName").textContent=name;
    $("constLatin").textContent=latin;
    const myth=$("myth"); myth.classList.remove("show"); clearStage();
    const data=(typeof FIGURES!=="undefined")?FIGURES[key]:null;
    lastData=data||null;
    if(!data){ myth.textContent=""; return; }
    myth.textContent=data.myth;
    animateConstellation(data);
  }
  function clearStage(){ $("figLayer").innerHTML=""; $("lineLayer").innerHTML=""; $("starLayer").innerHTML=""; }

  function projectStars(stars){
    const pts=stars.map(s=>({ra:s[0],dec:s[1],mag:s[2],name:s[3]}));
    let minR=Math.min(...pts.map(p=>p.ra)),maxR=Math.max(...pts.map(p=>p.ra));
    if(maxR-minR>12){pts.forEach(p=>{if(p.ra<12)p.ra+=24;});}
    let minD=Math.min(...pts.map(p=>p.dec)),maxD=Math.max(...pts.map(p=>p.dec));
    const decMid=(minD+maxD)/2;
    const raDeg=(h)=>h*15*Math.cos(decMid*Math.PI/180);
    const xs=pts.map(p=>raDeg(p.ra)), ys=pts.map(p=>p.dec);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const spanX=Math.max(0.5,maxX-minX), spanY=Math.max(0.5,maxY-minY);
    // escala: conservar forma pero permitir hasta 1.8x de estiramiento del eje
    // menor para que figuras alargadas no queden como una tira fina.
    const big=Math.max(spanX,spanY);
    const useX=Math.max(spanX, big/1.8);
    const useY=Math.max(spanY, big/1.8);
    const pad=20, size=100-pad*2;
    const offX=(useX-spanX)/2, offY=(useY-spanY)/2;
    return pts.map((p,i)=>({
      x: pad + (1-((xs[i]-minX+offX)/useX))*size,
      y: pad + (1-((ys[i]-minY+offY)/useY))*size,
      mag:p.mag, name:p.name }));
  }

  const NS="http://www.w3.org/2000/svg";
  function el(tag,attrs){const n=document.createElementNS(NS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);return n;}
  function sleep(ms,token){return new Promise(res=>setTimeout(()=>res(token===animToken),ms));}

  // Catmull-Rom -> path suave que pasa por los puntos
  function smoothPath(points, curve){
    if(points.length<2) return "";
    if(curve<=0 || points.length<3){
      return "M"+points.map(p=>`${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L");
    }
    const k=Math.min(0.6,curve+0.2);
    let d=`M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for(let i=0;i<points.length-1;i++){
      const p0=points[i-1]||points[i], p1=points[i], p2=points[i+1], p3=points[i+2]||p2;
      const c1x=p1.x+(p2.x-p0.x)/6*k, c1y=p1.y+(p2.y-p0.y)/6*k;
      const c2x=p2.x-(p3.x-p1.x)/6*k, c2y=p2.y-(p3.y-p1.y)/6*k;
      d+=` C${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  }

  // Dibuja la constelación completa SIN animación (para pausa / salto al final)
  function drawInstant(data){
    clearStage();
    const pts=projectStars(data.stars);
    const starLayer=$("starLayer"),figLayer=$("figLayer");
    const rOf=(m)=>Math.max(0.9,2.6-m*0.45);
    for(const seg of data.draw){
      const segPts=seg.path.map(i=>pts[i]).filter(Boolean);
      if(segPts.length<2)continue;
      const path=el("path",{d:smoothPath(segPts,seg.curve||0),class:"figStroke"});
      figLayer.appendChild(path);
    }
    for(const p of pts){
      const glow=el("circle",{cx:p.x,cy:p.y,r:rOf(p.mag)*2.2,class:"starGlow"});
      const dot=el("circle",{cx:p.x,cy:p.y,r:rOf(p.mag),class:"starDot"});
      glow.style.opacity=.5; dot.style.opacity=1;
      starLayer.appendChild(glow);starLayer.appendChild(dot);
    }
    $("myth").classList.add("show");   // el texto SIEMPRE aparece
  }

  async function animateConstellation(data){
    const token=++animToken;
    const pts=projectStars(data.stars);
    const starLayer=$("starLayer"),figLayer=$("figLayer");
    const rOf=(m)=>Math.max(0.9,2.6-m*0.45);

    // 1) estrellas reales aparecen una a una
    for(let i=0;i<pts.length;i++){
      if(token!==animToken)return; const p=pts[i];
      const glow=el("circle",{cx:p.x,cy:p.y,r:rOf(p.mag)*2.2,class:"starGlow"});
      const dot=el("circle",{cx:p.x,cy:p.y,r:rOf(p.mag),class:"starDot"});
      starLayer.appendChild(glow);starLayer.appendChild(dot);
      glow.animate([{opacity:0},{opacity:.5}],{duration:500,fill:"forwards"});
      dot.animate([{opacity:0},{opacity:1}],{duration:500,fill:"forwards"});
      if(!(await sleep(140,token)))return;
    }
    if(!(await sleep(200,token)))return;

    // 2) la figura se DIBUJA SOLA con trazo dorado, siguiendo las estrellas reales
    for(const seg of data.draw){
      if(token!==animToken)return;
      const segPts=seg.path.map(i=>pts[i]).filter(Boolean);
      if(segPts.length<2)continue;
      const d=smoothPath(segPts, seg.curve||0);
      const path=el("path",{d:d,class:"figStroke"});
      figLayer.appendChild(path);
      const len=path.getTotalLength ? path.getTotalLength() : 200;
      path.style.strokeDasharray=len; path.style.strokeDashoffset=len;
      path.animate([{strokeDashoffset:len},{strokeDashoffset:0}],
        {duration:Math.max(500,len*9),fill:"forwards",easing:"ease-in-out"});
      if(!(await sleep(Math.max(420,len*7),token)))return;
    }
    if(!(await sleep(300,token)))return;
    // 3) brillo suave permanente en la figura (vaivén vivo, no criatura animada)
    figLayer.querySelectorAll(".figStroke").forEach(p=>{
      p.animate([{opacity:.7},{opacity:1},{opacity:.7}],
        {duration:3200,iterations:Infinity,easing:"ease-in-out"});
    });
    $("myth").classList.add("show");
  }

  // ---------- congelar al tocar ----------
  function toggleFreeze(){
    frozen=!frozen;
    const badge=$("freezeBadge");
    if(frozen){
      animToken++;                 // cancela cualquier animación en curso
      if(lastData) drawInstant(lastData);   // completa el dibujo y muestra el texto YA
      badge.textContent="❄ congelado · toca para reanudar";
      badge.classList.add("show"); $("status").textContent="pausa";
    } else {
      badge.classList.remove("show"); $("status").textContent="en vivo";
      currentKey=null;             // fuerza re-evaluar al reanudar
    }
  }

  // ---------- arranque ----------
  function showUI(){$("gate").classList.add("hidden");
    ["ui-header","ui-main","ui-dial","ui-footer"].forEach(id=>$(id).classList.remove("hidden"));}
  function startSensors(){
    window.addEventListener("deviceorientationabsolute",handleOrientation,true);
    window.addEventListener("deviceorientation",handleOrientation,true);
    $("calib").textContent="brújula: activa";}
  function onPos(latitude,longitude){
    lat=latitude; lon=longitude;
    $("latlon").textContent=`${lat.toFixed(2)}° ; ${lon.toFixed(2)}°`;
    if(!frozen)render();
  }

  // ¿Estamos dentro de la APK (Capacitor) con el plugin de Geolocalización?
  function capGeo(){
    return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation)
      ? window.Capacitor.Plugins.Geolocation : null;
  }

  async function startLocation(){
    const Geo=capGeo();
    if(Geo){
      // --- Ruta APK: usar el plugin NATIVO (esto sí pide el permiso de Android) ---
      try{
        const perm=await Geo.requestPermissions();
        const state=perm && (perm.location||perm.coarseLocation);
        if(state!=="granted"){
          $("latlon").textContent="ubicación denegada";
          $("constLatin").textContent="activa la ubicación en ajustes";
          lat=0;lon=0; return;
        }
        // posición inicial
        try{
          const p=await Geo.getCurrentPosition({enableHighAccuracy:true,timeout:15000});
          onPos(p.coords.latitude,p.coords.longitude);
        }catch(e){}
        // seguimiento continuo
        await Geo.watchPosition({enableHighAccuracy:true},(p,err)=>{
          if(p && p.coords) onPos(p.coords.latitude,p.coords.longitude);
        });
      }catch(e){
        $("latlon").textContent="error de ubicación"; lat=0;lon=0;
      }
      return;
    }
    // --- Ruta navegador web: navigator.geolocation ---
    if(!navigator.geolocation){$("latlon").textContent="sin GPS";lat=0;lon=0;return;}
    navigator.geolocation.watchPosition(
      (pos)=>onPos(pos.coords.latitude,pos.coords.longitude),
      ()=>{$("latlon").textContent="ubicación denegada";lat=0;lon=0;},
      {enableHighAccuracy:true,maximumAge:30000,timeout:15000});
  }

  async function enter(){
    try{ if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      const r=await DeviceOrientationEvent.requestPermission();
      if(r!=="granted")$("calib").textContent="brújula: permiso denegado";}}catch(e){}
    showUI();startSensors();
    await startLocation();
    // tocar el área del cielo congela/reanuda
    $("ui-main").addEventListener("click",toggleFreeze);
  }
  $("enterBtn").addEventListener("click",enter);
})();
