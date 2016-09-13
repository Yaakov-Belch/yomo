import {
  cacheSlow,onOffAction,onOffActionShared,yomoRun,yomoAuditor
} from './core/cacheFn.js';
import {linkPipes,pipes,getPipe} from './core/pipes.js';
import {dispatchAfter,timeNow} from './core/time.js';
import {reuse,combineReducers} from './util/reuse.js';
import {getBuffer,getText,getJSON} from './util/getx.js';
import {delay,ticks} from './util/time2.js';
import {persistRedux} from './util/persist.js';

import {mqttIpc} from './core/mqtt-ipc';
import {ipcBridge} from './core/bridge.js';
const yomoBridge=(bSpec,ipcSpec)=>
  ipcBridge(mqttIpc,bSpec,ipcSpec);

import {
  WaitIcon,DelayIcon,OkIcon,UserErrorIcon,ProgramErrorIcon
} from './core/react-yomo.js';
import {connCheck} from './util/connCheck.js';
import {yomoSelector,yomoDispatcher} from './core/component.js';

export {
  yomoSelector,yomoDispatcher, // review and approve
  yomoBridge,              // review and approve
  linkPipes,pipes,getPipe, // review, approve or sep package
  onOffAction,onOffActionShared, // review and approve
  cacheSlow,               // review API, improve implementation
  yomoAuditor,             // API changes with yomo components
  yomoRun,                 // functionality not clear
  dispatchAfter,           // API changes with yomo components
  timeNow,                 // review, approve
  persistRedux,            // review, approve

  reuse,combineReducers,     // release as separate package
  getBuffer,getText,getJSON, // release as separate package
  delay,ticks,               // release as separate package
  connCheck,                 // separate package?

  // release as separate package:
  WaitIcon,DelayIcon,OkIcon,UserErrorIcon,ProgramErrorIcon,
};

