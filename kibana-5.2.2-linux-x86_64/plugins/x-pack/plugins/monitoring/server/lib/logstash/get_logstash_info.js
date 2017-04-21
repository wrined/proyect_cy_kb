import _ from 'lodash';
import calculateAvailability from './../calculate_availability';

export function handleResponse(resp) {
  const getSource = key => _.get(resp, `_source.logstash.${key}`);
  const timestamp = getSource('timestamp');
  const logstash = getSource('logstash');
  const availability = { availability: calculateAvailability(timestamp) };
  const events = { events: getSource('events')};
  const reloads = { reloads: getSource('reloads') };
  return _.merge(logstash, availability, events, reloads);
}

export default function getNodeInfo(req, uuid) {
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const config = req.server.config();
  const params = {
    index: config.get('xpack.monitoring.index'),
    type: 'logstash',
    id: uuid
  };

  return callWithRequest(req, 'get', params)
  .then(handleResponse);
}
