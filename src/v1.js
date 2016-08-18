import {yomoApp0} from './core/app.js';
import {yomoReact,yomoView} from './core/react-yomo.js';
import {cacheFn,cacheFnu,cacheAsync,yomoAuditor,yomoRunner}
  from './core/cacheFn.js';

const yomoApp=yomoApp0(yomoReact,true);
export {
  yomoApp,yomoView,
  cacheFn,cacheFnu,cacheAsync,
  yomoAuditor,yomoRunner
};
