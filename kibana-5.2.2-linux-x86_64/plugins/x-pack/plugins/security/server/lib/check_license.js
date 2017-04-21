export default function checkLicense(xpackLicenseInfo) {

  let showLogin; // show login page or skip it?
  let allowLogin; // allow login or disable it on the login page?
  let showLinks; // show security links throughout the kibana app?
  let allowRoleDocumentLevelSecurity; // allow users to define document level security in roles?
  let allowRoleFieldLevelSecurity; // allow users to define field level security in roles?

  let loginMessage; // message to show on login page
  let linksMessage; // message to show when security links are clicked throughout the kibana app

  // If, for some reason, we cannot get license information
  // from Elasticsearch, assume worst-case and lock user
  // at login screen.
  if (!xpackLicenseInfo || !xpackLicenseInfo.isAvailable()) {
    loginMessage = 'Login is currently disabled because the license could not be determined. '
    + 'Please check that Elasticsearch is running, then refresh this page.';
    return {
      showLogin: true,
      allowLogin: false,
      showLinks: false,
      allowRoleDocumentLevelSecurity: false,
      allowRoleFieldLevelSecurity: false,
      loginMessage,
      linksMessage
    };
  }

  const isLicenseActive = xpackLicenseInfo.license.isActive();
  const isLicenseBasic = xpackLicenseInfo.license.isOneOf(['basic']);
  const isLicenseGold = xpackLicenseInfo.license.isOneOf(['gold']);
  const isEnabledInES = xpackLicenseInfo.feature('security').isEnabled();

  if (!isEnabledInES) {
    linksMessage = 'Access is denied because Security is disabled in Elasticsearch.';
    showLogin = false;
    allowLogin = null;
    showLinks = false;
    allowRoleDocumentLevelSecurity = false;
    allowRoleFieldLevelSecurity = false;
  } else if (isLicenseBasic) {
    linksMessage = 'Your Basic license does not support Security. Please upgrade your license.';
    showLogin = false;
    allowLogin = null;
    showLinks = false;
    allowRoleDocumentLevelSecurity = false;
    allowRoleFieldLevelSecurity = false;
  } else if (isLicenseGold) {
    linksMessage = null;
    showLogin = true;
    allowLogin = true;
    showLinks = true;
    allowRoleDocumentLevelSecurity = false;
    allowRoleFieldLevelSecurity = false;
  } else if (!isLicenseActive) {
    loginMessage = 'Login is disabled because your license has expired. Please extend your license or disable Security in Elasticsearch.';
    linksMessage = 'Access is denied because your license has expired. Please extend your license.';
    showLogin = true;
    allowLogin = false;
    showLinks = false;
    allowRoleDocumentLevelSecurity = false;
    allowRoleFieldLevelSecurity = false;
  } else {
    showLogin = true;
    allowLogin = true;
    showLinks = true;
    allowRoleDocumentLevelSecurity = true;
    allowRoleFieldLevelSecurity = true;
  };

  return {
    showLogin,
    allowLogin,
    showLinks,
    loginMessage,
    linksMessage,
    allowRoleDocumentLevelSecurity,
    allowRoleFieldLevelSecurity
  };

};
