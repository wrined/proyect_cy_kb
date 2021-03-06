/**
 * Logstash Overview
 */
import { find } from 'lodash';
import uiRoutes from'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './overview_template.html';

function getPageData(timefilter, globalState, $http, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/logstash`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      'logstash_cluster_events_input_rate',
      'logstash_cluster_events_output_rate',
      'logstash_cluster_events_latency'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });
}

uiRoutes.when('/logstash', {
  template,
  resolve: {
    clusters: function (Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

const uiModule = uiModules.get('monitoring', [ 'monitoring/directives' ]);
uiModule.controller('logstashOverview', ($route, globalState, title, Private, $executor, $http, timefilter, $scope) => {
  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, 'Logstash');

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $http, Private),
    handleResponse: (response) => $scope.pageData = response
  });
  $executor.start();
  $scope.$on('$destroy', $executor.destroy);
});
