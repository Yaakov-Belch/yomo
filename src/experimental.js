import {cacheSlow,yomoPeek} from './core/cacheFn.js';
import {reuse,combineReducers} from './util/reuse.js';
import {newBridge,remoteFn,linkPipes,pipes,getPipe}
  from './core/ipc.js';
import {getBuffer,getText,getJSON} from './util/getx.js';
import {delay,ticks} from './util/time.js';

export {
  cacheSlow,              // review API, improve implementation
  yomoPeek,               // remove API
  remoteFn,newBridge,getPipe,pipes,linkPipes, // refactor API
  reuse,combineReducers,  // release as separate package
  getBuffer,getText,getJSON, // release as separate package
  delay,ticks,            // release as separate package
}; 

