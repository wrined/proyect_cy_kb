import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import template from 'plugins/monitoring/views/no_data/no_data_template.html';

uiRoutes.when('/no-data', {
  template,
  resolve: {
    clusters: (monitoringClusters, kbnUrl, Promise) => {
      return monitoringClusters()
      .then(clusters => {
        if (clusters.length) {
          kbnUrl.changePath('/home');
          return Promise.reject();
        }
        return Promise.resolve();
      });
    }
  }
})
.otherwise({ redirectTo: '/home' });

const uiModule = uiModules.get('monitoring', [ 'monitoring/directives' ]);
uiModule.controller('noData', (kbnUrl, $executor, monitoringClusters, timefilter, $scope) => {
  $scope.hasData = false; // control flag to control a redirect
  timefilter.enabled = true;

  timefilter.on('update', () => {
    // re-fetch if they change the time filter
    $executor.run();
  });

  $scope.$watch('hasData', hasData => {
    if (hasData) {
      kbnUrl.redirect('/home');
    }
  });

  // Register the monitoringClusters service.
  $executor.register({
    execute: function () {
      return monitoringClusters();
    },
    handleResponse: function (clusters) {
      if (clusters.length) {
        // use the control flag because we can't redirect from inside here
        $scope.hasData = true;
      }
    }
  });

  // Start the executor
  $executor.start();

  // Destory the executor
  $scope.$on('$destroy', $executor.destroy);
});

