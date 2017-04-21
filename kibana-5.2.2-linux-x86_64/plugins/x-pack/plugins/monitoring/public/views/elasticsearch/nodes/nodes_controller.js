/**
 * Controller for Node Listing
 */
import _ from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from 'plugins/monitoring/views/elasticsearch/nodes/nodes_template.html';

function getPageData(timefilter, globalState, $http, Private, showCgroupMetricsElasticsearch) {

  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/nodes`;

  const cpuListingMetrics = (() => {
    if (showCgroupMetricsElasticsearch) {
      return [
        'node_cgroup_quota',
        'node_cgroup_throttled'
      ];
    }
    return [
      'node_cpu_utilization',
      'node_load_average'
    ];
  })();

  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    listingMetrics: [
      ...cpuListingMetrics,
      'node_jvm_mem_percent',
      'node_free_space'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });

}

uiRoutes.when('/elasticsearch/nodes', {
  template,
  resolve: {
    clusters: function (Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

const uiModule = uiModules.get('monitoring', [ 'plugins/monitoring/directives' ]);
uiModule.controller('nodes',
($route, timefilter, globalState, title, Private, $executor, $http, monitoringClusters, $scope, showCgroupMetricsElasticsearch) => {

  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, 'Elasticsearch - Nodes');

  const callPageData = _.partial(getPageData, timefilter, globalState, $http, Private, showCgroupMetricsElasticsearch);

  $executor.register({
    execute: () => callPageData(),
    handleResponse: (response) => $scope.pageData = response
  });

  $executor.register({
    execute: () => monitoringClusters(),
    handleResponse: setClusters
  });

  // Start the executor
  $executor.start();

  // Destory the executor
  $scope.$on('$destroy', $executor.destroy);

});
