import uiRoutes from 'ui/routes';
import devTools from 'ui/registry/dev_tools';
import 'plugins/kibana/dev_tools/directives/dev_tools_app';

uiRoutes
.when('/dev_tools', {
  resolve: {
    redirect(Private, kbnUrl) {
      const items = Private(devTools).inOrder;
      kbnUrl.redirect(items[0].url.substring(1));
    }
  }
});

uiRoutes
.when('/test', {
  resolve: {
    redirect(Private, kbnUrl) {
      const items = Private(devTools).inOrder;
      kbnUrl.redirect(items[0].url.substring(1));
    }
  }
});
