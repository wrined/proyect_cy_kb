/**
 * Controller for single index detail
 */
import _ from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import template from 'plugins/monitoring/views/elasticsearch/index/index_template.html';

uiRoutes.when('/elasticsearch/indices/:index', {
  template,
  resolve: {
    clusters: function (Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

function getPageData(timefilter, globalState, $route, $http, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/indices/${$route.current.params.index}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    metrics: [
      'index_search_request_rate',
      {
        name: 'index_request_rate',
        keys: [
          'index_request_rate_total',
          'index_request_rate_primary'
        ]
      },
      'index_size',
      {
        name: 'index_mem',
        keys: [ 'index_mem_overall' ],
        config: 'xpack.monitoring.chart.elasticsearch.index.index_memory'
      },
      'index_document_count',
      {
        name: 'index_segment_count',
        keys: [
          'index_segment_count_primaries',
          'index_segment_count_total'
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

const uiModule = uiModules.get('monitoring', []);
uiModule.controller('esIndex', (
  timefilter, $route, title, Private, globalState, $executor, $http, monitoringClusters, $scope
) => {
  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);

  $scope.pageData = $route.current.locals.pageData;
  $scope.indexName = $route.current.params.index;
  title($scope.cluster, `Elasticsearch - Indices - ${$scope.indexName} - Overview`);

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $route, $http, Private),
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
