import { getSavedObjects } from './get_saved_objects';
import { oncePerServer } from './once_per_server';

function getObjectQueueFn(server) {
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('admin');
  const config = server.config();
  const requestConfig = Object.assign({
    'kibanaApp': config.get('server.basePath') + config.get('xpack.reporting.kibanaApp'),
    'kibanaIndex': config.get('kibana.index'),
    'protocol': server.info.protocol,
    'hostname': config.get('server.host'),
    'port': config.get('server.port'),
  }, config.get('xpack.reporting.kibanaServer'));

  const savedObjects = getSavedObjects(callWithRequest, requestConfig);

  function formatObject(parent, objects) {
    return Object.assign({
      id: parent.id,
      title: parent.title,
      description: parent.description,
      type: parent.type,
      objects
    });
  }

  function getDashboardPanels(request, savedObj) {
    try {
      const panels = JSON.parse(savedObj.panelsJSON);
      return panels.map((panel) => {
        return savedObjects.get(request, panel.type, panel.id)
        .then(function (obj) {
          obj.panelIndex = panel.panelIndex;
          return obj;
        });
      });
    } catch (e) {
      throw new Error('Failed to retrieve Panels from Saved Dashboard: ' + e.message);
    }
  }

  return function getObjectQueue(request, type, objId) {
    if (type === 'dashboard') {
      return savedObjects.get(request, type, objId, [ 'panelsJSON'])
      .then(function (savedObj) {
        const panelObjects = getDashboardPanels(request, savedObj);

        return Promise.all(panelObjects)
        .then((objs) => formatObject(savedObj, objs));
      });
    }

    return Promise.resolve(savedObjects.get(request, type, objId))
    .then((savedObj) => formatObject(savedObj, [ savedObj ]));
  };
}

export const getObjectQueueFactory = oncePerServer(getObjectQueueFn);
