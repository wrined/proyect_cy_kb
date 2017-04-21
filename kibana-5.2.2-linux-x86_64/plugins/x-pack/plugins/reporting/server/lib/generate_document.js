import { unlink } from 'fs';
import { capitalize } from 'lodash';
import { getTimeFilterRange } from './get_time_filter_range';
import { pdf } from './pdf';
import { oncePerServer } from './once_per_server';
import { getScreenshotFactory } from './get_screenshot';

function generateDocumentFn(server) {
  const getScreenshot = getScreenshotFactory(server);
  const warningLog = (msg) => server.log(['reporting', 'warning'], msg);

  return {
    printablePdf: printablePdf,
  };

  function cleanImages(cleanupPaths) {
    return Promise.all(cleanupPaths.map(imagePath => {
      return new Promise((resolve, reject) => {
        return unlink(imagePath, (err) => {
          if (err) { return reject(err); }
          resolve();
        });
      });
    }))
    .catch((err) => {
      // any failures to remove images are silently swallowed
      warningLog(`Failed to remove screenshot image: ${err.path}`);
    });
  }

  function printablePdf(title, savedObjects, query, headers) {
    const pdfOutput = pdf.create();

    if (title) {
      const timeRange = getTimeFilterRange(savedObjects, query);
      title += (timeRange) ? ` — ${timeRange.from} to ${timeRange.to}` : '';
      pdfOutput.setTitle(title);
    }

    return Promise.all(savedObjects.map((savedObj) => {
      if (savedObj.isMissing) {
        return  { savedObj };
      } else {
        return getScreenshot(savedObj.url, savedObj.type, headers)
        .then((imagePath) => {
          server.log(['reporting', 'debug'], `${savedObj.id} -> ${imagePath}`);
          return { imagePath, savedObj };
        });
      }
    }))
    .then(objects => {
      const cleanupPaths = [];

      objects.forEach(object => {
        const { imagePath, savedObj } = object;
        if (imagePath) cleanupPaths.push(imagePath);

        if (savedObj.isMissing) {
          pdfOutput.addHeading(`${capitalize(savedObj.type)} with id '${savedObj.id}' not found`, {
            styles: 'warning'
          });
        } else {
          pdfOutput.addImage(imagePath, {
            title: savedObj.title,
            description: savedObj.description,
          });
        }
      });

      return cleanupPaths;
    })
    .then(cleanupPaths => {
      try {
        const pdfInstance = pdfOutput.generate();
        return cleanImages(cleanupPaths).then(() => pdfInstance);
      } catch (err) {
        return cleanImages(cleanupPaths).then(() => { throw err; });
      }
    });
  };
}

export const generateDocumentFactory = oncePerServer(generateDocumentFn);
