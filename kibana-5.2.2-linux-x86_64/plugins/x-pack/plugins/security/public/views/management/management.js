import 'plugins/security/views/management/change_password_form/change_password_form';
import 'plugins/security/views/management/index_privileges_form/index_privileges_form';
import 'plugins/security/views/management/password_form/password_form';
import 'plugins/security/views/management/users';
import 'plugins/security/views/management/roles';
import 'plugins/security/views/management/edit_user';
import 'plugins/security/views/management/edit_role';
import 'plugins/security/views/management/management.less';
import routes from 'ui/routes';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import '../../services/shield_user';

import management from 'ui/management';

routes.defaults(/\/management/, {
  resolve: {
    securityManagementSection: function (ShieldUser, Private, esDataIsTribe) {
      const xpackInfo = Private(XPackInfoProvider);
      const elasticsearch = management.getSection('elasticsearch');
      const showSecurityLinks = xpackInfo.get('features.security.showLinks');
      const tribeTooltip = 'Not available when using a tribe node.';

      function deregisterSecurity() {
        elasticsearch.deregister('users');
        elasticsearch.deregister('roles');
      }

      function registerSecurity() {
        if (!elasticsearch.hasItem('users')) {
          const options = {
            order: 10,
            display: 'Users'
          };
          if (esDataIsTribe) {
            options.tooltip = tribeTooltip;
          } else {
            options.url = '#/management/elasticsearch/users';
          }
          elasticsearch.register('users', options);
        }

        if (!elasticsearch.hasItem('roles')) {
          const options = {
            order: 20,
            display: 'Roles'
          };
          if (esDataIsTribe) {
            options.tooltip = tribeTooltip;
          } else {
            options. url = '#/management/elasticsearch/roles';
          }
          elasticsearch.register('roles', options);
        }
      }

      deregisterSecurity();
      if (!showSecurityLinks) return;

      // getCurrent will reject if there is no authenticated user, so we prevent them from seeing the security
      // management screens
      //
      // $promise is used here because the result is an ngResource, not a promise itself
      return ShieldUser.getCurrent().$promise
      .then(registerSecurity)
      .catch(deregisterSecurity);
    }
  }
});
