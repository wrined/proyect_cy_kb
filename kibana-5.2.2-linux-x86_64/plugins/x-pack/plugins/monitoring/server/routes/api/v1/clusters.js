import Promise from 'bluebird';
import _ from 'lodash';
import Joi from 'joi';
import getLastRecovery from '../../../lib/get_last_recovery';
import calculateIndices from '../../../lib/calculate_indices';
import getClusters from '../../../lib/get_clusters';
import getClustersStats from '../../../lib/get_clusters_stats';
import getClustersHealth from '../../../lib/get_clusters_health';
import getPrimaryClusterUuid from '../../../lib/get_primary_cluster_uuid';
import getKibanasForClusters from '../../../lib/get_kibanas_for_clusters';
import calculateOverallStatus from '../../../lib/calculate_overall_status';
import getLastState from '../../../lib/get_last_state';
import getClusterStatus from '../../../lib/get_cluster_status';
import getMetrics from '../../../lib/details/get_metrics';
import getShardStats from '../../../lib/get_shard_stats';
import calculateClusterShards from '../../../lib/elasticsearch/calculate_cluster_shards';
import handleError from '../../../lib/handle_error';
import getLogstashForClusters from '../../../lib/logstash/get_logstash_for_clusters';

// manipulate cluster status and license meta data
function normalizeClustersData(clusters) {
  clusters.forEach(cluster => {
    cluster.elasticsearch = {
      status: cluster.status,
      stats: cluster.stats,
      nodes: cluster.nodes,
      indices: cluster.indices
    };
    cluster.status = calculateOverallStatus([
      cluster.elasticsearch.status,
      cluster.kibana && cluster.kibana.status || null
    ]);
    delete cluster.stats;
    delete cluster.nodes;
    delete cluster.indices;
  });

  // if all clusters are basic, UI will allow the user to get into the primary cluster
  const basicClusters = clusters.filter((cluster) => {
    return cluster.license && cluster.license.type === 'basic';
  });
  if (basicClusters.length === clusters.length) {
    clusters.forEach((cluster) => {
      _.set(cluster, 'allBasicClusters', true);
    });
  }

  return clusters;
}

export default function clustersRoutes(server) {
  const config = server.config();
  const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');
  const kbnIndexPattern = config.get('xpack.monitoring.kibana.index_pattern');
  const logstashIndexPattern = config.get('xpack.monitoring.logstash.index_pattern');
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('monitoring');

  function getClustersFromRequest(req) {
    const start = req.payload.timeRange.min;
    const end = req.payload.timeRange.max;
    return Promise.all([
      calculateIndices(req, start, end, esIndexPattern),
      calculateIndices(req, start, end, kbnIndexPattern),
      calculateIndices(req, start, end, logstashIndexPattern)
    ])
    .then(([esIndices, kibanaIndices, logstashIndices]) => {
      return getClusters(req, esIndices)
      .then(getClustersStats(req))
      .then(getClustersHealth(req))
      .then(getPrimaryClusterUuid(req))
      .then(clusters => {
        const mapClusters = getKibanasForClusters(req, kibanaIndices);
        return mapClusters(clusters)
        .then(kibanas => {
          // add the kibana data to each cluster
          kibanas.forEach(kibana => {
            const clusterIndex = _.findIndex(clusters, { cluster_uuid: kibana.clusterUuid });
            _.set(clusters[clusterIndex], 'kibana', kibana.stats);
          });
          return clusters;
        });
      })
      .then(clusters => {
        const mapClusters = getLogstashForClusters(req, logstashIndices);
        return mapClusters(clusters)
        .then(logstashes => {
          // add the logstash data to each cluster
          logstashes.forEach(logstash => {
            const clusterIndex = _.findIndex(clusters, { cluster_uuid: logstash.clusterUuid });
            _.set(clusters[clusterIndex], 'logstash', logstash.stats);
          });
          return clusters;
        });
      })
      .then(clusters => normalizeClustersData(clusters))
      .then(clusters => _.sortBy(clusters, 'cluster_name'));
    });
    // reply() and catch() is handled by the caller
  }

  /*
   * Monitoring Home, Route Init
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters',
    config: {
      validate: {
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required()
        })
      }
    },
    handler: (req, reply) => {
      return getClustersFromRequest(req)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

  /*
   * Elasticsearch Overview
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required()
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      calculateIndices(req, start, end, esIndexPattern)
      .then(indices => {
        return getLastState(req, indices)
        .then(lastState => {
          return Promise.props({
            clusterStatus: getClusterStatus(req, indices, lastState),
            metrics: getMetrics(req, indices),
            shardStats: getShardStats(req, indices, lastState),
            shardActivity: getLastRecovery(req, indices)
          });
        });
      })
      .then(calculateClusterShards)
      .then(reply)
      .catch(() => reply([]));
    }
  });

  /*
   * Phone Home Data Gathering
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters_stats',
    config: {
      validate: {
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required()
        })
      }
    },
    handler: (req, reply) => {
      return getClustersFromRequest(req)
      .then(reply)
      .catch(() => {
        // ignore errors, return empty set and a 200
        reply([]).code(200);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/info',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        })
      }
    },
    handler: (req, reply) => {
      const params = {
        index: config.get('xpack.monitoring.index'),
        type: 'cluster_info',
        id: req.params.clusterUuid
      };
      return callWithRequest(req, 'get', params)
      .then(resp => {
        const fields = [
          'cluster_uuid',
          'timestamp',
          'cluster_name',
          'version',
          'license',
          'cluster_stats',
          'stack_stats'
        ];
        reply(_.pick(resp._source, fields));
      })
      .catch(err => reply(handleError(err, req)));
    }
  });
};
