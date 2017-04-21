import { join, resolve } from 'path';
import Promise from 'bluebird';
import elasticsearch from 'elasticsearch';
import requireAllAndApply from '../../server/lib/require_all_and_apply';
import esHealthCheck from './server/lib/es_client/health_check';
import instantiateClient from './server/lib/es_client/instantiate_client';
import initKibanaMonitoring from './server/kibana_monitoring';

export default function monitoringIndex(kibana) {
  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch', 'xpack_main'],
    id: 'monitoring',
    configPrefix: 'xpack.monitoring',
    publicDir: resolve(__dirname, 'public'),
    uiExports: {
      app: {
        title: 'Monitoring',
        order: 9002,
        description: 'Monitoring for Elasticsearch',
        icon: 'plugins/monitoring/monitoring.svg',
        main: 'plugins/monitoring/monitoring',
        injectVars(server) {
          const config = server.config();
          return {
            maxBucketSize: config.get('xpack.monitoring.max_bucket_size'),
            minIntervalSeconds: config.get('xpack.monitoring.min_interval_seconds'),
            kbnIndex: config.get('kibana.index'),
            esApiVersion: config.get('elasticsearch.apiVersion'),
            esShardTimeout: config.get('elasticsearch.shardTimeout'),
            showLicenseExpiration: config.get('xpack.monitoring.show_license_expiration'),
            showCgroupMetricsElasticsearch: config.get('xpack.monitoring.ui.container.elasticsearch.enabled')
          };
        },
      },
      injectDefaultVars(server) {
        const config = server.config();
        return {
          statsReportUrl: config.get('xpack.monitoring.stats_report_url'),
          reportStats: config.get('xpack.monitoring.report_stats'),
          monitoringUiEnabled: config.get('xpack.monitoring.ui.enabled')
        };
      },
      hacks: [
        'plugins/monitoring/hacks/phone_home_notifications',
        'plugins/monitoring/hacks/phone_home_trigger',
        'plugins/monitoring/hacks/toggle_app_link_in_nav'
      ]
    },

    config: function (Joi) {
      const DEFAULT_REQUEST_HEADERS = [ 'authorization' ];
      const { array, boolean, number, object, string } = Joi;

      return object({
        enabled: boolean().default(true),
        ui: object({
          enabled: boolean().default(true),
          container: object({
            elasticsearch: object({
              enabled: boolean().default(false)
            }).default()
          }).default()
        }).default(),
        chart: object({
          elasticsearch: object({
            index: object({
              index_memory: array().items(string().valid(
                'index_mem_doc_values',
                'index_mem_fixed_bit_set',
                'index_mem_norms',
                'index_mem_points',
                'index_mem_stored_fields',
                'index_mem_term_vectors',
                'index_mem_terms',
                'index_mem_versions',
                'index_mem_writer',
                'index_mem_fielddata',
                'index_mem_query_cache',
                'index_mem_request_cache'
              )).max(3).unique().single().default([
                'index_mem_terms',
                'index_mem_points'
              ])
            }).default(),
            node: object({
              index_memory: array().items(string().valid(
                'node_index_mem_doc_values',
                'node_index_mem_fixed_bit_set',
                'node_index_mem_norms',
                'node_index_mem_points',
                'node_index_mem_stored_fields',
                'node_index_mem_term_vectors',
                'node_index_mem_terms',
                'node_index_mem_versions',
                'node_index_mem_writer',
                'node_index_mem_fielddata',
                'node_index_mem_query_cache',
                'node_index_mem_request_cache'
              )).max(3).unique().single().default([
                'node_index_mem_terms',
                'node_index_mem_points'
              ])
            }).default()
          }).default()
        }).default(),
        loggingTag: string().default('monitoring-ui'),
        index: string().default('.monitoring-data-2'),
        kibana: object({
          index_pattern: string().default('.monitoring-kibana-2-*'),
          collection: object({
            enabled: boolean().default(true),
            interval: number().default(10000)
          }).default()
        }).default(),
        logstash: object({
          index_pattern: string().default('.monitoring-logstash-2-*')
        }).default(),
        missing_intervals: number().default(12),
        max_bucket_size: number().default(10000),
        min_interval_seconds: number().default(10),
        show_license_expiration: boolean().default(true),
        report_stats: boolean().default(true),
        node_resolver: string().regex(/^(?:transport_address|name|uuid)$/).default('uuid'),
        stats_report_url: Joi.when('$dev', {
          is: true,
          then: string().default('../api/monitoring/v1/phone-home'),
          otherwise: string().default('https://marvel-stats.elasticsearch.com/appdata/marvelOpts')
        }),
        agent: object({
          interval: string().regex(/[\d\.]+[yMwdhms]/).default('10s')
        }).default(),
        elasticsearch: object({
          customHeaders: object().default({}),
          index_pattern: string().default('.monitoring-es-2-*'),
          logQueries: boolean().default(false),
          requestHeadersWhitelist: array().items().single().default(DEFAULT_REQUEST_HEADERS),
          url: string().uri({ scheme: ['http', 'https'] }), // if empty, use Kibana's connection config
          username: string(),
          password: string(),
          requestTimeout: number().default(30000),
          pingTimeout: number().default(30000),
          ssl: object({
            verify: boolean().default(true),
            ca: array().single().items(string()),
            cert: string(),
            key: string()
          }).default(),
          apiVersion: string().default('master'),
          engineVersion: string().valid('^5.0.0').default('^5.0.0')
        }).default()
      }).default();
    },

    init: function (server, _options) {
      const xpackMainPlugin = server.plugins.xpack_main;
      return xpackMainPlugin.status.once('green', () => {
        return Promise.all([
          instantiateClient(server, elasticsearch), // Instantiate the dedicated ES client. Dependency injection for ES for test mocking
          requireAllAndApply(join(__dirname, 'server', 'routes', '**', '*.js'), server), // Require all the routes
          initKibanaMonitoring(this.kbnServer, server), // send kibana server ops to the monitoring bulk api
          esHealthCheck(this, server).start() // Make sure the Monitoring index is created and ready
        ]);
      });
    }
  });
};
