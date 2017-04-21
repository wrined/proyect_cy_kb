/* Calls the _fieldStats API on a given index pattern
 */
import _ from 'lodash';
import moment from 'moment';
import checkMonitoringAuth from './check_monitoring_auth';

export default async function calculateIndices(req, start, end, indexPattern) {
  const config = req.server.config();
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');

  // Tests access to the monitoring data index. Throws if there is a 401
  await checkMonitoringAuth(req, indexPattern);

  const countResults = await callWithRequest(req, 'count', {
    index: indexPattern,
    ignore: [404]
  });

  if (countResults.status === 404) {
    // no relevant indices exist for the index pattern
    return [];
  }

  // get the set of indices with data for the time range
  const options = {
    index: indexPattern,
    level: 'indices',
    ignoreUnavailable: true,
    body: {
      fields: ['timestamp'],
      index_constraints: {
        timestamp: {
          max_value: { gte: moment.utc(start).toISOString() },
          min_value: { lte: moment.utc(end).toISOString() }
        }
      }
    }
  };
  const resp = await callWithRequest(req, 'fieldStats', options);
  const indices = _.map(resp.indices, (_info, index) => index);
  if (indices.length === 0) {
    // there are no relevant indices for the given timeframe in the data
    return [];
  }
  return indices.filter(index => index !== config.get('xpack.monitoring.index'));
};
