/*
 * Logstash Node
 */
import _ from 'lodash';
import uiRoutes from'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './node_template.html';

function getPageData(timefilter, globalState, $http, $route, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/logstash/node/${$route.current.params.uuid}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      {
        name: 'logstash_os_load',
        keys: [
          'logstash_os_load_1m',
          'logstash_os_load_5m',
          'logstash_os_load_15m'
        ]
      },
      'logstash_events_input_rate',
      'logstash_events_output_rate',
      'logstash_events_latency',
      'logstash_node_cpu_utilization',
      {
        name: 'logstash_jvm_usage',
        keys: [
          'logstash_node_jvm_mem_max_in_bytes',
          'logstash_node_jvm_mem_used_in_bytes'
        ]
      }
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });
}

uiRoutes.when('/logstash/node/:uuid', {
  template,
  resolve: {
    clusters(Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

const uiModule = uiModules.get('monitoring', [ 'monitoring/directives' ]);
uiModule.controller('logstashNode', ($route, globalState, title, Private, $executor, $http, timefilter, $scope) => {
  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, `Logstash - ${$scope.pageData.nodeSummary.name}`);

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $http, $route, Private),
    handleResponse: (response) => $scope.pageData = response
  });
  $executor.start();
  $scope.$on('$destroy', $executor.destroy);
});
