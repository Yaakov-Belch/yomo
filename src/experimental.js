import {cacheSlow,onOffAction,onOffActionShared,yomoRun}
  from './core/cacheFn.js';
import {linkPipes,pipes,getPipe} from './core/pipes.js';
import {timeNow} from './core/time.js';
import {reuse,combineReducers} from './util/reuse.js';
import {getBuffer,getText,getJSON} from './util/getx.js';
import {delay,ticks} from './util/time2.js';

import {mqttIpc} from './core/mqtt-ipc';
import {ipcBridge} from './core/bridge.js';
const yomoBridge=(bSpec,ipcSpec)=>
  ipcBridge(mqttIpc,bSpec,ipcSpec);

import {
  WaitIcon,DelayIcon,OkIcon,UserErrorIcon,ProgramErrorIcon
} from './core/react-yomo.js';

export {
  yomoBridge,              // review and approve
  linkPipes,pipes,getPipe, // review, approve or sep package
  onOffAction,onOffActionShared, // review and approve
  cacheSlow,               // review API, improve implementation
  yomoRun,                 // review and approve
  timeNow,                 // review, select and approve

  reuse,combineReducers,     // release as separate package
  getBuffer,getText,getJSON, // release as separate package
  delay,ticks,               // release as separate package

  // release as separate package:
  WaitIcon,DelayIcon,OkIcon,UserErrorIcon,ProgramErrorIcon,
};

