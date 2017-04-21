import path from 'path';
import getPort from 'get-port';
import Puid from 'puid';
import { phantom } from './phantom';

const puid = new Puid();
const noop = function () {};

class Screenshot {
  constructor(phantomPath, captureSettings, screenshotSettings, logger) {
    this.phantomPath = phantomPath;
    this.captureSettings = captureSettings;
    this.screenshotSettings = screenshotSettings;
    this.logger = logger || noop;
  }

  capture(url, opts) {
    this.logger(`fetching screenshot of ${url}`);
    opts = Object.assign({ basePath: this.screenshotSettings.basePath }, opts);

    return createPhantom(this.phantomPath, this.captureSettings, this.logger)
    .then(ph => {
      const filepath = getTargetFile(this.screenshotSettings.imagePath);

      return loadUrl(ph, url, this.captureSettings, opts)
      .then(() => ph.screenshot(filepath, { bounding: opts.bounding }))
      .then(() => {
        this.logger(`Screenshot saved to ${filepath}`);
        return ph.destroy().then(() => filepath);
      })
      .catch(err => {
        this.logger(`Screenshot failed ${err.message}`);
        return ph.destroy().then(() => { throw err; });
      });
    });
  }
}

function createPhantom(phantomPath, captureSettings, logger) {
  const { timeout } = captureSettings;

  return Promise.resolve(getPort())
  .then(port => {
    return phantom.create({
      ignoreSSLErrors: true,
      phantomPath: phantomPath,
      bridgePort: port,
      timeout,
      logger
    });
  });
}

function loadUrl(ph, url, captureSettings, opts) {
  const { timeout, viewport, zoom, loadDelay, settleTime } = captureSettings;
  const waitForSelector = '.application';

  return ph.open(url, {
    headers: opts.headers,
    waitForSelector,
    timeout,
    zoom,
    viewport,
  })
  .then(() => {
    return ph.evaluate(function (basePath) {
      // inject custom CSS rules
      function injectCSS(cssPath) {
        const node = document.createElement('link');
        node.rel = 'stylesheet';
        node.href = cssPath;
        document.getElementsByTagName('head')[0].appendChild(node);
      };

      injectCSS(basePath + '/plugins/reporting/styles/reporting-overrides.css');
    }, opts.basePath);
  })
  .then(() => {
    return ph.waitForSelector('[render-counter]');
  })
  .then(() => {
    // this is run in phantom
    function listenForComplete(visLoadDelay, visLoadTimeout, visSettleTime) {
      // wait for visualizations to finish loading
      const visualizations = document.querySelectorAll('[render-counter]');
      const visCount = visualizations.length;
      const renderedTasks = [];

      // used when visualizations have a render-count attribute
      function waitForRenderCount(visualization) {
        return new Promise(function (resolve, reject) {
          const CHECK_DELAY = 300;
          const start = Date.now();
          let lastRenderCount = 0;

          (function checkRenderCount() {
            const renderCount = parseInt(visualization.getAttribute('render-counter'));

            // if the timeout has exceeded, abort and reject
            if ((start + visLoadTimeout) < Date.now()) {
              return reject(new Error('Visualization took too long to load'));
            }

            // vis has rendered at least once
            if (renderCount > 0) {
              // resolve once the current and previous render count match
              if (renderCount === lastRenderCount) {
                return resolve();
              }

              // if they don't match, wait for the visualization to settle and try again
              lastRenderCount = renderCount;
              return setTimeout(checkRenderCount, visSettleTime);
            }

            setTimeout(checkRenderCount, CHECK_DELAY);
          }());
        });
      }

      // timeout resolution, used when visualizations don't have a render-count attribute
      function waitForRenderDelay() {
        return new Promise(function (resolve) {
          setTimeout(resolve, visLoadDelay);
        });
      }

      for (let i = 0; i < visCount; i++) {
        const visualization = visualizations[i];
        const renderCounter = visualization.getAttribute('render-counter');

        if (renderCounter !== 'disabled') {
          renderedTasks.push(waitForRenderCount(visualization));
        } else {
          renderedTasks.push(waitForRenderDelay());
        }
      }

      return Promise.all(renderedTasks);
    }

    return ph.evaluate(listenForComplete, loadDelay, timeout, settleTime);
  });
};

function getTargetFile(imagePath) {
  return path.join(imagePath, `screenshot-${puid.generate()}.png`);
}

export function screenshot(phantomPath, captureSettings, screenshotSettings, logger) {
  return new Screenshot(phantomPath, captureSettings, screenshotSettings, logger);
};
