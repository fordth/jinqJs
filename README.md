# jinqJs
jinqJs provides a simple, leightweight & fast way to perform queries, updates and deletes on javaScript arrays, collections and web services using LINQ expressions.
You can visit the [jinqJs.com](http://www.jinqJs.com) for more examples and demos.


## TypeScript Support
Include the definition file jinqJs.d.ts

## Unit Tested
All stable versions have had a 100% success rate with all 80+ unit tests.

## Online API Documentation
The full API documentation can be found [here](https://onedrive.live.com/redir?resid=197F25F0703D2355!4722&authkey=!AKTubE9PRfruzj0&ithint=file%2cdocx)

## Installing via the NuGet Package
You can start using jinqJs by simply using the NuGet package manager.
 ```
 Install-Package jinqJs
 ```
 
## Installing the jinq module by running:
```
npm install -g jinq
```

## Installing jinqJs via Bower
```
bower install jinqjs
```

## Extensibility
jinqJs has a simple plug-in architecture which allows you to simply add your own functions to the jinqJs library
without modifying any of the base library code.
View the online [documentation](https://onedrive.live.com/redir?resid=197F25F0703D2355!4722&authkey=!AKTubE9PRfruzj0&ithint=file%2cdocx) Extensibility section for more information.

## Node.js
As of version 1.3+ jinqJs is Node.js ready. You load the jinqJs module in Node.js via the following:
```JavaScript
var jinqJs = require('jinq');
```

## Perform RUD Operations
Starting in version 1.5.1 you can perform update and delete operations. 

## Examples
**Joining Results With A Web Service Response And A Collection**
```JavaScript
var people = [{Name: 'Tom', Age: 15, Location: 'Port Jefferson'},
                {Name: 'Jen', Age: 30, Location: 'Huntington'},
                {Name: 'Diana', Age: 5, Location: 'Huntington'}];
                
/* WEB SERVICE TO QUERY */
var weatherSvc = 'http://api.openweathermap.org/data/2.5/weather?q=Huntington,NY';
/* Sample use of a .select() predicate to flatten result */ 
/* Calling a web service to query the response           */
var weather = new jinqJs()
                .from(weatherSvc)
                .select( function(row){
                    return { Location: row.name, Condition: row.weather[0].description };
                });
                    
/* Performs a join on the web service response and local collection */
var result = new jinqJs()
                .from(people)
                .where( function(row) { return (row.Age > 3 && row.Location == 'Huntington'); } )
                .leftJoin(weather).on('Location')
                .groupBy('Huntington', 'Condition').avg('Age')
                .select([{field: 'Location'}, {field: 'Age', text: 'Average Age'}, {field: 'Condition'}]);
```
```
RESULT
|  Location  | Average Age |     Condition |
|:----------:|:-----------:|--------------:|
| Huntington |     17.5    | Partly Cloudy |
```

**Performing An Asynchronous Web Service Call**
```JavaScript
new jinqJs()
    .from('http://www.telize.com/geoip',
        function(self) {
        var result = self
                        .top(1)
                        .select('city', 'region');
        }
    );
```
```
RESULT
|     city    |  region  |
|:-----------:|:--------:|
| Stony Brook | New York |
```

**Using Predicates For Complex Outer Join &amp; Where Condition**
```JavaScript
var people = [
              {Name: 'Jane', Age: 20, Location: 'Smithtown'},
              {Name: 'Ken', Age: 57, Location: 'Islip'},
              {Name: 'Tom', Age: 10, Location: 'Islip'}
            ];

var population = [
              {Location: 'Islip', People: 123},
              {Location: 'Melville', People: 332},
            ];
                                        
var result = new jinqJs()
    .from(people)
    .leftJoin(population)
      .on( function( left, right ) {
        return (left.Location === right.Location);
      } )
    .where( function(row) {
      return ( row.Age > 15);
    })
    .select('Name', 'Location', 'People');
```
```
RESULT
| Name |  Location | People |
|:----:|:---------:|--------|
| Jane | Smithtown |        |
| Ken  | Islip     |        |
```

**Creating Calculated Columns**
```JavaScript
function isChild(row) {
  return (row.Age < 18 ? 'Yes' : 'No');
}
var people = [
              {Name: 'Jane', Age: 20, Location: 'Smithtown'},
              {Name: 'Ken', Age: 57, Location: 'Islip'},
              {Name: 'Tom', Age: 10, Location: 'Islip'}
            ];
                        
var result = new jinqJs()
    .from(people)
    .orderBy('Age')
    .select([{field: 'Name'}, 
            {field: 'Age', text: 'Your Age'}, 
            {text: 'Is Child', value: isChild}]);
}]);
```
```
RESULT
| Name | Your Age | Is Child |
|:----:|:--------:|----------|
| Tom  |    10    |    Yes   |
| Jane |    20    |    No    |
| Ken  |    57    |    No    |
```

## Folder Structure
```
jinqJs/
├── demo/           <-- Demo code using angularJs to demonstrate some LINQ queries
│   ├── index.html
│   ├── README.md
│   ├── script.js
├── versions/           <-- A history of versions
│   ├── v.0.1
│   └── v.x.x
├── tests/              <-- Unit test using jasmine JS
│   └── index.html      <-- Home page for unit test results
├── jinqjs-unstable.js  <-- Current work in progress version
├── jinqjs.js           <-- Will always be the latest stable version
├── jinsjs.min.js       <-- Latest minified stable version
├── LICENSE
└── README.md
```

## Bugs and Feature Requests
For comments, bugs or feature requests you can email me at [thomas.ford@jinqjs.com](mailto:thomas.ford@jinqjs.com).
You can also open an issue at [New Issue](https://github.com/fordth/jinqJs/issues).

## Copyright and License
Code is released under [the MIT license](https://github.com/fordth/jinqJs/blob/master/LICENSE)