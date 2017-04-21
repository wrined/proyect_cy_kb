/**
 * Controller for Advanced Index Detail
 */
import _ from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './index_advanced_template.html';

function getPageData(timefilter, globalState, $route, $http, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/indices/${$route.current.params.index}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    shards: false,
    metrics: [
      {
        name: 'index_1',
        keys: [
          'index_mem_overall_1',
          'index_mem_stored_fields',
          'index_mem_doc_values',
          'index_mem_norms'
        ]
      },
      {
        name: 'index_2',
        keys: [
          'index_mem_overall_2',
          'index_mem_terms',
          'index_mem_points'
        ]
      },
      {
        name: 'index_3',
        keys: [
          'index_mem_overall_3',
          'index_mem_fixed_bit_set',
          'index_mem_term_vectors',
          'index_mem_versions'
        ]
      },
      {
        name: 'index_4',
        keys: [
          'index_mem_query_cache_4',
          'index_mem_request_cache',
          'index_mem_fielddata',
          'index_mem_writer'
        ]
      },
      {
        name: 'index_total',
        keys: [
          'index_searching_total',
          'index_indexing_total'
        ]
      },
      {
        name: 'index_time',
        keys: [
          'index_searching_time',
          'index_indexing_primaries_time',
          'index_indexing_total_time'
        ]
      },
      {
        name: 'index_throttling',
        keys: [
          'index_throttling_indexing_primaries_time',
          'index_throttling_indexing_total_time'
        ]
      },
      {
        name: 'index_refresh',
        keys: [
          'index_segment_refresh_primaries_time',
          'index_segment_refresh_total_time'
        ]
      },
      {
        name: 'index_disk',
        keys: [
          'index_store_primaries_size',
          'index_store_total_size',
          'index_segment_merge_primaries_size',
          'index_segment_merge_total_size'
        ]
      },
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

uiRoutes.when('/elasticsearch/indices/:index/advanced', {
  template,
  resolve: {
    clusters: function (Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

const uiModule = uiModules.get('monitoring', []);
uiModule.controller('esIndexAdvanced', (
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
  title($scope.cluster, `Elasticsearch - Indices - ${$scope.indexName} - Advanced`);

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
