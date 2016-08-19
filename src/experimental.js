import {cacheSlow,cacheFnu} from './core/cacheFn.js';
import {reuse,combineReducers} from './util/reuse.js';
import {linkPipes,pipes,getPipe} from './core/pipes.js';
import {getBuffer,getText,getJSON} from './util/getx.js';
import {delay,ticks} from './util/time.js';

import {mqttIpc} from './core/mqtt-ipc';
import {ipcBridge} from './core/bridge.js';
const yomoBridge=(bSpec,ipcSpec)=>
  ipcBridge(mqttIpc,bSpec,ipcSpec);

export {
  yomoBridge,              // try and approve
  linkPipes,pipes,getPipe, // review, approve or sep package
  cacheSlow,               // review API, improve implementation
  cacheFnu,                // keep internal

  reuse,combineReducers,     // release as separate package
  getBuffer,getText,getJSON, // release as separate package
  delay,ticks,               // release as separate package
};

