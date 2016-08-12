export const slurp=(stream,cb)=>{
  const buffers=[];
  stream.on('data',(buffer)=>buffers.push(buffer));
  stream.on('end',()=>cb(null, Buffer.concat(buffers)));
  stream.on('error',cb);
};
