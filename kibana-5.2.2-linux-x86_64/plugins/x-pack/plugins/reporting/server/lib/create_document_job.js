import moment from 'moment';
import { get } from 'lodash';
import esqueueEvents from 'esqueue/lib/constants/events';
import { constants } from './constants';
import { getUserFactory } from './get_user';
import { getObjectQueueFactory } from './get_object_queue';
import { cryptoFactory } from './crypto';
import { oncePerServer } from './once_per_server';

function createDocumentJobFn(server) {
  const jobQueue = server.plugins.reporting.queue;
  const filterHeaders = server.plugins.elasticsearch.filterHeaders;
  const queueConfig = server.config().get('xpack.reporting.queue');
  const whitelistHeaders = server.config().get('elasticsearch.requestHeadersWhitelist');

  const getObjectQueue = getObjectQueueFactory(server);
  const getUser = getUserFactory(server);
  const crypto = cryptoFactory(server);

  const { JOBTYPES } = constants;
  const jobTypes = {};

  jobTypes[JOBTYPES.PRINTABLE_PDF] = async function (objectType, request) {
    const date = moment().toISOString();
    const objId = request.params.savedId;
    const query = request.query;

    const headers = get(request, 'headers');
    const serializedEncryptedHeaders = await crypto.encrypt(headers);

    return getUser(request)
    .then((user) => {
      // get resulting kibana saved object documents
      return getObjectQueue(request, objectType, objId)
      .then(function (objectQueue) {
        server.log(['reporting', 'debug'], `${objectQueue.objects.length} saved object(s) to process`);

        const savedObjects = objectQueue.objects.map((savedObj) => savedObj.toJSON(query));

        const payload = {
          id: objectQueue.id,
          title: objectQueue.title,
          description: objectQueue.description,
          type: objectQueue.type,
          objects: savedObjects,
          date,
          query,
          headers: serializedEncryptedHeaders,
        };

        const options = {
          timeout: queueConfig.timeout * objectQueue.objects.length,
          created_by: get(user, 'username', false),
          headers: filterHeaders(headers, whitelistHeaders),
        };

        return { payload, options };
      })
      .then(params => {
        const { payload, options } = params;

        return new Promise((resolve, reject) => {
          const job = jobQueue.addJob(JOBTYPES.PRINTABLE_PDF, payload, options);
          job.on(esqueueEvents.EVENT_JOB_CREATED, () => resolve(job));
          job.on(esqueueEvents.EVENT_JOB_CREATE_ERROR, reject);
        });
      });
    });
  };

  return jobTypes;
}

export const createDocumentJobFactory = oncePerServer(createDocumentJobFn);
