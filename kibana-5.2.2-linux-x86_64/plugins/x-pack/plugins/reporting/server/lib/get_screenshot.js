import queue from 'queue';
import { oncePerServer } from './once_per_server';
import { screenshot } from './screenshot';
import { createTaggedLogger } from './create_tagged_logger';

// bounding boxes for various saved object types
const boundingBoxes = {
  visualization: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  search: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 16, // scrollbar in discover refuses to hide with ::-webkit-scrollbar css rule
  },
};

function getScreenshotFn(server) {
  const config = server.config();

  const logger = createTaggedLogger(server, ['reporting', 'debug']);

  const phantomPath = server.plugins.reporting.phantom.binary;
  const captureSettings = config.get('xpack.reporting.capture');
  const screenshotSettings = { basePath: config.get('server.basePath'), imagePath: config.get('path.data') };
  const captureConcurrency = captureSettings.concurrency;
  logger(`Screenshot concurrency: ${captureConcurrency}`);

  // init the screenshot module
  const ss = screenshot(phantomPath, captureSettings, screenshotSettings, logger);

  // create the process queue
  const screenshotQueue = queue({ concurrency: captureConcurrency });

  return function getScreenshot(objUrl, type, headers) {
    return new Promise(function (resolve, reject) {
      screenshotQueue.push(function (cb) {
        return ss.capture(objUrl, {
          headers,
          bounding: boundingBoxes[type],
        })
        .then((filename) => {
          resolve(filename);
          cb();
        }, (err) => {
          screenshotQueue.end(err);
          reject(err);
          cb();
        });
      });

      if (!screenshotQueue.running) screenshotQueue.start();
    });
  };
};

export const getScreenshotFactory = oncePerServer(getScreenshotFn);
