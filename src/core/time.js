import {action,observable,asReference} from 'mobx';
import {metaFn,cacheFn} from './cacheFn.js';
import {waitException,delayException}
  from '../util/my-exceptions.js';

export const timeNow=()=>+new Date();
const clock0=(tn,t0,dt)=>dt? Math.ceil((tn-t0)/dt): tn>t0? 1:0;

export const yomoClock=metaFn((__,yomo,[t0,dt,skip])=>{
  let tn=timeNow(); let r=clock0(tn,t0,dt);
  const set=action(v=>res.set(r=v));
  const res=observable(asReference(r));
  let id; res.unsub=()=> id && clearTimeout(id);

  if(dt) {
    const nextStep=(firstRun)=> {
      if(!firstRun) {
        tn=timeNow();
        r=skip? Math.max(r+1,clock0(tn,t0,dt)):r+1;
        set(r);
      }
      id=setTimeout(nextStep,Math.max( t0+r*dt-tn, dt/3));
    }
    nextStep(true);
  } else if(r===0) {
    id=setTimeout(()=>set(1),t0-tn);
  }
  return res;
})();

export const dispatchAfter=cacheFn((yomo,t0,action,addTime)=>{
  if(yomoClock(yomo,t0)>0) {
    if(addTime) { action={...action,time:timeNow()}; }
    yomo.dispatch(action);
  }
  return true;
});

export const waitUntil=cacheFn((yomo,t0,delay)=>{
  if(yomoClock(yomo,t0)==0) {
    throw delay? delayException:waitException;
  }
  return true;
});
