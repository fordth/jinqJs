/// <reference path="../../../jinqJs.d.ts" />
/// <reference path="../../types/jasmine.d.ts" />
/// <reference path="../../types/node-0.10.d.ts" />
describe('jinqJS TypeScript Definition Suite', function () {
    //'use strict'; //Disabled to allow one file to be used with client & node.js testing
    var SexEnum;
    (function (SexEnum) {
        SexEnum[SexEnum["Male"] = 0] = "Male";
        SexEnum[SexEnum["Female"] = 1] = "Female";
    })(SexEnum || (SexEnum = {}));
    var people1 = [
        { Name: 'Tom', Age: 29, Location: 'Port Jeff', Sex: SexEnum.Male },
        { Name: 'Jen', Age: 30, Location: 'Port Jeff', Sex: SexEnum.Female },
        { Name: 'Tom', Age: 14, Location: 'Port Jeff', Sex: SexEnum.Male },
        { Name: 'Diana', Age: 11, Location: 'Port Jeff', Sex: SexEnum.Female }
    ];
    var people2 = [
        { Name: 'Tom', Age: 14, Location: 'Port Jeff', Sex: SexEnum.Male },
        { Name: 'Jane', Age: 20, Location: 'Smithtown', Sex: SexEnum.Female },
        { Name: 'Ken', Age: 57, Location: 'Islip', Sex: SexEnum.Male }
    ];
    var people3 = [{ Name: 'Frank', Age: 1, Location: 'Melville', Sex: SexEnum.Male }];
    var people4 = [{ Name: 'Frank', Age: 67, Location: 'Melville', Sex: SexEnum.Male }];
    var sexType = [{ Sex: SexEnum.Male, Location: 'Islip', Title: 'Its a boy!' },
        { Sex: SexEnum.Female, Location: 'Islip', Title: 'Its a girl!' }];
    var population = [
        { Location: 'Islip', People: 123 },
        { Location: 'Melville', People: 332 },
    ];
    var temps = [
        { Location: 'Islip', Temp: 85 }
    ];
    var simpleAges1 = [29, 2, 1, 57];
    var simpleAges2 = [14, 30, 1, 60];
    var weatherSvc = 'http://api.openweathermap.org/data/2.5/weather?q=port%20jefferson,ny&appid=2de143494c0b295cca9337e1e96b00e0';
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        jinqJs = require('../../../jinqjs-unstable');
        console.log('Testing node.js instance.');
    }
    else
        console.log('Testing as client instance.');
    describe('.from()', function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        it('sync', function () {
            var result = new jinqJs().from(people1).select();
            expect(result.length).toEqual(4);
            expect(result[0].Age).toEqual(29);
            expect(result[3].Age).toEqual(11);
        });
        it('async', function (done) {
            new jinqJs().from(weatherSvc, function (self) {
                var resultAsync = self.select();
                expect(resultAsync.length).toEqual(1);
                expect(resultAsync[0].coord.lat).toEqual(40.95);
                done();
            });
        });
        it('UNION All (Complex)', function () {
            var result = new jinqJs().from(people1, people2, people3).select();
            expect(result.length).toEqual(8);
            expect(result[0].Age).toEqual(29);
            expect(result[4].Age).toEqual(14);
            expect(result[7].Age).toEqual(1);
        });
        it('UNION All (Simple)', function () {
            var result = new jinqJs().from(simpleAges1, simpleAges2).select();
            expect(result.length).toEqual(8);
            expect(result[0]).toEqual(29);
            expect(result[4]).toEqual(14);
        });
    });
    describe('.concat()', function () {
        it('(Complex)', function () {
            var result = new jinqJs().from(people1).concat(people2, people3).select();
            expect(result.length).toEqual(8);
            expect(result[0].Age).toEqual(29);
            expect(result[4].Age).toEqual(14);
            expect(result[7].Age).toEqual(1);
        });
        it('(Simple)', function () {
            var result = new jinqJs().from(simpleAges1).concat(simpleAges2, [88, 99]).select();
            expect(result.length).toEqual(10);
            expect(result[0]).toEqual(29);
            expect(result[4]).toEqual(14);
            expect(result[8]).toEqual(88);
        });
    });
    describe('.union()', function () {
        it('(Complex)', function () {
            var result = new jinqJs().from(people1).union(people2, people3).select();
            expect(result.length).toEqual(7);
            expect(result[0].Age).toEqual(29);
            expect(result[2].Age).toEqual(14);
            expect(result[4].Age).toEqual(20);
        });
        it('(Simple) Numbers', function () {
            var result = new jinqJs().from(simpleAges1).union(simpleAges2, [30, 50]).select();
            expect(result.length).toEqual(8);
            expect(result[0]).toEqual(29);
            expect(result[6]).toEqual(60);
            expect(result[7]).toEqual(50);
        });
        it('(Simple) Strings', function () {
            var result = new jinqJs().from(['Tom', 'Frank']).union(['Bob', 'Tom'], ['Chris']).select();
            expect(result.length).toEqual(4);
            expect(result[0]).toEqual('Tom');
            expect(result[3]).toEqual('Chris');
        });
    });
    describe('.join() and .on()', function () {
        it('(Complex - Single Collection)', function () {
            var result = new jinqJs().from(people1).union(people2).join(population).on('Location').select();
            expect(result.length).toEqual(1);
            expect(result[0].People).toEqual(123);
        });
        it('(Complex - Multiple Collections)', function () {
            var result = new jinqJs().from(people1).union(people2).join(population, temps).on('Location').select();
            expect(result.length).toEqual(1);
            expect(result[0].People).toEqual(123);
            expect(result[0].Temp).toEqual(85);
        });
    });
    describe('.on()', function () {
        it('(Complex - Multiple Columns)', function () {
            var result = new jinqJs().from(people1).union(people2).join(sexType).on('Location', 'Sex').select();
            expect(result.length).toEqual(1);
            expect(result[0].Title).toEqual('Its a boy!');
            expect(result[0].Age).toEqual(57);
        });
        it('(Complex - Predicate - inner join)', function () {
            var result = new jinqJs().from(people1, people2).join(sexType).on(function (left, right) {
                return left.Location === right.Location;
            }).select();
            //Multiple matches (Both are Male because its using the field from the left side collection)
            expect(result.length).toEqual(2);
            expect(result[0].Sex).toEqual(SexEnum.Male);
            expect(result[1].Sex).toEqual(SexEnum.Male);
            var result1 = new jinqJs().from(people1, people2).join(sexType).on(function (left, right) {
                return left.Location === right.Location && left.Sex === right.Sex;
            }).select();
            //Single match
            expect(result1.length).toEqual(1);
            expect(result1[0].Title).toEqual('Its a boy!');
            expect(result1[0].Age).toEqual(57);
        });
        it('(Complex - Predicate - outer join)', function () {
            var result = new jinqJs().from(people1, people2).leftJoin(sexType).on(function (left, right) {
                return left.Location === right.Location && left.Sex === right.Sex;
            }).select();
            expect(result.length).toEqual(7);
            result = new jinqJs().from(people2).leftJoin(sexType).on(function (left, right) {
                return left.Location === right.Location && left.Sex === right.Sex;
            }).select();
            expect(result.length).toEqual(3);
            expect(result[0].Age).toEqual(14);
            expect(result[2].Age).toEqual(57);
            expect(result[0].Title).toEqual('');
            expect(result[1].Title).toEqual('');
            expect(result[2].Title).toEqual('Its a boy!');
        });
    });
    describe('.leftJoin()', function () {
        it('Complex - Column', function () {
            var result = new jinqJs().from(people2).leftJoin(population).on('Location').select();
            expect(result.length).toEqual(3);
            result = new jinqJs().from(result).where('Location == Islip').select();
            expect(result[0].People).toEqual(123);
            result = new jinqJs().from(people2).leftJoin(population).on('Location').select();
            result = new jinqJs().from(result).where('Location == Smithtown').select();
            expect(result[0].People).toEqual('');
        });
        it('Complex - Multiple Collections', function () {
            var result = new jinqJs().from(people2).leftJoin(population, temps).on('Location').select();
            expect(result.length).toEqual(3);
            expect(result[0].People).toEqual('');
            expect(result[2].People).toEqual(123);
            result = new jinqJs().from(result).where('Location == Islip').select();
            expect(result[0].Temp).toEqual(85);
            expect(result[0].People).toEqual(123);
            result = new jinqJs().from(people2).leftJoin(population, temps).on('Location').select();
            result = new jinqJs().from(result).where('Location == Smithtown').select();
            expect(result[0].Temp).toEqual('');
            expect(result[0].People).toEqual('');
        });
        it('Complex - Multiple Columns', function () {
            var result = new jinqJs().from(people2).leftJoin(sexType).on('Location', 'Sex').select();
            expect(result.length).toEqual(3);
            expect(result[0].Age).toEqual(14);
            expect(result[2].Age).toEqual(57);
            expect(result[0].Title).toEqual('');
            expect(result[1].Title).toEqual('');
            expect(result[2].Title).toEqual('Its a boy!');
            result = new jinqJs().from(result).where('Location == Islip').select();
            expect(result[0].Title).toEqual('Its a boy!');
            result = new jinqJs().from(people2).leftJoin(sexType).on('Location', 'Sex').select();
            result = new jinqJs().from(result).where('Location == Smithtown').select();
            expect(result[0].Title).toEqual('');
        });
    });
    describe('.fullJoin()', function () {
        it('Complex - Single Column', function () {
            var result = new jinqJs().from(people2).fullJoin(population).on('Location').select();
            expect(result.length).toEqual(4);
            expect(result[0].People).toEqual('');
            expect(result[0].Location).toEqual('Port Jeff');
            expect(result[1].People).toEqual('');
            expect(result[2].People).toEqual(123);
            expect(result[2].Location).toEqual('Islip');
            expect(result[3].People).toEqual(332);
            expect(result[3].Location).toEqual('Melville');
        });
        it('Complex - Multiple Columns', function () {
            var result = new jinqJs().from(people2).fullJoin(sexType).on('Sex', 'Location').select();
            expect(result.length).toEqual(4);
            expect(result[0].Title).toEqual('');
            expect(result[2].Title).toEqual('Its a boy!');
            expect(result[3].Title).toEqual('Its a girl!');
            expect(result[3].Location).toEqual('Islip');
            expect(result[3].Name).toBeNull();
        });
    });
    describe('.in()', function () {
        it('Complex - Complex to Complex (Single Column)', function () {
            var result = new jinqJs().from(people1).in(people2, 'Name').select();
            expect(result.length).toEqual(2);
        });
        it('Complex - Complex to Complex (Multiple Columns)', function () {
            var result = new jinqJs().from(people1).in(people2, 'Name', 'Age').select();
            expect(result.length).toEqual(1);
        });
        it('Complex - Complex to Simple (Single Column)', function () {
            var result = new jinqJs().from(people1).in(['Jen', 'Diana'], 'Name').select();
            expect(result.length).toEqual(2);
        });
        it('Complex - Simple to Simple', function () {
            var result = new jinqJs().from([1, 2, 3, 4]).in([3, 4, 5]).select();
            expect(result.length).toEqual(2);
        });
        describe('.not().in()', function () {
            it('Complex - Complex to Complex (Single Column)', function () {
                var result = new jinqJs().from(people1).not().in(people2, 'Name').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age).toEqual(30);
                expect(result[1].Age).toEqual(11);
            });
            it('Complex - Complex to Complex (Multiple Columns)', function () {
                var result = new jinqJs().from(people1).not().in(people2, 'Name', 'Age').select();
                expect(result.length).toEqual(3);
                expect(result[0].Age).toEqual(29);
                expect(result[1].Age).toEqual(30);
                expect(result[2].Age).toEqual(11);
            });
            it('Complex - Complex to Simple (Single Column)', function () {
                var result = new jinqJs().from(people1).not().in(['Jen', 'Tom'], 'Name').select();
                expect(result.length).toEqual(1);
                expect(result[0].Name).toEqual('Diana');
            });
            it('Complex - Simple to Simple', function () {
                var result = new jinqJs().from([1, 2, 3, 4]).not().in([2, 3, 4, 5]).select();
                expect(result.length).toEqual(1);
                expect(result[0]).toEqual(1);
            });
        });
    });
    describe('.where()', function () {
        it('Complex - Multiple Simple Conditions', function () {
            var result = new jinqJs().from(people1).where('Age < 20', 'Sex == ' + SexEnum.Male).select();
            expect(result.length).toEqual(1);
            expect(result[0].Age).toEqual(14);
        });
        it('Complex - Predicate Using row & index', function () {
            var result = new jinqJs().from(people1).where(function (row, index) { return index === 1 && row.Name === 'Jen'; }).select();
            expect(result.length).toEqual(1);
            expect(result[0].Age).toEqual(30);
        });
        it('Simple - Predicate Using row & index', function () {
            var result = new jinqJs().from([1, 2, 3, 4, 5, 6]).where(function (row, index) { return row % 2 === 0; }).select();
            expect(result.length).toEqual(3);
            expect(result[0]).toEqual(2);
        });
        it('Simple - Simple Condition Using Contains', function () {
            var result = new jinqJs().from(people1).where('Name * om').select();
            expect(result.length).toEqual(2);
            expect(result[0].Name === 'Tom' && result[1].Name === 'Tom').toBeTruthy();
        });
        it('Simple - Predicate Using row & index with the filter()', function () {
            var result = new jinqJs().from([1, 2, 3, 4, 5, 6]).filter(function (row, index) { return row % 2 === 0; }).select();
            expect(result.length).toEqual(3);
            expect(result[0]).toEqual(2);
        });
    });
    describe('.groupBy()', function () {
        describe('.sum()', function () {
            it('Complex - Multiple Columns', function () {
                var result = new jinqJs().from(people1).groupBy('Name', 'Age').sum('Age').select();
                expect(result.length).toEqual(4);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age === 29 && result[1].Age === 14).toBeTruthy();
            });
            it('Complex - Multiple Columns & Multiple Aggregate Columns', function () {
                var result = new jinqJs().from(people2, people3, people4).leftJoin(population).on('Location').groupBy('Name', 'Age').sum('Age', 'People').select();
                expect(result.length).toEqual(5);
                result = new jinqJs().from(result).where('Name == Frank').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age === 1 && result[0].People === 332 && result[1].Age === 67 && result[1].People === 332).toBeTruthy();
            });
            it('Complex - Single Columns & Multiple Aggregate Columns', function () {
                var result = new jinqJs().from(people2, people3, people4).leftJoin(population).on('Location').groupBy('Name').sum('Age', 'People').select();
                expect(result.length).toEqual(4);
                result = new jinqJs().from(result).where('Name == Frank').select();
                expect(result.length).toEqual(1);
                expect(result[0].Age === 68 && result[0].People === 664).toBeTruthy();
            });
            it('Complex - Single Column', function () {
                var result = new jinqJs().from(people1).groupBy('Name').sum('Age').select();
                expect(result.length).toEqual(3);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(1);
                expect(result[0].Age).toEqual(29 + 14);
            });
            it('Simple', function () {
                var result = new jinqJs().from([1, 2, 3, 4, 5]).sum().select();
                expect(result.length).toEqual(1);
                expect(result[0]).toEqual(15);
            });
        });
        describe('.min()', function () {
            it('Complex - Multiple Columns', function () {
                var result = new jinqJs().from(people1).groupBy('Name', 'Age').min('Age').select();
                expect(result.length).toEqual(4);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age === 29 && result[1].Age === 14).toBeTruthy();
            });
            it('Complex - Multiple Columns & Multiple Aggregate Columns', function () {
                var result = new jinqJs().from(people2, people3, people4).leftJoin(population).on('Location').groupBy('Name', 'Age').min('Age', 'People').select();
                expect(result.length).toEqual(5);
                result = new jinqJs().from(result).where('Name == Frank').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age === 1 && result[0].People === 332 && result[1].Age === 67 && result[1].People === 332).toBeTruthy();
            });
            it('Complex - Single Columns & Multiple Aggregate Columns', function () {
                var result = new jinqJs().from(people2, people3, people4).leftJoin(population).on('Location').groupBy('Name').min('Age', 'People').select();
                expect(result.length).toEqual(4);
                result = new jinqJs().from(result).where('Name == Frank').select();
                expect(result.length).toEqual(1);
                expect(result[0].Age === 1 && result[0].People === 332).toBeTruthy();
            });
            it('Complex - Single Column', function () {
                var result = new jinqJs().from(people1).groupBy('Name').min('Age').select();
                expect(result.length).toEqual(3);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(1);
                expect(result[0].Age).toEqual(14);
            });
            it('Simple', function () {
                var result = new jinqJs().from([2, 1, 3, 4, 5]).min().select();
                expect(result.length).toEqual(1);
                expect(result[0]).toEqual(1);
            });
        });
        describe('.max()', function () {
            it('Complex - Multiple Columns', function () {
                var result = new jinqJs().from(people1).groupBy('Name', 'Age').max('Age').select();
                expect(result.length).toEqual(4);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age === 29 && result[1].Age === 14).toBeTruthy();
            });
            it('Complex - Multiple Columns & Multiple Aggregate Columns', function () {
                var result = new jinqJs().from(people2, people3, people4).leftJoin(population).on('Location').groupBy('Name', 'Age').max('Age', 'People').select();
                expect(result.length).toEqual(5);
                result = new jinqJs().from(result).where('Name == Frank').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age === 1 && result[0].People === 332 && result[1].Age === 67 && result[1].People === 332).toBeTruthy();
            });
            it('Complex - Single Columns & Multiple Aggregate Columns', function () {
                var result = new jinqJs().from(people2, people3, people4).leftJoin(population).on('Location').groupBy('Name').max('Age', 'People').select();
                expect(result.length).toEqual(4);
                result = new jinqJs().from(result).where('Name == Frank').select();
                expect(result.length).toEqual(1);
                expect(result[0].Age === 67 && result[0].People === 332).toBeTruthy();
            });
            it('Complex - Single Column', function () {
                var result = new jinqJs().from(people1).groupBy('Name').max('Age').select();
                expect(result.length).toEqual(3);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(1);
                expect(result[0].Age).toEqual(29);
            });
            it('Simple', function () {
                var result = new jinqJs().from([2, 1, 3, 4, 5]).max().select();
                expect(result.length).toEqual(1);
                expect(result[0]).toEqual(5);
            });
        });
        describe('.avg()', function () {
            it('Complex - Multiple Columns', function () {
                var result = new jinqJs().from(people1).groupBy('Name', 'Age').avg('Age').select();
                expect(result.length).toEqual(4);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age === 29 && result[1].Age === 14).toBeTruthy();
            });
            it('Complex - Multiple Columns & Multiple Aggregate Columns', function () {
                var result = new jinqJs().from(people2, people3, people4).leftJoin(population).on('Location').groupBy('Name', 'Age').avg('Age', 'People').select();
                expect(result.length).toEqual(5);
                result = new jinqJs().from(result).where('Name == Frank').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age === 1 && result[0].People === 332 && result[1].Age === 67 && result[1].People === 332).toBeTruthy();
            });
            it('Complex - Single Columns & Multiple Aggregate Columns', function () {
                var result = new jinqJs().from(people2, people3, people4).leftJoin(population).on('Location').groupBy('Name').avg('Age', 'People').select();
                expect(result.length).toEqual(4);
                result = new jinqJs().from(result).where('Name == Frank').select();
                expect(result.length).toEqual(1);
                expect(result[0].Age === 34 && result[0].People === 332).toBeTruthy();
            });
            it('Complex - Single Column', function () {
                var result = new jinqJs().from(people1).groupBy('Name').avg('Age').select();
                expect(result.length).toEqual(3);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(1);
                expect(result[0].Age).toEqual(21.5);
            });
            it('Simple', function () {
                var result = new jinqJs().from([2, 1, 3, 4, 5]).avg().select();
                expect(result.length).toEqual(1);
                expect(result[0]).toEqual(3);
            });
        });
        describe('.count()', function () {
            it('Complex - Multiple Columns', function () {
                var result = new jinqJs().from(people1).groupBy('Name', 'Age').count('Age').select();
                expect(result.length).toEqual(4);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age === 1 && result[1].Age === 1).toBeTruthy();
            });
            it('Complex - Multiple Columns & Multiple Aggregate Columns', function () {
                var result = new jinqJs().from(people2, people3, people4).leftJoin(population).on('Location').groupBy('Name', 'Age').count('Age', 'People').select();
                expect(result.length).toEqual(5);
                result = new jinqJs().from(result).where('Name == Frank').select();
                expect(result.length).toEqual(2);
                expect(result[0].Age === 1 && result[0].People === 1 && result[1].Age === 1 && result[1].People === 1).toBeTruthy();
            });
            it('Complex - Single Columns & Multiple Aggregate Columns', function () {
                var result = new jinqJs().from(people2, people3, people4).leftJoin(population).on('Location').groupBy('Name').count('Age', 'People').select();
                expect(result.length).toEqual(4);
                result = new jinqJs().from(result).where('Name == Frank').select();
                expect(result.length).toEqual(1);
                expect(result[0].Age === 2 && result[0].People === 2).toBeTruthy();
            });
            it('Complex - Single Column', function () {
                var result = new jinqJs().from(people1).groupBy('Name').count('Age').select();
                expect(result.length).toEqual(3);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(1);
                expect(result[0].Age).toEqual(2);
            });
        });
        describe('.distinct()', function () {
            it('Complex - Single Column', function () {
                var result = new jinqJs().from(people1).distinct('Location').select();
                expect(result.length).toEqual(1);
            });
            it('Complex - Multiple Columns', function () {
                var result = new jinqJs().from(people1).distinct('Name', 'Location').select();
                expect(result.length).toEqual(3);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(1);
            });
            it('Complex - Array of Columns', function () {
                var result = new jinqJs().from(people1).distinct(['Name', 'Location']).select();
                expect(result.length).toEqual(3);
                result = new jinqJs().from(result).where('Name == Tom').select();
                expect(result.length).toEqual(1);
            });
            it('Simple', function () {
                var result = new jinqJs().from([1, 2, 2, 3, 4, 3, 5]).distinct().select();
                expect(result.length).toEqual(5);
                expect(result[0]).toEqual(1);
                expect(result[4]).toEqual(5);
            });
        });
    });
    describe('.orderBy()', function () {
        it('Complex - Multiple Columns Simple', function () {
            var result = new jinqJs().from(people1).orderBy('Name', 'Age').select();
            expect(result[0].Name === 'Diana').toBeTruthy();
            expect(result[2].Name === 'Tom' && result[2].Age === 14).toBeTruthy();
        });
        it('Complex - Multiple Columns Complex [field only]', function () {
            var result = new jinqJs().from(people1).orderBy([{ field: 'Name' }, { field: 'Age' }]).select();
            expect(result[0].Name === 'Diana').toBeTruthy();
            expect(result[2].Name === 'Tom' && result[2].Age === 14).toBeTruthy();
        });
        it('Complex - Multiple Columns Complex [field by name & sort]', function () {
            var result = new jinqJs().from(people1).orderBy([{ field: 'Name' }, { field: 'Age', sort: 'desc' }]).select();
            expect(result[0].Name === 'Diana').toBeTruthy();
            expect(result[2].Name === 'Tom' && result[2].Age === 29).toBeTruthy();
        });
        it('Complex - Multiple Columns Complex [field by positional # & sort]', function () {
            var result = new jinqJs().from(people1).orderBy([{ field: 0, sort: 'asc' }, { field: 1, sort: 'desc' }]).select();
            expect(result[0].Name === 'Diana').toBeTruthy();
            expect(result[2].Name === 'Tom' && result[2].Age === 29).toBeTruthy();
        });
        it('Simple - Ascending Numbers', function () {
            var result = new jinqJs().from([4, 2, 8, 1, 3]).orderBy([{ sort: 'asc' }]).select();
            expect(result[0] === 1 && result[4] === 8).toBeTruthy();
        });
        it('Simple - Descending String', function () {
            var result = new jinqJs().from(['Anna', 'Zillow', 'Mike']).orderBy([{ sort: 'desc' }]).select();
            expect(result[0] === 'Zillow' &&
                result[2] === 'Anna').toBeTruthy();
        });
    });
    describe('.identity()', function () {
        it('Complex - No Column', function () {
            var result = new jinqJs().from(people1, people2).identity().select();
            expect(result.length).toEqual(7);
            expect(result[0].ID).toEqual(1);
            expect(result[6].ID).toEqual(7);
        });
        it('Complex - With Column', function () {
            var result = new jinqJs().from(people1, people2).identity('Row').select();
            expect(result.length).toEqual(7);
            expect(result[0].Row).toEqual(1);
            expect(result[6].Row).toEqual(7);
        });
        it('Simple - No Column', function () {
            var result = new jinqJs().from(simpleAges1, simpleAges2).identity().select();
            expect(result.length).toEqual(8);
            expect(result[0].ID).toEqual(1);
            expect(result[7].ID).toEqual(8);
        });
        it('Simple - With Column', function () {
            var result = new jinqJs().from(simpleAges1, simpleAges2).identity('Row').select();
            expect(result.length).toEqual(8);
            expect(result[0].Row).toEqual(1);
            expect(result[7].Row).toEqual(8);
        });
        it('Global Identity Setting', function () {
            new jinqJs({ includeIdentity: true });
            var result = new jinqJs().from(simpleAges1, simpleAges2).select();
            expect(result.length).toEqual(8);
            expect(result[0].ID).toEqual(1);
            expect(result[7].ID).toEqual(8);
            new jinqJs({ includeIdentity: false });
        });
    });
    describe('.skip()', function () {
        it('Complex - Fixed Number', function () {
            var result = new jinqJs().from(people1).skip(3).select();
            expect(result.length).toEqual(1);
            expect(result[0].Age).toEqual(11);
        });
        it('Complex - Percent', function () {
            var result = new jinqJs().from(people1).skip(.25).select();
            expect(result.length).toEqual(3);
            expect(result[0].Age).toEqual(30);
            expect(result[2].Age).toEqual(11);
        });
        it('Simple - Fixed Number', function () {
            var result = new jinqJs().from(['Tom', 'Jen', 'Diana', 'Sandy']).skip(2).select();
            expect(result.length).toEqual(2);
            expect(result[0]).toEqual('Diana');
            expect(result[1]).toEqual('Sandy');
        });
        it('Simple - Percent', function () {
            var result = new jinqJs().from(['Tom', 'Jen', 'Diana', 'Sandy']).skip(.75).select();
            expect(result.length).toEqual(1);
            expect(result[0]).toEqual('Sandy');
        });
    });
    describe('.top()', function () {
        it('Complex - Fixed Number', function () {
            var result = new jinqJs().from(people1).top(2).select();
            expect(result.length).toEqual(2);
            expect(result[0].Age).toEqual(29);
            expect(result[1].Age).toEqual(30);
        });
        it('Complex - Percent', function () {
            var result = new jinqJs().from(people1).top(.75).select();
            expect(result.length).toEqual(3);
            expect(result[0].Age).toEqual(29);
            expect(result[2].Age).toEqual(14);
        });
        it('Simple - Fixed Number', function () {
            var result = new jinqJs().from(['Tom', 'Jen', 'Diana', 'Sandy']).top(2).select();
            expect(result.length).toEqual(2);
            expect(result[0]).toEqual('Tom');
            expect(result[1]).toEqual('Jen');
        });
        it('Simple - Percent', function () {
            var result = new jinqJs().from(['Tom', 'Jen', 'Diana', 'Sandy']).top(.75).select();
            expect(result.length).toEqual(3);
            expect(result[0]).toEqual('Tom');
            expect(result[2]).toEqual('Diana');
        });
    });
    describe('.bottom()', function () {
        it('Complex - Fixed Number', function () {
            var result = new jinqJs().from(people1).bottom(2).select();
            expect(result.length).toEqual(2);
            expect(result[0].Age).toEqual(14);
            expect(result[1].Age).toEqual(11);
        });
        it('Complex - Percent', function () {
            var result = new jinqJs().from(people1).bottom(.75).select();
            expect(result.length).toEqual(3);
            expect(result[0].Age).toEqual(30);
            expect(result[2].Age).toEqual(11);
        });
        it('Simple - Fixed Number', function () {
            var result = new jinqJs().from(['Tom', 'Jen', 'Diana', 'Sandy']).bottom(2).select();
            expect(result.length).toEqual(2);
            expect(result[0]).toEqual('Diana');
            expect(result[1]).toEqual('Sandy');
        });
        it('Simple - Percent', function () {
            var result = new jinqJs().from([8, 4, 2, 7]).bottom(.75).select();
            expect(result.length).toEqual(3);
            expect(result[0]).toEqual(4);
            expect(result[2]).toEqual(7);
        });
    });
    //TODO: SELECT STATEMENTS!!!!!
    describe('.select()', function () {
        it('Complex - Predicate Using row & index', function () {
            var result = new jinqJs().from(people1).select(function (row, index) {
                row.index = index + 1;
                return row;
            });
            expect(result.length).toEqual(4);
            expect(result[0].index).toEqual(1);
            expect(result[3].index).toEqual(4);
        });
        it('Complex - Multiple Specific String Columns', function () {
            var result = new jinqJs().from(people1).select('Age', 'Name');
            expect(result.length).toEqual(4);
            expect(result[0].Age).toEqual(29);
            expect(result[0].Name).toEqual('Tom');
            expect(result[0].Location).toBeUndefined();
        });
        it('Complex - Complex Array Object - Constant Column', function () {
            var result = new jinqJs().from(people1).select([{ field: 'Age' }, { field: 'Name' }, { text: 'IsHuman', value: true }]);
            expect(result.length).toEqual(4);
            expect(result[0].Age).toEqual(29);
            expect(result[0].Name).toEqual('Tom');
            expect(result[0].Location).toBeUndefined();
            expect(result[0].IsHuman).toBeTruthy();
        });
        it('Complex - Complex Array Object - Calculated Column', function () {
            var result = new jinqJs().from(people1).select([{ field: 'Age' }, { field: 'Name' }, {
                    text: 'IsHuman', value: function (row) {
                        row.IsHuman = true;
                        return row;
                    }
                }]);
            expect(result.length).toEqual(4);
            expect(result[0].Age).toEqual(29);
            expect(result[0].Name).toEqual('Tom');
            expect(result[0].Location).toBeUndefined();
            expect(result[0].IsHuman).toBeTruthy();
        });
        it('Complex - Complex Array Object - Change field text', function () {
            var result = new jinqJs().from(people1).select([{ field: 'Age' }, { field: 'Name', text: 'Title' }]);
            expect(result.length).toEqual(4);
            expect(result[0].Age).toEqual(29);
            expect(result[0].Name).toBeUndefined();
            expect(result[0].Title).toEqual('Tom');
        });
        it('Simple - Converting a string array to a collection', function () {
            var result = new jinqJs().from(['Tom', 'Jen', 'Sandy']).select([{ text: 'Name' }]);
            expect(result.length).toEqual(3);
            expect(result[0].Name).toEqual('Tom');
        });
        it('Key/Value - Converting to collections using positional', function () {
            var result = new jinqJs().from([{ "john": 28 }, { "bob": 34 }, { "joe": 4 }]).select([{ field: 0, text: 'Ages' }]);
            expect(result.length).toEqual(3);
            expect(result[0].Ages).toEqual(28);
        });
    });
    describe('Extensibility', function () {
        it('Plugin - Chaining', function () {
            jinqJs.addPlugin('overTheHill', function (result) {
                'use strict';
                for (var i = result.length - 1; i > -1; i--) {
                    if (result[i].Age < 40)
                        result.splice(i, 1);
                }
                //Must return this when chaining functions.
                return this;
            });
            var jinq = new jinqJs().from(people2);
            var result = jinq.overTheHill().select();
            expect(result.length).toEqual(1);
            expect(result[0].Age).toEqual(57);
        });
        it('Plugin - Parameters, Storage', function () {
            jinqJs.addPlugin('selectCustom', function (result, args, store) {
                'use strict';
                store.timesCalled = store.timesCalled || 0;
                store.timesCalled++;
                if (store.timesCalled === 1) {
                    result.push({
                        Name: args[0],
                        TimesCalled: store.timesCalled
                    });
                }
                else {
                    result[result.length - 1].TimesCalled = store.timesCalled;
                }
                //Return array when ending with the jinqJs chain.
                return result;
            });
            var jinq = new jinqJs().from(people2);
            var result = jinq.selectCustom('Sample');
            expect(result.length).toEqual(4);
            expect(result[3].Name).toEqual('Sample');
            expect(result[3].TimesCalled).toEqual(1);
            result = jinq.selectCustom('Sample');
            expect(result.length).toEqual(4);
            expect(result[3].Name).toEqual('Sample');
            expect(result[3].TimesCalled).toEqual(2);
        });
    });
    describe('.update().at()', function () {
        it('Simple - In-Place Update .at() with no Parameters.', function () {
            var data = JSON.parse(JSON.stringify(people1));
            new jinqJs()
                .from(data)
                .update(function (coll, index) { coll[index].Location = 'Port Jeff Sta.'; return null; })
                .at();
            expect(data.length).toEqual(4);
            expect(data[0].Location).toEqual('Port Jeff Sta.');
            expect(data[1].Location).toEqual('Port Jeff Sta.');
            expect(data[2].Location).toEqual('Port Jeff Sta.');
            expect(data[3].Location).toEqual('Port Jeff Sta.');
        });
        it('Simple - Upate/Delete primitive types.', function () {
            var simple = [3, 5, 4, 1, 2, 8, 4];
            var data = new jinqJs()
                .from(simple)
                .distinct()
                .delete()
                .at(function (coll, index) { return coll[index] <= 3; })
                .orderBy([{ sort: 'asc' }])
                .update(function (coll, index) { coll[index] = coll[index] + 100; return null; })
                .at(function (coll, index) { return index % 2 === 0; })
                .select();
            expect(data.length).toEqual(3);
            expect(data[0]).toEqual(104);
            expect(data[1]).toEqual(5);
            expect(data[2]).toEqual(108);
        });
        it('Simple - In-Place Update .at() with single string Parameter.', function () {
            var data = JSON.parse(JSON.stringify(people1));
            new jinqJs() //Sample doing in-place update 
                .from(data)
                .update(function (coll, index) { coll[index].Name = 'Thomas'; return null; })
                .at('Name = Tom');
            expect(data.length).toEqual(4);
            expect(data[0].Name).toEqual('Thomas');
            expect(data[1].Name).toEqual('Jen');
            expect(data[2].Name).toEqual('Thomas');
        });
        it('Simple - In-Place Update .at() with multiple string Parameters.', function () {
            var data = JSON.parse(JSON.stringify(people1));
            new jinqJs() //Sample doing in-place update 
                .from(data)
                .update(function (coll, index) { coll[index].Name = 'Thomas'; return null; })
                .at('Name = Tom', 'Age = 29');
            expect(data.length).toEqual(4);
            expect(data[0].Name).toEqual('Thomas');
            expect(data[1].Name).toEqual('Jen');
            expect(data[2].Name).toEqual('Tom');
        });
        it('Complex - Update with .at() predicate updating rows from a join returning results.', function () {
            var result = new jinqJs()
                .from(people1)
                .join(sexType)
                .on('Sex')
                .where('Age < 30')
                .update(function (coll, index) { coll[index].Name = 'Thomas'; return null; })
                .at(function (coll, index) { return (index === 1 && coll[index].Age === 14); })
                .select();
            expect(result.length).toEqual(3);
            expect(result[0].Name).toEqual('Tom');
            expect(result[1].Name).toEqual('Thomas');
            expect(result[2].Name).toEqual('Diana');
        });
    });
    describe('.delete().at()', function () {
        it('Complex - with .at() with a single parameter.', function () {
            var result = new jinqJs()
                .from(people1)
                .join(sexType)
                .on('Sex')
                .where('Age < 30')
                .update(function (coll, index) { coll[index].Name = 'Thomas'; return null; })
                .at(function (coll, index) { return (index === 1 && coll[index].Age === 14); })
                .delete()
                .at('Age = 11')
                .select();
            expect(result.length).toEqual(2);
            expect(result[0].Age).toEqual(29);
            expect(result[1].Age).toEqual(14);
        });
    });
});
