import marked from 'marked';
import uiModules from 'ui/modules';
marked.setOptions({
    gfm: true, // Github-flavored markdown
    sanitize: true // Sanitize HTML tags
});


const module = uiModules.get('kibana/search_vis', ['kibana']);
module.controller('KbnSearchVisController', function($scope, $sce, $http) {
    $scope.respo = []
    $scope.search = function() {
        if (!$scope.error) {
            $scope.respo = [];
            return;
        }

        let contentType;
        contentType = 'text/plain';
        //if (data) {
         // try {
        //    JSON.parse(data);
      //      contentType = 'application/json';
    //      } catch (e) {
  //          contentType = 'text/plain';
//          }
//        }

        var options = {
          url: '../api/console/proxy?uri=' + encodeURIComponent('/mapa/_search?q=atm_id:' + $scope.error+'*'),
          data: null,
          contentType,
          cache: false,
          crossDomain: true,
          type: 'GET',
          dataType: "text", // disable automatic guessing
        };


        function onSusessful(data, textStatus, jqXHR){
        var res = JSON.parse(data);
        console.log(res);
	$scope.respo= res.hits.hits
//        console.log(JSON.parser(data));    
        }
         function onError(jqXHR, textStatus, errorThrown){

        }
        $.ajax(options).then(onSusessful,onError);

        //$scope.html

        // $http({
        //     url: ('http://elastic:cyttek@35.185.220.144:9200/mapa/_search?q=atm_id:' + $scope.error+'*'),
        //     method: 'GET',
        // }).success(function(data) {
        //     $scope.respo = data.hits.hits;
        // }).error(function(data) {
        //     console.log(data);
        // });
    };
    $scope.$watch('error', function(error) {
        $scope.search();
    });
    $scope.$watch('vis.params.url', function(html) {
        if (!html) return;
        $scope.html = $sce.trustAsHtml(html);
        // $scope.url = $sce.trustAsResourceUrl(html);
    });
});
