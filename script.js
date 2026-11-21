/* SHAOLINE – cinematic Starting Soon screen. No dependencies. */
(()=>{
const CFG={countdownSeconds:300,startAt:24.5,muted:false};   // <- edit here, or use ?time=600 in the URL
const q=new URLSearchParams(location.search);
if(q.has('time'))CFG.countdownSeconds=+q.get('time')||300;
if(q.get('mute')==='1')CFG.muted=true;
if(q.get('ui')==='0')document.body.classList.add('noui');
const W=1920,H=1080,cv=document.getElementById('c'),c=cv.getContext('2d');
cv.width=W;cv.height=H;
const fit=()=>{const s=Math.min(innerWidth/W,innerHeight/H);cv.style.width=W*s+'px';cv.style.height=H*s+'px'};
addEventListener('resize',fit);fit();
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const sm=(a,b,t)=>{t=cl((t-a)/(b-a));return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const SERIF='900 {S}px "Trajan Pro","Cinzel","Palatino Linotype","Times New Roman",serif';
const SANS='"Segoe UI","Helvetica Neue",Arial,sans-serif';

/* ---------- sprites ---------- */
function sprite(r,g,b,n=256){const k=document.createElement('canvas');k.width=k.height=n;const x=k.getContext('2d'),
 g2=x.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g2.addColorStop(0,`rgba(${r},${g},${b},1)`);g2.addColorStop(.5,`rgba(${r},${g},${b},.35)`);
 g2.addColorStop(1,`rgba(${r},${g},${b},0)`);x.fillStyle=g2;x.fillRect(0,0,n,n);return k}
const fogS=sprite(110,115,138),redS=sprite(255,35,61),warmS=sprite(255,120,90,64);
const vig=document.createElement('canvas');vig.width=W;vig.height=H;
{const x=vig.getContext('2d'),g=x.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*1.0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.85)');x.fillStyle=g;x.fillRect(0,0,W,H)}
const grain=document.createElement('canvas');grain.width=grain.height=256;
{const x=grain.getContext('2d'),d=x.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0)}
const fogs=[];for(let i=0;i<30;i++)fogs.push({x:rnd()*(W+900),y:rnd(),r:340+rnd()*420,sp:8+rnd()*26,a:.35+rnd()*.5,l:i%3});
const embers=[];for(let i=0;i<280;i++)embers.push({x:rnd()*W,y:rnd()*H,vx:-(25+rnd()*70),vy:-(8+rnd()*38),s:.8+rnd()*2.6,ph:rnd()*9,hot:rnd()<.55,i:rnd()});

/* ---------- audio (procedural) ---------- */
let ac=null,master,noiseBuf,windG,droneG,audioOK=false;
function initAudio(){
 if(ac)return;try{ac=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
 master=ac.createGain();master.gain.value=CFG.muted?0:.85;master.connect(ac.destination);
 noiseBuf=ac.createBuffer(1,ac.sampleRate*3,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const s=ac.createBufferSource();s.buffer=noiseBuf;s.loop=true;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=520;f.Q.value=.8;
 windG=ac.createGain();windG.gain.value=0;s.connect(f);f.connect(windG);windG.connect(master);s.start();
 const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=.11;lg.gain.value=260;l.connect(lg);lg.connect(f.frequency);l.start();
 droneG=ac.createGain();droneG.gain.value=0;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=220;lp.connect(droneG);droneG.connect(master);
 [41.2,55,82.4,110.3].forEach(fr=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=fr;o.detune.value=(Math.random()-.5)*14;o.connect(lp);o.start()});
 resume();
}
function resume(){if(ac&&ac.state!=='running')ac.resume().catch(()=>{});}
const on=()=>ac&&ac.state==='running';
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0008,t+a+dec)}
function noise(type,f0,f1,a,dec,peak,q=1){const t=ac.currentTime,s=ac.createBufferSource();s.buffer=noiseBuf;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;
 f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+a+dec);const g=ac.createGain();env(g,t,a,peak,dec);s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*1.5);s.stop(t+a+dec+.1)}
function tone(f0,f1,a,dec,peak,type='sine'){const t=ac.currentTime,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+a+dec);
 const g=ac.createGain();env(g,t,a,peak,dec);o.connect(g);g.connect(master);o.start(t);o.stop(t+a+dec+.1)}
const SFX={
 thunder(){noise('lowpass',260,60,.15,3.8,1.1,.5);setTimeout(()=>on()&&noise('lowpass',200,50,.3,2.5,.6,.5),700)},
 impact(){tone(110,28,.005,1.4,1.0);noise('lowpass',900,80,.003,.9,.9)},
 whoosh(){noise('bandpass',180,5200,1.0,.5,.5,1.4)},
 shing(){noise('highpass',4500,9000,.004,.9,.28);tone(3100,3900,.01,.9,.07)},
 swell(){if(droneG){droneG.gain.cancelScheduledValues(ac.currentTime);droneG.gain.linearRampToValueAtTime(.16,ac.currentTime+2)}}
};
const CUES=[[3.2,'thunder'],[6,'thunder'],[12.5,'thunder'],[14.8,'thunder'],[16.3,'shing'],[16.6,'swell'],[17.2,'whoosh'],[17.9,'thunder'],[18,'impact'],[19.6,'impact'],[23.9,'whoosh'],[24.5,'impact']];
let fired=[];
function setMute(m){CFG.muted=m;if(master)master.gain.setTargetAtTime(m?0:.85,ac.currentTime,.05);btn.textContent=m?'SOUND OFF':'SOUND ON'}
const btn=document.getElementById('mute');btn.classList.add('show');setTimeout(()=>btn.classList.remove('show'),7000);
btn.addEventListener('click',e=>{e.stopPropagation();initAudio();setMute(!CFG.muted)});
btn.textContent=CFG.muted?'SOUND OFF':'SOUND ON';

/* ---------- timeline state ---------- */
let T=0,cdBase=CFG.startAt,lastTs=0,gestured=false,nextThunder=40;
function restart(){T=0;fired=[];cdBase=CFG.startAt;nextThunder=40;seed=11;if(on()){windG.gain.setTargetAtTime(.3,ac.currentTime,3);droneG.gain.setTargetAtTime(.05,ac.currentTime,4)}}
function firstGesture(){if(gestured)return;gestured=true;const was=on();initAudio();resume();if(!was)setTimeout(()=>{if(on()){restart()}},150)}
['pointerdown','keydown'].forEach(ev=>addEventListener(ev,e=>{if(ev==='keydown'){if(e.key==='m'||e.key==='M'){initAudio();setMute(!CFG.muted);return}if(e.key==='r'||e.key==='R'){initAudio();restart();return}}firstGesture()}));
try{initAudio();if(on()){gestured=true;windG.gain.setTargetAtTime(.3,ac.currentTime,3);droneG.gain.setTargetAtTime(.05,ac.currentTime,4)}}catch(e){}
window.SHAOLINE={setCountdown(s){CFG.countdownSeconds=s;cdBase=Math.max(T,CFG.startAt)},restart,mute:setMute,config:CFG};

/* ---------- scene helpers ---------- */
const FLASH=[3.2,6,12.5,14.8,17.9];
const flash=t=>FLASH.reduce((a,f)=>t>f?a+Math.exp(-(t-f)*6)*(.65+.35*Math.sin((t-f)*60)):a,0);
function bolt(i,t){const age=t-FLASH[i];if(age<0||age>.28)return;const a=1-age/.28;let x=380+i*300,y=-20;c.save();c.globalCompositeOperation='lighter';
 for(let p=0;p<2;p++){c.beginPath();c.moveTo(x,y);let px=x,py=y;for(let k=0;k<14;k++){px+=Math.sin(i*13+k*7+p*3)*70;py+=48+Math.abs(Math.sin(k*3+i))*20;c.lineTo(px,py)}
  c.strokeStyle=`rgba(${p?255:210},${p?60:225},${p?80:255},${a*(p?.5:.9)})`;c.lineWidth=p?9:3;c.shadowColor='#8aa';c.shadowBlur=30;c.stroke()}c.restore()}
function ridge(y,amp,o,col,dx=0){c.fillStyle=col;c.beginPath();c.moveTo(-300,H+10);for(let x=-300;x<=W+300;x+=40)c.lineTo(x,y+Math.sin((x+dx)*.004+o)*amp+Math.sin((x+dx)*.013+o*2)*amp*.4+Math.sin((x+dx)*.03+o)*amp*.12);c.lineTo(W+300,H+10);c.fill()}
function roof(cx,y,w,h){const L=cx-w-34,R=cx+w+34;c.beginPath();c.moveTo(L,y-26);c.quadraticCurveTo(L+60,y+4,cx-w*.55,y);c.lineTo(cx-w*.2,y-h);c.lineTo(cx+w*.2,y-h);c.lineTo(cx+w*.55,y);
 c.quadraticCurveTo(R-60,y+4,R,y-26);c.quadraticCurveTo(cx+w*.6,y+22,cx,y+20);c.quadraticCurveTo(cx-w*.6,y+22,L,y-26);c.fill()}
function temple(T,glow){const cx=960,base=730;c.fillStyle='#0d0d13';c.fillRect(cx-330,base,660,22);c.fillRect(cx-290,base+22,580,18);
 for(let i=0;i<4;i++){const y=base-i*118,w=[250,205,160,115][i];c.fillStyle='#0b0b11';c.fillRect(cx-w*.78,y-76,w*1.56,76);
  c.fillStyle='#0f0f16';for(let k=-3;k<=3;k++)c.fillRect(cx+k*w*.22-4,y-76,8,76);
  for(let k=-2;k<=2;k+=2){c.save();c.shadowColor='#FF233D';c.shadowBlur=26;c.fillStyle=`rgba(255,${35+30*Math.sin(T*3+k+i)},61,${(.35+.55*glow)*(.8+.2*Math.sin(T*5+k*2+i))})`;c.fillRect(cx+k*w*.22-13,y-58,26,34);c.restore()}
  c.fillStyle='#09090e';roof(cx,y-76,w,46)}
 c.fillRect(cx-3,base-118*3-130,6,80);c.fillStyle='#C8102E';c.globalAlpha=.7*glow;c.fillRect(cx-12,base-118*3-110,24,4);c.globalAlpha=1}
function torii(cx,y,w){c.fillStyle='#040408';c.fillRect(cx-w/2,y-330,26,330);c.fillRect(cx+w/2-26,y-330,26,330);c.fillRect(cx-w/2-60,y-360,w+146,30);c.fillRect(cx-w/2-20,y-300,w+66,16);c.fillStyle='#14040a';c.fillRect(cx-w/2-60,y-372,w+146,12)}
function fogLayer(l,T,dens,tint){c.save();for(const f of fogs){if(f.l!==l)continue;const x=((f.x+T*f.sp)%(W+900))-450;c.globalAlpha=cl(f.a*dens);const y=[600,760,900][l]+Math.sin(f.y*9+T*.1)*60;c.drawImage(fogS,x-f.r,y-f.r*.45,f.r*2,f.r*.9)}
 if(tint>0){c.globalCompositeOperation='lighter';c.globalAlpha=tint*.25;c.drawImage(redS,300,[480,640,760][l],1320,380)}c.restore()}
function warrior(T){const gx=960,gy=905,w=Math.sin(T*1.7)*.5+.5,raise=sm(16.3,17.6,T),a=lerp(2.85,.35,raise)+Math.sin(T*1.3)*.015,rim=.25+.6*sm(5,18,T);
 const aura=sm(17,19,T)*Math.exp(-Math.max(0,T-19.5)*.15);
 if(aura>0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=aura*.7;c.drawImage(redS,gx-520,gy-760,1040,1040);c.restore()}
 c.fillStyle='#050509';c.strokeStyle=`rgba(255,35,61,${rim})`;c.lineWidth=2;
 c.beginPath();c.moveTo(gx-44,gy-210);c.lineTo(gx-58,gy);c.lineTo(gx-12,gy);c.lineTo(gx-3,gy-190);c.lineTo(gx+3,gy-190);c.lineTo(gx+12,gy);c.lineTo(gx+58,gy);c.lineTo(gx+44,gy-210);c.fill();
 c.beginPath();c.moveTo(gx-50,gy-300);c.lineTo(gx+50,gy-300);c.lineTo(gx+46,gy-195);c.lineTo(gx-46,gy-195);c.fill();
 c.beginPath();c.moveTo(gx-48,gy-302);
 for(let i=0;i<=12;i++)c.lineTo(gx-50-i*3.5-Math.sin(T*2.2-i*.45)*i*(2.5+3*w),gy-300+i*20);
 for(let i=12;i>=0;i--)c.lineTo(gx+50-i*1.5-Math.sin(T*2.2-i*.45+1)*i*(2+2.5*w),gy-300+i*20);
 c.closePath();c.fill();c.stroke();
 c.beginPath();c.ellipse(gx,gy-335,24,28,0,0,7);c.fill();
 c.beginPath();c.moveTo(gx-8,gy-350);for(let i=0;i<=10;i++)c.lineTo(gx+6-i*10-Math.sin(T*3-i*.6)*i*(1.5+2*w),gy-352+i*i*.7+i*3);
 for(let i=10;i>=0;i--)c.lineTo(gx+12-i*10-Math.sin(T*3-i*.6)*i*(1.5+2*w),gy-346+i*i*.7+i*3);c.fill();
 const hx=gx+62+raise*10,hy=gy-225-raise*125;c.strokeStyle='#050509';c.lineWidth=18;c.lineCap='round';c.beginPath();c.moveTo(gx+42,gy-285);c.lineTo(hx,hy);c.stroke();
 c.save();c.translate(hx,hy);c.rotate(a);c.shadowColor='#FF233D';c.shadowBlur=8+34*raise;
 c.fillStyle='#050509';c.fillRect(-4,0,8,44);c.fillStyle='#C4C4CC';c.fillRect(-12,-3,24,5);
 const sh=(T*.45)%1,g=c.createLinearGradient(0,0,0,-232);g.addColorStop(0,'#8d8d97');g.addColorStop(Math.max(0,sh-.12),'#C4C4CC');g.addColorStop(sh,'#ff4a5d');g.addColorStop(Math.min(1,sh+.12),'#C4C4CC');g.addColorStop(1,'#fff');
 c.fillStyle=g;c.beginPath();c.moveTo(-3.5,-3);c.lineTo(-3,-226);c.lineTo(0,-236);c.lineTo(3.5,-226);c.lineTo(3.5,-3);c.fill();
 c.fillStyle='rgba(255,255,255,.8)';c.fillRect(-1,-220,1.4,214);c.restore()}

/* ---------- logo & UI ---------- */
function logo(T,cy,sc,t0){
 const word='SHAOLINE',size=206,sp=26;c.save();c.font=SERIF.replace('{S}',size);c.textBaseline='alphabetic';c.textAlign='left';
 const ws=[...word].map(ch=>c.measureText(ch).width),tot=ws.reduce((a,b)=>a+b,0)+sp*(word.length-1);
 c.translate(W/2,cy);c.scale(sc,sc);const age=T-t0,pulse=.5+.5*Math.sin(T*2.2);
 const slash=sm(0,.35,age);c.save();c.globalAlpha=slash*.9;c.shadowColor='#FF233D';c.shadowBlur=50;c.fillStyle='#C8102E';c.beginPath();
 c.moveTo(-tot/2-80,70);c.lineTo(-tot/2-20+tot*slash*1.1,-190);c.lineTo(-tot/2+30+tot*slash*1.1,-190);c.lineTo(-tot/2-50,70);c.fill();c.restore();
 let x=-tot/2;const grad=c.createLinearGradient(0,-150,0,30);[[0,'#ffffff'],[.3,'#C4C4CC'],[.52,'#686873'],[.62,'#E9E9EF'],[1,'#8d8d97']].forEach(s=>grad.addColorStop(s[0],s[1]));
 const bandX=-tot/2+((T*320)%(tot+900))-300,band=c.createLinearGradient(bandX-160,0,bandX+160,0);band.addColorStop(0,'rgba(255,255,255,0)');band.addColorStop(.5,'rgba(255,255,255,.85)');band.addColorStop(1,'rgba(255,255,255,0)');
 for(let i=0;i<word.length;i++){const la=sm(.15+i*.07,.5+i*.07,age);if(la>0){c.save();c.globalAlpha=la;c.translate(0,(1-la)*40);
   c.lineJoin='round';c.lineWidth=9;c.strokeStyle='#08090D';c.shadowColor='#FF233D';c.shadowBlur=26+24*pulse;c.strokeText(word[i],x,0);
   c.shadowBlur=0;c.fillStyle=grad;c.fillText(word[i],x,0);c.fillStyle=band;c.fillText(word[i],x,0);
   c.lineWidth=1.5;c.strokeStyle='rgba(255,35,61,.6)';c.strokeText(word[i],x,0);c.restore()}x+=ws[i]+sp}
 const la=sm(.9,1.5,age);if(la>0){c.globalAlpha=la;const lw=tot*.5*la;c.strokeStyle='#C4C4CC';c.lineWidth=2;c.beginPath();c.moveTo(-lw,58);c.lineTo(-26,58);c.moveTo(26,58);c.lineTo(lw,58);c.stroke();
  c.fillStyle='#FF233D';c.shadowColor='#FF233D';c.shadowBlur=20;c.beginPath();c.arc(0,58,9,0,7);c.fill();for(const s of[-1,1]){c.beginPath();c.moveTo(s*lw,58);c.lineTo(s*(lw-14),52);c.lineTo(s*(lw-14),64);c.fill()}}
 c.restore()}
function glyphTxt(s,x,y,font,sp,fill,blur=0){c.save();c.font=font;c.textAlign='left';const ws=[...s].map(ch=>c.measureText(ch).width),tot=ws.reduce((a,b)=>a+b,0)+sp*(s.length-1);let px=x-tot/2;c.fillStyle=fill;c.shadowColor='#FF233D';c.shadowBlur=blur;
 for(let i=0;i<s.length;i++){c.fillText(s[i],px,y);px+=ws[i]+sp}c.restore()}
function countdown(T){const rem=Math.max(0,CFG.countdownSeconds-Math.max(0,T-cdBase)),m=Math.floor(rem/60),s=Math.floor(rem%60),str=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
 const a=sm(26,27.5,T),y=760,frac=rem%1,pulse=rem>0?frac:0;if(a<=0)return;c.save();c.globalAlpha=a;
 c.textAlign='center';c.textBaseline='alphabetic';c.font='700 170px '+SANS;const g=c.createLinearGradient(0,y-130,0,y);g.addColorStop(0,'#fff');g.addColorStop(1,'#9a9aa5');
 let x=W/2-222;for(const ch of str){const cw=ch===':'?52:98;c.save();c.shadowColor='#FF233D';c.shadowBlur=18+32*pulse;c.fillStyle=g;c.fillText(ch,x+cw/2,y);c.restore();x+=cw}
 const bw=444,bx=W/2-bw/2,by=y+40,p=1-rem/Math.max(1,CFG.countdownSeconds);c.fillStyle='rgba(196,196,204,.2)';c.fillRect(bx,by,bw,3);c.fillStyle='#FF233D';c.shadowColor='#FF233D';c.shadowBlur=14;c.fillRect(bx,by,bw*p,3);
 c.shadowBlur=0;c.fillStyle='#C8102E';for(const sx of[bx-16,bx+bw+16]){c.beginPath();c.moveTo(sx,by+1.5-7);c.lineTo(sx+7,by+1.5);c.lineTo(sx,by+1.5+7);c.lineTo(sx-7,by+1.5);c.fill()}c.restore()}

/* ---------- frame ---------- */
function frame(T,dt){
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.shadowBlur=0;c.fillStyle='#08090D';c.fillRect(0,0,W,H);
 const ang=sm(6,24,T)*2-1,zoom=1+sm(0,16,T)*.26+sm(16,19,T)*.08-sm(24,28,T)*.1,sk=Math.exp(-Math.max(0,T-18)*4)*16*(T>18?1:0),
  shx=(Math.sin(T*90)*sk),shy=Math.cos(T*77)*sk,fl=flash(T),energy=sm(3,12,T),fogD=1-.5*sm(2,9,T)+.3*sm(24,26,T);
 const L=(d,fn)=>{c.save();c.translate(W/2+shx*d,H/2+shy*d-sm(0,16,T)*40*d);const k=1+(zoom-1)*d*1.7;c.scale(k,k);c.translate(-W/2-ang*d*150,-H/2);fn();c.restore()};
 L(.05,()=>{const g=c.createLinearGradient(0,0,0,H*.8);g.addColorStop(0,'#08090D');g.addColorStop(.7,'#1a0a12');g.addColorStop(1,'#2a0d16');c.fillStyle=g;c.fillRect(-400,-300,W+800,H+600);
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.25+.5*energy;c.drawImage(redS,1300-300,300-300,600,600);c.restore();
  c.fillStyle=`rgba(${200+55*energy|0},${16+20*energy|0},46,${.7+.3*energy})`;c.beginPath();c.arc(1300,300,92,0,7);c.fill();c.fillStyle='rgba(8,9,13,.25)';c.beginPath();c.arc(1280,280,26,0,7);c.arc(1330,330,18,0,7);c.fill()});
 L(.15,()=>ridge(650,80,1,'#101119',T*3));
 L(.2,()=>fogLayer(0,T,fogD*.9,energy));
 L(.35,()=>{c.globalAlpha=sm(1.2,7,T);temple(T,energy);c.globalAlpha=1});
 L(.5,()=>{ridge(800,55,4,'#0a0b10',T*5);c.save();c.globalAlpha=sm(2,8,T)*.7;c.globalCompositeOperation='lighter';c.drawImage(redS,560,520,800,500);c.restore()});
 L(.6,()=>fogLayer(1,T,fogD,energy*.7));
 L(.75,()=>{const g=c.createLinearGradient(0,880,0,H);g.addColorStop(0,'#0c0c12');g.addColorStop(1,'#050508');c.fillStyle=g;c.fillRect(-400,890,W+800,H);
  c.globalAlpha=sm(4,9,T);torii(960,900,520);c.globalAlpha=sm(7,9.5,T);warrior(T);c.globalAlpha=1});
 L(1.2,()=>fogLayer(2,T,fogD*.9,energy*.5));
 // embers & ash
 const eAmt=sm(.8,5,T);c.save();for(const e of embers){e.x+=e.vx*dt*(1+energy);e.y+=e.vy*dt;if(e.x<-20)e.x=W+20;if(e.y<-20)e.y=H+20;if(e.i>eAmt)continue;
  const tw=.55+.45*Math.sin(T*4+e.ph);if(e.hot){c.globalCompositeOperation='lighter';c.globalAlpha=tw*.9*(.4+.6*energy);const s=e.s*9;c.drawImage(redS,e.x-s,e.y-s,s*2,s*2);c.drawImage(warmS,e.x-e.s,e.y-e.s,e.s*2,e.s*2)}
  else{c.globalCompositeOperation='source-over';c.globalAlpha=.35*tw;c.fillStyle='#C4C4CC';c.fillRect(e.x,e.y,e.s,e.s)}}c.restore();
 FLASH.forEach((f,i)=>bolt(i,T));
 if(fl>.01){c.save();c.globalCompositeOperation='lighter';c.fillStyle=`rgba(160,175,230,${Math.min(.35,fl*.22)})`;c.fillRect(0,0,W,H);c.restore()}
 // energy wave
 if(T>18){const p=(T-18)/1.8;if(p<1){c.save();c.globalCompositeOperation='lighter';const r=p*1500;c.lineWidth=70*(1-p)+4;c.strokeStyle=`rgba(255,60,80,${1-p})`;c.shadowColor='#FF233D';c.shadowBlur=60;
   c.beginPath();c.ellipse(960,640,r,r*.45,0,0,7);c.stroke();c.lineWidth=14*(1-p);c.strokeStyle=`rgba(255,255,255,${1-p})`;c.stroke();
   c.fillStyle=`rgba(255,40,70,${.5*(1-p)})`;c.fillRect(0,640-8-60*(1-p),W,16+120*(1-p)*0);c.restore()}
  const f2=Math.exp(-(T-18)*9);if(f2>.01){c.fillStyle=`rgba(255,255,255,${f2*.85})`;c.fillRect(0,0,W,H)}}
 if(T>26){const p=((T-24.5)%5)/5;c.save();c.strokeStyle=`rgba(255,35,61,${(1-p)*.22})`;c.lineWidth=3;c.beginPath();c.ellipse(960,560,p*1100,p*620,0,0,7);c.stroke();c.restore()}
 c.drawImage(vig,0,0);
 c.save();c.globalAlpha=.05;c.globalCompositeOperation='overlay';c.drawImage(grain,0,0,256,256,-Math.random()*256,-Math.random()*256,W+256,H+256);c.restore();
 // logo + text
 if(T>19.6){const m=sm(24,26.5,T);const lt=T-19.6;c.save();const s=1+(1-sm(0,.6,lt))*.12;logo(T,lerp(600,420,m),lerp(1,.86,m)*s,19.6);c.restore()}
 const sub=sm(26,27.5,T);if(sub>0){c.save();c.globalAlpha=sub;c.textBaseline='alphabetic';const rem=CFG.countdownSeconds-Math.max(0,T-cdBase);
  glyphTxt(rem>0?'STREAM STARTING SOON':'GOING LIVE',W/2,545,'600 44px '+SANS,22,'#C4C4CC',16);c.restore()}
 countdown(T);
 // cinematic bars & captions
 const bh=120*(1-sm(24,26,T));c.fillStyle='#000';c.fillRect(0,0,W,bh);c.fillRect(0,H-bh,W,bh);
 [[1.5,'I  ·  THE AWAKENING'],[9,'II  ·  THE WARRIOR'],[19.8,'']].forEach(([t0,s])=>{if(!s)return;const a=sm(t0,t0+1,T)*(1-sm(t0+4,t0+5,T));if(a>0){c.save();c.globalAlpha=a*.8;glyphTxt(s,W/2,H-48,'500 22px '+SANS,14,'#C4C4CC',0);c.restore()}});
 c.fillStyle=`rgba(0,0,0,${1-sm(0,2.5,T)})`;c.fillRect(0,0,W,H);
 if(T>26&&T>nextThunder){nextThunder=T+25+Math.random()*20;FLASH.push(T+.05);if(on())SFX.thunder()}
}
function tick(ts){requestAnimationFrame(tick);const dt=Math.min(.05,(ts-lastTs)/1000||0.016);lastTs=ts;T+=dt;
 if(on())CUES.forEach(([t,n],i)=>{if(!fired[i]&&T>=t){fired[i]=true;if(T-t<1.5)SFX[n]()}});
 frame(T,dt)}
requestAnimationFrame(tick);
})();
