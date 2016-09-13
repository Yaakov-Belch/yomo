const WeakMap=require('es6-weak-map');

// indexKey(data) provides a "unique string" to be used as a
// cache key.  This is similar to JSON.stringify, except:
// * different format
// * object keys are sorted (this is important for caching)
// * undefined,null,boolean,NaN,Infinity are supported

// indexFast(obj)
// * This makes obj valid for indexKey (assign a unique id).
// * Now, lookup is by unique id, not recursive.

let   idCounter=0;
const fast=new WeakMap();
export const indexFast=(obj)=>{
  fast.has(obj) || fast.set(obj,`!${(idCounter++).toString(36)};`);
  return obj;
};

export const indexKey=(data)=>{
  let res=fast.get(data); if(res){ return res; }
  switch(toString.apply(data)) {
    case '[object Undefined]': return 'U';
    case '[object Null]':      return 'N';
    case '[object Boolean]':   return data? 'T':'F';
    case '[object Number]':    return `=${data};`
    case '[object String]':
      return `s${data.replace(/\u0000/g,"\u0000:")}\u0000\u0000`;
    case '[object Object]':
      return `{${Object.keys(data).sort().map(k=>
        indexKey(k)+indexKey(data[k])
      ).join('')}}`
    case '[object Array]':
      return `[${[].map.call(data,v=>indexKey(v)).join('')}]`
    default:
      throw new Error(`no indexKey for ${toString.apply(data)}`);
  }
};

