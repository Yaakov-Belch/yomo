export const wrapExFn=(fn,v0)=>(...args)=> {
  try { return fn(...args); }
  catch(exception) { return (v0!==undefined)? v0:wrapEx(exception); }
}
export const wrapEx=(exception)=>({exception});
export const unwrapEx=(v)=>{
  const e= v && v.exception;
  if(e) { throw e; } else { return v; }
};

function WaitException(){
  this.waiting=true;
  this.name="waitException";
  this.message="Waiting for some event or for input...";
}
function DelayException(){
  this.waiting=this.delaying=true;
  this.name="delayException";
  this.message="Intentionally delaying progress...";
}

export const waitException =new WaitException();
export const delayException=new DelayException();

export const vWait =wrapEx(waitException);
export const vDelay=wrapEx(delayException);

// wait=>+1 delay=>-1 else=>0
export const isWaitX=(e)=>e.waiting? (e.delaying? -1:+1) : 0;
