import {yomoApp0} from './core/app.js';
import {yomoReact,yomoView} from './core/react-yomo.js';
import {cacheFn,cacheAsync,yomoAuditor,yomoRunner}
  from './core/cacheFn.js';
import {yomoIcons} from './util/icons.js';

const yomoApp=yomoApp0({...yomoReact,...yomoIcons},true);
export {
  yomoApp,yomoView,
  cacheFn,cacheAsync,
  yomoAuditor,yomoRunner
};
