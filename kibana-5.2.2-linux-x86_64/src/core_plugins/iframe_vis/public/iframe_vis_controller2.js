import marked from 'marked';
import uiModules from 'ui/modules';
marked.setOptions({
    gfm: true, // Github-flavored markdown
    sanitize: true // Sanitize HTML tags
});

const module = uiModules.get('kibana/iframe_vis', ['kibana']);
module.controller('KbnIframeVisController', function($scope, $sce) {
    $scope.$watch('vis.params.url', function(html) {
        if (!html) return;
        $scope.html = $sce.trustAsHtml(html);
    });
});
