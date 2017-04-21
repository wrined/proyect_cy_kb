import Esqueue from 'esqueue';
import { createWorkersFactory } from './create_workers';
import { constants } from './constants';
import { oncePerServer } from './once_per_server';

const dateSeparator = '.';

function createQueueFn(server) {
  const queueConfig = server.config().get('xpack.reporting.queue');
  const createWorkers = createWorkersFactory(server);
  const { getClient } = server.plugins.elasticsearch.getCluster('admin');

  const queueOptions = {
    doctype: constants.QUEUE_DOCTYPE,
    interval: queueConfig.indexInterval,
    timeout: queueConfig.timeout,
    dateSeparator: dateSeparator,
    client: getClient()
  };

  const queue = new Esqueue(constants.QUEUE_INDEX, queueOptions);

  createWorkers(queue);

  return queue;
}

export const createQueueFactory = oncePerServer(createQueueFn);
