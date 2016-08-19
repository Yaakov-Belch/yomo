import {cacheSlow,onOffAction,onOffActionShared,}
  from './core/cacheFn.js';
import {reuse,combineReducers} from './util/reuse.js';
import {linkPipes,pipes,getPipe} from './core/pipes.js';
import {getBuffer,getText,getJSON} from './util/getx.js';
import {delay,ticks} from './util/time.js';

import {mqttIpc} from './core/mqtt-ipc';
import {ipcBridge} from './core/bridge.js';
const yomoBridge=(bSpec,ipcSpec)=>
  ipcBridge(mqttIpc,bSpec,ipcSpec);

export {
  yomoBridge,              // review and approve
  linkPipes,pipes,getPipe, // review, approve or sep package
  onOffAction,onOffActionShared, // review and approve
  cacheSlow,               // review API, improve implementation

  reuse,combineReducers,     // release as separate package
  getBuffer,getText,getJSON, // release as separate package
  delay,ticks,               // release as separate package
};

