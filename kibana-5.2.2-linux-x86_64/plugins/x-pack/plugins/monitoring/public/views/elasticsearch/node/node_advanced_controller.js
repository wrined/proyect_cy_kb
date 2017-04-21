/**
 * Controller for Advanced Node Detail
 */
import _ from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './node_advanced_template.html';

function getPageData(timefilter, globalState, $route, $http, Private) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/nodes/${$route.current.params.node}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    shards: false,
    metrics: [
      {
        name: 'node_jvm_mem',
        keys: [ 'node_jvm_mem_max_in_bytes', 'node_jvm_mem_used_in_bytes' ]
      },
      {
        name: 'node_gc',
        keys: [
          'node_jvm_gc_old_count',
          'node_jvm_gc_young_count'
        ]
      },
      {
        name: 'node_gc_time',
        keys: [
          'node_jvm_gc_old_time',
          'node_jvm_gc_young_time'
        ]
      },
      {
        name: 'node_index_1',
        keys: [
          'node_index_mem_overall_1',
          'node_index_mem_stored_fields',
          'node_index_mem_doc_values',
          'node_index_mem_norms'
        ]
      },
      {
        name: 'node_index_2',
        keys: [
          'node_index_mem_overall_2',
          'node_index_mem_terms',
          'node_index_mem_points'
        ]
      },
      {
        name: 'node_index_3',
        keys: [
          'node_index_mem_overall_3',
          'node_index_mem_fixed_bit_set',
          'node_index_mem_term_vectors',
          'node_index_mem_versions'
        ]
      },
      {
        name: 'node_index_4',
        keys: [
          'node_index_mem_query_cache_4',
          'node_index_mem_request_cache',
          'node_index_mem_fielddata',
          'node_index_mem_writer'
        ]
      },
      {
        name: 'node_request_total',
        keys: [
          'node_search_total',
          'node_index_total'
        ]
      },
      {
        name: 'node_index_time',
        keys: [
          'node_index_time',
          'node_throttle_index_time'
        ]
      },
      {
        name: 'node_index_threads',
        keys: [
          'node_index_threads_bulk_queue',
          'node_index_threads_bulk_rejected',
          'node_index_threads_index_queue',
          'node_index_threads_index_rejected'
        ]
      },
      {
        name: 'node_read_threads',
        keys: [
          'node_index_threads_search_queue',
          'node_index_threads_search_rejected',
          'node_index_threads_get_queue',
          'node_index_threads_get_rejected'
        ]
      },
      {
        name: 'node_cpu_utilization',
        keys: [
          'node_cpu_utilization',
          'node_cgroup_quota'
        ]
      },
      {
        name: 'node_cgroup_cpu',
        keys: [
          'node_cgroup_usage',
          'node_cgroup_throttled'
        ]
      },
      {
        name: 'node_cgroup_stats',
        keys: [
          'node_cgroup_periods',
          'node_cgroup_throttled_count'
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

uiRoutes.when('/elasticsearch/nodes/:node/advanced', {
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
uiModule.controller('esNodeAdvanced', (timefilter, $route, globalState, title, Private, $executor, $http, monitoringClusters, $scope) => {
  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }

  function setPageIconLabel(pageData) {
    $scope.iconClass = pageData.nodeSummary.nodeTypeClass;
    $scope.iconLabel = pageData.nodeSummary.nodeTypeLabel;
  }

  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;

  title($scope.cluster, `Elasticsearch - Nodes - ${$scope.pageData.nodeSummary.name} - Advanced`);
  setPageIconLabel($scope.pageData);

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $route, $http, Private),
    handleResponse: (response) => {
      $scope.pageData = response;
      setPageIconLabel(response);
    }
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
