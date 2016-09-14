import {watch,access,readFile,readdir} from 'fs';
import {join,resolve,basename,dirname} from 'path';
import {cacheCb} from '../core/cacheFn.js';

const watch0=(path,cb)=>{
  try {
    console.log('<',path);
    const watcher=watch(path,cb);
    console.log('>',path);
    return ()=>watcher.close();
  } catch(e) {
    console.log('>>',path);
    return ()=>{};
  }
};

const watch1=(path,cb)=>{
  const base=basename(path); const dir=dirname(path);
  let clearFileWatch,clearDirWatch;
  const check=(on,invalid)=>{
    if(invalid){ clearFileWatch && clearFileWatch(); clearFileWatch=null; }
    if(on) { clearFileWatch=clearFileWatch||watch0(path,cb1); }
    else   { clearDirWatch =clearDirWatch ||watch1(dir,cb2);  }
    console.log('<~~<',path);
    access(path,(e)=>{
      if(e) { // path does not exist.
        if(!clearDirWatch) { check(false); }
        else {
          clearFileWatch && clearFileWatch(); clearFileWatch=null;
          cb('off');
        }
      } else { // path does exist.
        if(!clearFileWatch) { check(true); }
        else {
          clearDirWatch && clearDirWatch(); clearDirWatch=null;
          cb('on');
        }
      }
    });
    console.log('>~~>',path);
  };
  const cb1=(event,file)=>{
    if(event==='rename' && file===base) { check(false,true); }
    else { cb(event,file); }
  };
  const cb2=(event,file)=>{
    if(event==='off') { return; }
    if(file===base || file===undefined) { check(true); }
  };

  check(true);
  return ()=>{
    clearFileWatch && clearFileWatch();
    clearDirWatch  && clearDirWatch();
  };
};

const diff0=(a,b)=>a!==b;
const watch2=(path,trafo,norm,cmp,cb)=>{ try {
  let old;
  console.log('<--<',path);
  path=resolve(path);
  console.log('>-->',path);
  return watch1(path,()=>{
    console.log('<*<',path);
    trafo(path,(error,res)=>{
      if(!error && res && norm) { res=norm(res); }
      if(!old || !res || cmp(old,res)) {
        cb(error,old=res);
      }
    });
    console.log('>*>',path);
  });
} catch(e) { console.log("=====",e); throw(e);}}

export const pathExists=cacheCb((yomo,cb,path)=>
  watch2(path,fileExists,null,diff0,cb)
);
const fileExists=(path,cb)=>access(path,(err)=>cb(null,!err));

export const xRdJson=(yomo,path)=>JSON.parse(xRdTxt(yomo,path));
export const xRdTxt=(yomo,path)=>xRdBuffer(yomo,path).toString();

export const xRdBuffer=cacheCb((yomo,cb,path)=>
  watch2(path,readFile,null,Buffer.compare,cb));
export const xRdDir=cacheCb((yomo,cb,path)=>
  watch2(path,readdir,(a)=>a.sort(),arraysDiffer,cb));

const arraysDiffer=(a,b)=>{
  if(a.length != b.length) { return true; }
  for(let i=0; i<a.length; i++) {
    if(a[i]!==b[i]){ return true; }
  }
  return false;
}
