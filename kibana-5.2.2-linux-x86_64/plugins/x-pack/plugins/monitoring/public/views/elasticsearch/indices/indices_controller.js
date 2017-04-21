/**
 * Controller for Index Listing
 */
import _ from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import template from 'plugins/monitoring/views/elasticsearch/indices/indices_template.html';

function getPageData(timefilter, globalState, $http, Private, features) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/indices`;
  const showSystemIndices = features.isEnabled('showSystemIndices', false);

  return $http.post(url, {
    showSystemIndices,
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    listingMetrics: [
      'index_document_count',
      'index_size',
      'index_search_request_rate',
      'index_request_rate_primary'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });
}

uiRoutes.when('/elasticsearch/indices', {
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
uiModule.controller('indices',
($route, globalState, timefilter, $http, title, Private, $executor, features, monitoringClusters, $scope) => {

  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  title($scope.cluster, 'Elasticsearch - Indices');
  $scope.pageData = $route.current.locals.pageData;

  const callPageData = _.partial(getPageData, timefilter, globalState, $http, Private, features);

  // Control whether system indices shown in the index listing
  // shown by default, and setting is stored in localStorage
  $scope.showSystemIndices = features.isEnabled('showSystemIndices', false);
  $scope.toggleShowSystemIndices = (isChecked) => {
    // flip the boolean
    $scope.showSystemIndices = isChecked;
    // preserve setting in localStorage
    features.update('showSystemIndices', isChecked);
    // update the page
    callPageData().then((pageData) => $scope.pageData = pageData);
  };

  $executor.register({
    execute: () => callPageData(),
    handleResponse: (pageData) => $scope.pageData = pageData
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
