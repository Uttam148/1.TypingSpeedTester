const paragraph='The quick brown fox jumps over the lazy dog. Practice every day to improve your typing speed and accuracy.';
const text=document.getElementById('text');
const input=document.getElementById('input');
const timeEl=document.getElementById('time');
const wpmEl=document.getElementById('wpm');
const accEl=document.getElementById('accuracy');
const restart=document.getElementById('restart');
let timer=duration,started=false,interval;
function render(){
 const val=input.value;
 text.innerHTML='';
 [...paragraph].forEach((ch,i)=>{
  const s=document.createElement('span');
  s.textContent=ch;
  if(i<val.length){
    s.className=val[i]===ch?'correct':'wrong';
  }else if(i===val.length){
    s.className='current';
  }
  text.appendChild(s);
 });
}
function stats(){
 const typed=input.value.length;
 let correct=0;
 for(let i=0;i<typed;i++) if(input.value[i]===paragraph[i]) correct++;
 const mins=(60-timer)/60||1/60;
 wpmEl.textContent=Math.round((correct/5)/mins);
 accEl.textContent=typed?Math.round(correct/typed*100):100;
}
function start(){
 if(started)return;
 started=true;
 interval=setInterval(()=>{
  timer--;
  timeEl.textContent=timer;
  stats();
  if(timer<=0){
    clearInterval(interval);
    input.disabled=true;
  }
 },1000);
}
input.addEventListener('input',()=>{start();render();stats();});
restart.addEventListener('click',()=>{
 clearInterval(interval);
 timer=60;started=false;
 timeEl.textContent=60;
 input.disabled=false;
 input.value='';
 wpmEl.textContent='0';
 accEl.textContent='100';
 render();
 input.focus();
});
render();

// sets durations multiple
function setDuration(seconds) {
    if (started) return;

    duration = seconds;
    timer = seconds;

    timeEl.textContent = timer;
}
