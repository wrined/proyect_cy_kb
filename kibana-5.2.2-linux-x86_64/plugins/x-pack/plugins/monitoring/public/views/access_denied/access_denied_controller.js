import uiRoutes from 'ui/routes';
import template from 'plugins/monitoring/views/access_denied/access_denied.html';
import uiChrome from 'ui/chrome';
uiRoutes.when('/access-denied', {
  template,
  controllerAs: 'accessDenied',
  controller($window, kbnUrl, kbnBaseUrl) {
    this.goToKibana = () => {
      $window.location.href = uiChrome.getBasePath() + kbnBaseUrl;
    };

    this.retry = () => {
      return kbnUrl.redirect('/home');
    };
  }
});
