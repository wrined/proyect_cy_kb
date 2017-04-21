import 'plugins/reporting/directives/export_config';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import navbarExtensions from 'ui/registry/navbar_extensions';

function dashboardReportProvider(Private) {
  const xpackInfo = Private(XPackInfoProvider);
  return {
    appName: 'dashboard',

    key: 'reporting-dashboard',
    label: 'Reporting',
    template: '<export-config object-type="Dashboard"></export-config>',
    description: 'Dashboard Report',
    hideButton: () => !xpackInfo.get('features.reporting.showLinks', false),
    disableButton: () => !xpackInfo.get('features.reporting.enableLinks', false),
    tooltip: () => xpackInfo.get('features.reporting.message')
  };
}

navbarExtensions.register(dashboardReportProvider);
