import marked from 'marked';
import _ from 'lodash';
import uiModules from 'ui/modules';
marked.setOptions({
    gfm: true, // Github-flavored markdown
    sanitize: true // Sanitize HTML tags
});

const module = uiModules.get('kibana/iframe_vis', ['kibana']);

module.controller('KbnIframeVisController', function($scope, $sce,$route) {
    const base = $scope.vis.params.url;
    const dash = $scope.dash = $route.current.locals.dash;

    const matchQueryFilter = function (filter) {
      return filter.query && filter.query.query_string && !filter.meta;
    };

    const extractQueryFromFilters = function (filters) {
      const filter = _.find(filters, matchQueryFilter);
      if (filter) return filter.query;
    };


      $scope.onchange = function(){
        var params = ''
        var filters = _.reject(dash.searchSource.getOwn('filter'), matchQueryFilter)
        var search  = extractQueryFromFilters(dash.searchSource.getOwn('filter')) || {query_string: {query: '*'}}
        params = params + '?timeto='+dash.timeTo+'&timefrom='+dash.timeFrom;
        var f = [];
        for(var i=0;i<filters.length;i++){
            f.push(filters[i].query);
        }
        params = params +'&filters='+JSON.stringify(f,1);
        $scope.vis.params.url = base +params +'&search=' +search.query_string.query;

        console.log($scope.vis.params.url);

    };

    $scope.$watch('vis.params.url', function(html) {
        if (!html) return;

        $scope.html = $sce.trustAsHtml(html);
        $scope.url = $sce.trustAsResourceUrl(html);



    });

    $scope.$watch('esResponse', function (resp) {
      $scope.onchange();
    });
});
