const start=(info)=>{
  info.connect(info.args);
  info.recv(true);
};
const stop=(info)=>info.recv(false);
const nop=()=>true;

export const connCheck={
  client: {start, proc:nop, stop},
  srv:    {start:nop,proc:nop,stop:nop},
};
