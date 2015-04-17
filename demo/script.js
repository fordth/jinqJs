/* jinqJs.com 
   Basic DEMO With Using AngularJs ngGrid 
   See API Documentation for all the advanced features using predicates */
(function() {
  "use strict";
  
  /* SAMPLE DATA */
  var people = [{Name: 'Tom', Age: 15, Location: 'Port Jefferson'},
                {Name: 'Jen', Age: 30, Location: 'Huntington'},
                {Name: 'Diana', Age: 5, Location: 'Huntington'}];
              
  var population = [{Location: 'Port Jefferson', people: 123},
                    {Location: 'Huntington', people: 350}];
  
  /* WEB SERVICE TO QUERY */
  var weatherSvc = 'http://api.openweathermap.org/data/2.5/weather?q=Huntington,NY';
  
  var app = angular.module('app', ['ui.grid'])
                   .controller('demoCtrl', ['$scope', function ($scope) {

    /* Sample use of a .select() predicate to flatten result */ 
    /* Calling a web service to query the response           */
    var weather = new jinqJs()
                   .from(weatherSvc)
                   .select( function(row){
                      return { Location: row.name, Condition: row.weather[0].description };
                   });

    /* UNCOMMENT SECTIONS of the expression to see the results */
    /* Performs a join on the web service response and local collections */
    $scope.data = new jinqJs()
                    .from(people).on('Location')
                    .where( function(row) { return (row.Age > 3 && row.Location == 'Huntington'); } )
                    .leftJoin(weather).on('Location')
//                    .where('people < 200')
                    .groupBy('Location', 'Condition').avg('Age')
//                    .orderBy('Location')
//                    .identity()
                    .select([{field: 'Location'}, {field: 'Age', text: 'Average Age'}, {field: 'Condition'}]);  
  }]);  
}());

