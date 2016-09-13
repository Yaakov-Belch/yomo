import {watch,readFile,readdir} from 'fs';
import {cacheCb} from '../core/cacheFn.js';

export const xRdJson=(yomo,path)=>JSON.parse(xRdTxt(yomo,path));
export const xRdTxt=(yomo,path)=>xRdBuffer(yomo,path).toString();
export const xRdBuffer=cacheCb((yomo,cb,path)=>{
  let old;
  const look=()=>readFile(path,(error,res)=>{
    if((!old) || (!res) || res.compare(old)){
      cb(error,old=res);
    }
  });
  const watcher=watch(path,look);
  look();
  return ()=>watcher.close();
});

export const xRdDir=cacheCb((yomo,cb,path)=>{
  let old;
  const look=()=>readdir(path,(error,res=[])=>{
    res.sort();
    if(!(old && arraysEqual(res,old))){
      cb(error,old=res);
    }
  });
  const watcher=watch(path,look);
  look();
  return ()=>watcher.close();
});

const arraysEqual=(a,b)=>{
  if(a.length != b.length) { return false; }
  for(let i=0; i<a.length; i++) {
    if(a[i]!==b[i]){ return false; }
  }
  return true;
}
