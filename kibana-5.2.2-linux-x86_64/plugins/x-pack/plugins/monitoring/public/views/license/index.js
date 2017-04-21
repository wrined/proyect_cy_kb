import _ from 'lodash';
import uiModules from 'ui/modules';
import uiRoutes from'ui/routes';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from 'plugins/monitoring/views/license/index.html';

uiRoutes.when('/license', {
  template,
  resolve: {
    clusters(Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    }
  }
});

const uiModule = uiModules.get('monitoring', [ 'monitoring/directives' ]);
uiModule.controller('licenseView', ($route, globalState, title, timefilter, $scope, $window) => {
  timefilter.enabled = false;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  title($scope.cluster, 'License');

  $scope.isExpired = (new Date()).getTime() > _.get($scope, 'cluster.license.expiry_date_in_millis');

  $scope.goBack = function () {
    $window.history.back();
  };
});
