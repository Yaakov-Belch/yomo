const Promise=require('bluebird');
export const delay=
  Promise.promisify((dt,cb)=>setTimeout(cb,dt));
export const ticks=(dt,fn)=>
  delay(dt)
    .then(()=>{ fn(); ticks(dt,fn); return 1;})
    .catch(e=>console.log('error:', e));

