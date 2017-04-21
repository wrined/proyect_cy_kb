import _ from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from 'plugins/monitoring/views/clusters/overview_template.html';

uiRoutes.when('/overview', {
  template,
  resolve: {
    // Data for overview for single cluster simply uses the set of clusters
    // returned from routeInit, and finds the cluster with the current UUID in
    // globalState.
    clusters: function (Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    }
  }
});

const uiModule = uiModules.get('monitoring', ['monitoring/directives']);
uiModule.controller('overview', ($scope, $route, monitoringClusters, timefilter, title, globalState, $executor) => {
  // This will show the timefilter
  timefilter.enabled = true;

  $scope.clusters = $route.current.locals.clusters;
  $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  title($scope.cluster, 'Overview');

  $executor.register({
    execute: () => monitoringClusters(),
    handleResponse(clusters) {
      $scope.cluster = _.find(clusters, { cluster_uuid: globalState.cluster_uuid });
    }
  });

  // Start the executor
  $executor.start();

  // Destory the executor
  $scope.$on('$destroy', $executor.destroy);
});
