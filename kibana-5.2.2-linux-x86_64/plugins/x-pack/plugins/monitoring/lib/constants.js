/**
 * The Monitoring API version is the expected API format that we export and expect to import.
 * @type {string}
 */
export const MONITORING_SYSTEM_API_VERSION = '2';
/**
 * The name of the Kibana System ID used to publish Kibana stats through the Monitoring system.
 * @type {string}
 */
export const KIBANA_SYSTEM_ID = 'kibana';
/**
 * The type name used within the Monitoring index to publish Kibana stats.
 * @type {string}
 */
export const KIBANA_STATS_TYPE = 'kibana_stats';

/*
 * name of the boolean feature flag for phone home in local storage
 */
export const PHONE_HOME_FEATURE = 'report';
/*
 * name of the boolean for phone home if the notification has been dismissed
 */
export const PHONE_HOME_NOTIFICATION_SEEN = 'report_notification_seen';

/*
 * Chart colors
 */
export const CHART_LINE_COLOR = '#d2d2d2';
export const CHART_TEXT_COLOR = '#9c9c9c';
