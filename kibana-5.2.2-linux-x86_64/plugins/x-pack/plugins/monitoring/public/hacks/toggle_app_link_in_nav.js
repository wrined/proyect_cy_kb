import chrome from 'ui/chrome';
import uiModules from 'ui/modules';

uiModules.get('monitoring/hacks').run((monitoringUiEnabled) => {
  const navLink = chrome.getNavLinkById('monitoring');
  if (navLink && !monitoringUiEnabled) {
    navLink.hidden = true;
  }
});
