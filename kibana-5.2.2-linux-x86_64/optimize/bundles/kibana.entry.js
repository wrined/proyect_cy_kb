
/**
 * Test entry file
 *
 * This is programatically created and updated, do not modify
 *
 * context: {"env":"production","urlBasePath":"","sourceMaps":false,"kbnVersion":"5.2.2","buildNum":14723}
 * includes code from:
 *  - console@kibana
 *  - elasticsearch@kibana
 *  - graph@5.2.2
 *  - kbn_doc_views@kibana
 *  - kbn_vislib_vis_types@kibana
 *  - kibana@kibana
 *  - markdown_vis@kibana
 *  - metric_vis@kibana
 *  - monitoring@5.2.2
 *  - reporting@5.2.2
 *  - search_vis@kibana
 *  - searchprofiler@5.2.2
 *  - security@5.2.2
 *  - spy_modes@kibana
 *  - status_page@kibana
 *  - table_vis@kibana
 *  - tagcloud@kibana
 *  - tilemap@5.2.2
 *  - timelion@kibana
 *  - xpack_main@5.2.2
 *
 */

require('ui/chrome');
require('plugins/kibana/kibana');
require('plugins/tilemap/vis_type_enhancers/update_tilemap_settings');
require('plugins/kbn_vislib_vis_types/kbn_vislib_vis_types');
require('plugins/markdown_vis/markdown_vis');
require('plugins/metric_vis/metric_vis');
require('plugins/search_vis/search_vis');
require('plugins/table_vis/table_vis');
require('plugins/tagcloud/tag_cloud_vis');
require('plugins/timelion/vis');
require('plugins/spy_modes/table_spy_mode');
require('plugins/spy_modes/req_resp_stats_spy_mode');
require('plugins/reporting/controls/discover');
require('plugins/reporting/controls/visualize');
require('plugins/reporting/controls/dashboard');
require('plugins/reporting/views/management');
require('plugins/security/views/management');
require('plugins/searchprofiler/app');
require('plugins/console/console');
require('plugins/kbn_doc_views/kbn_doc_views');
require('plugins/security/views/nav_control');
require('plugins/xpack_main/hacks/check_xpack_info_change');
require('plugins/graph/hacks/toggle_app_link_in_nav');
require('plugins/monitoring/hacks/phone_home_notifications');
require('plugins/monitoring/hacks/phone_home_trigger');
require('plugins/monitoring/hacks/toggle_app_link_in_nav');
require('plugins/reporting/hacks/job_completion_notifier');
require('plugins/security/hacks/on_session_timeout');
require('plugins/security/hacks/on_unauthorized_response');
require('plugins/searchprofiler/register');
require('plugins/console/hacks/register');
require('plugins/kibana/dev_tools/hacks/hide_empty_tools');
require('plugins/timelion/lib/panel_registry');
require('plugins/timelion/panels/timechart/timechart');
require('ui/chrome').bootstrap(/* xoxo */);

