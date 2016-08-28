/*************************************************************************************************
 The MIT License (MIT)

 Copyright (c) 2015 THOMAS FORD

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 AUTHOR: Thomas Ford
 DATE:   3/21/2015
         http://jinqJs.com

 ------------------------------------------------------------------------------------------
 DATE:     3/23/15
 VERSION:  .1.1
 NOTE:     Added leftJoin(), avg(), and predicate for on().

 DATE:     3/26/15
 VERSION:  .1.2
 NOTE:     Minor corrections

 DATE:     3/30/15
 VERSION   .1.3
 NOTE:     Added ability to sort asc/desc on plain arrays
 concat() and union()

 DATE:     4/1/15
 VERSION:   .1.4
 NOTE:     Added support for positional for orderBy and Select on {field: #} objects

 DATE:     4/2/15
 VERSION:  .1.5
 NOTE:      Added ability to join() on() collections with simple arrays

 DATE:     4/3/15
 VESION:   .1.6
 NOTE:      Added index as 2nd parameter for .where() and .select()
 Added .not(), .in()

 DATE:     4/4/15
 VERSION   1.00
 NOTE:     Added ability to do .distinct(), .max(),. min(), .avg() on simple arrays.
 Added ability to union simple arrays.
 .in() can except multiple columns to compare to.
 If .orderBy() uses positional, then all fields ordered must be positional
 Added support for .identity() on simple arrays. When on simple arrays the value gets set to a "Value" column by default.
 Included unit tests

 DATE:     4/11/15
 VERSION   1.13
 NOTE:     Made various performance improvements.
 Added new ability to perform Full Joins using .fullJoin() <-- Only String columns, no expressions
 Added new function .skip().
 Added support for strong type comparison === and !== in .where() when using expressions.
 Fixed an issue with the .not().in() function not properly working when using multiple columns.

 DATE:     4/13/15
 VERSION   1.2a
 NOTE:     Added new function jinqJs.addPlugin() to allow extensibility. See API documentation.

 DATE:     4/13/15
 VERSION   1.3
 NOTE:     Added module jinqJs to support node.js.

 DATE:     7/12/15
 VERSION   1.4
 NOTE:     Added the ability to support a single parameter as an array of fields for the distinct().
           Thank you to jinhduong for contributing and your recommendation.
           
 DATE:     8/1/15
 VERSION:  1.5
 NOTE:     .Did some code refactoring for getExpression() and isTruthy() functions.
           .Added new function filter(), filter() function is synonymous to the where() function.
              The filter() is just a refernce to the where() and can be used interchangeably.
           .Added ability to now update rows inside an array. The update does an in-place update 
              (Referencing the original array), it is not necessary to execute the select() when only
              performing an update on the array. New functions update() and at() have been added.
              
 DATE:     8/3/15
 VERSION:  1.5.1
 NOTE:     Added .delete() for deleting records when the .at() is true.

 DATE:     8/12/15
 VERSION:  1.5.2
 NOTE:     Changed the .at() and .update() predicates first parameter not to be a row object, but the array instead.
           The two parameters passed to the delegate are now (collection, index). This was changed due to an issue when trying to
           update simple arrays i.e. [1,2,3,4,5], since they are not object types they were not getting updated.

 DATE:     11/24/15
 VERSION:  1.5.3
 NOTE:     Added support for TYpeScript definition file.

 DATE:     11/24/15
 VERSION:  1.5.3
 NOTE:     Added support for TYpeScript definition file.

 DATE:     12/5/15
 VERSION:  1.5.6
 NOTE:     Fixed bug when R-Value of an expression contained spaces.

 DATE:     1/3/16
 VERSION:  1.5.9
 NOTE:     Added jinqJs service for Angular 1.x

 DATE:     5/14/16
 VERSION:  1.6.0
 NOTE:     Thanks to gpminsuk for recommending a change to isObject() you can now perform a select on an array that contains arrays.
           For example: .from([[1,2,3],[4,5,6]]).select(2)  Will return the second element of each of the arrays in the root array.
 *************************************************************************************************/

var jinqJs = function (settings) {
    'use strict';

    /* Private Variables */
    var collections = [],
        result = [],
        groups = [],
        notted = false,
        identityUsed = false,
        delegateUpdate = null,
        deleteFlag = false,
        operators = {
            LessThen: 0,
            LessThenEqual: 1,
            GreaterThen: 2,
            GreaterThenEqual: 3,
            Equal: 4,
            EqualEqualType: 5,
            NotEqual: 6,
            NotEqualEqualType: 7,
            Contains: 8
        },
        storage = {};

    jinqJs.settings = jinqJs.settings || {};

    /* Constructor Code */
    if (typeof settings !== 'undefined') {
        jinqJs.settings = settings;
    }
    else {
        jinqJs.settings = {
            includeIdentity: jinqJs.settings.includeIdentity || false
        };
    }

    /* Private Methods (no prefix) */
    var isEmpty = function (array) {
            return (typeof array === 'undefined' ||
            array.length === 0);
        },

        isArray = function (array) {
            return (hasProperty(array, 'length') && !isString(array) && !isFunction(array));
            /*
            return (array !== null && Array.isArray(array));
            var old = (hasProperty(array, 'length') && !isString(array) && !isFunction(array));
            var nw = (array !== null && Array.isArray(array));

            if (old !== nw)
                console.log({old: old, nw: nw, data: array});

            return (hasProperty(array, 'length') && !isString(array) && !isFunction(array));
            */
        },

        isObject = function (obj) {
            return (obj !== null && (obj.constructor === Object || isArray(obj)));
            //return (obj !== null && !isArray(obj) && typeof obj === 'object');
        },

        isString = function (str) {
            return (str !== null && str.constructor === String);
        },

        hasProperty = function (obj, property) {
            return obj[property] !== undefined; //(typeof obj[property] !== 'undefined'); //((obj[property] || null) !== null);
        },

        isFunction = function (func) {
            return (typeof func === 'function'); //(func !== null && func.constructor === Function);
        },

        isNumber = function (value) {
            return typeof value === 'number';
        },

        arrayItemFieldValueExists = function (collection, field, value) {
            for (var index = 0; index < collection.length; index++) {
                if (collection[index][field] === value)
                    return true;
            }

            return false;
        },

        arrayFindFirstItem = function (collection, obj) {
            return arrayFindItem(collection, obj, true);
        },

        arrayFindItem = function (collection, obj, findFirst) {
            var row = null;
            var isMatch = false;
            var ret = [];
            var isObj = false;

            findFirst = findFirst || false;
            for (var index = 0; index < collection.length; index++) {

                isMatch = false;
                for (var field in obj) {

                    row = collection[index];
                    isObj = isObject(row);
                    if ((!isObj && row != obj[field]) || (isObj && row[field] != obj[field])) {
                        isMatch = false;
                        break;
                    }

                    isMatch = true;
                }

                if (isMatch) {
                    if (findFirst)
                        return row;
                    else
                        ret.push(row);
                }
            }

            return (ret.length === 0 ? null : ret);
        },

        condenseToFields = function (obj, fields) {
            var newObj = {};
            var field = null;

            for (var index = 0; index < fields.length; index++) {
                field = fields[index];

                if (hasProperty(obj, field))
                    newObj[field] = obj[field];
                else
                    newObj[field] = 0;
            }

            return newObj;
        },

        aggregator = function (args, predicate) {
            var collection = [];
            var keys = null;
            var values = null;
            var row = null;

            for (var index = 0; index < result.length; index++) {
                keys = condenseToFields(result[index], groups);
                values = condenseToFields(result[index], args);

                row = arrayFindFirstItem(collection, keys);
                if (row === null) {
                    row = {};
                    for (var keyField in keys)
                        row[keyField] = keys[keyField];

                    for (var valField in values)
                        row[valField] = predicate(row[valField], values[valField], JSON.stringify(keys) + valField);


                    collection.push(row);
                }
                else {
                    for (var vField in values) {
                        row[vField] = predicate(row[vField], result[index][vField], JSON.stringify(keys) + vField);
                    }
                }
            }

            groups = [];
            return collection;
        },

        orderByComplex = function (complexFields) {
            var complex = null;
            var prior = null;
            var field = null;
            var firstField = null;
            var secondField = null;
            var priorFirstField = null;
            var priorSecondField = null;
            var order = 1;
            var lValue = null;
            var rValue = null;
            var isNumField = false;

            for (var index = 0; index < complexFields.length; index++) {
                prior = (index > 0 ? complexFields[index - 1] : null);
                complex = complexFields[index];
                field = (hasProperty(complex, 'field') ? complex.field : null);
                order = (hasProperty(complex, 'sort') && complex.sort === 'desc' ? -1 : 1);
                isNumField = (field !== null && !isNaN(field) ? true : false);

                result.sort(function (first, second) {
                    if (isNumField) {
                        firstField = Object.keys(first)[field];
                        secondField = Object.keys(second)[field];

                        if (prior !== null) {
                            priorFirstField = Object.keys(first)[prior.field];
                            priorSecondField = Object.keys(second)[prior.field];
                        }
                    }
                    else {
                        firstField = secondField = field;

                        if (prior !== null)
                            priorFirstField = priorSecondField = prior.field;
                    }

                    lValue = (field === null ? first : (isNaN(first[firstField]) ? first[firstField] : Number(first[firstField])));
                    rValue = (field === null ? second : (isNaN(second[secondField]) ? second[secondField] : Number(second[secondField])));

                    var compareResult = null;

                    if (typeof lValue === "string") {
                        try {
                            compareResult = lValue.localeCompare(rValue);
                        }
                        catch (e) {
                        }
                    }

                    if (compareResult === null) {
                        compareResult = lValue < rValue ? -1 : lValue > rValue ? 1 : 0;
                    }

                    return compareResult !== 0 && (prior === null || (field === null || first[priorFirstField] == second[priorSecondField]))
                        ? compareResult * order
                        : 0;
                });
            }
        },

        flattenCollection = function (collection) {
            //This is done for optimal performance
            switch (collection.length) {
                case 1:
                    return collection[0].concat();
                case 2:
                    return [].concat(collection[0], collection[1]);
                case 3:
                    return [].concat(collection[0], collection[1], collection[2]);
                case 4:
                    return [].concat(collection[0], collection[1], collection[2], collection[3]);
                case 5:
                    return [].concat(collection[0], collection[1], collection[2], collection[3], collection[4]);
                default:
                    var flatCollection = [];

                    for (var index = 0; index < collection.length; index++)
                        flatCollection = flatCollection.concat(collection[index]);

                    return flatCollection;
            }
        },

    /* Possible future use */
        pluckRowByMissingField = function (collection, args) {
            var ret = [];
            var bIsMissing = false;

            if (args.length === 0)
                return collection;

            for (var index = 0; index < collection.length; index++) {
                bIsMissing = false;
                for (var iArg = 0; iArg < args.length; iArg++) {
                    if (!hasProperty(collection[index], args[iArg])) {
                        bIsMissing = true;
                        break;
                    }
                }

                if (!bIsMissing)
                    ret.push(collection[index]);
            }

            return ret;
        },

        mergeObjectsFields = function (objects) {
            var obj = {};

            for (var index = 0; index < objects.length; index++) {
                for (var prop in objects[index]) {
                    obj[prop] = objects[index][prop];
                }
            }

            return obj;
        },

        convertToEmptyObject = function (obj) {
            var o = {};

            for (var field in obj)
                o[field] = '';

            return o;
        },

        convertToOperatorEnum = function (operator) {
            switch (operator) {
                case '<':
                    return operators.LessThen;
                case '>':
                    return operators.GreaterThen;
                case '!=':
                    return operators.NotEqual;
                case '!==':
                    return operators.NotEqualEqualType;
                case '=':
                case '==':
                    return operators.Equal;
                case '===':
                    return operators.EqualEqualType;
                case '<=':
                    return operators.LessThenEqual;
                case '>=':
                    return operators.GreaterThenEqual;
                case '*':
                    return operators.Contains;
                default:
                    throw 'Invalid Expression!';
            }
        },

        convertToFieldArray = function (obj) {
            var array = [];

            for (var field in obj) {
                array.push({
                    field: field
                });
            }

            return array;
        },

        isNode = function() {
            return (typeof module !== 'undefined' && typeof module.exports !== 'undefined');
        },

        onFromJoin = function (joinType, comparers) {
            var row = null;
            var ret = [];
            var matches = null;
            var collection = [];
            var startIndex = 1;

            if (!isArray(comparers) || comparers.length === 0 || collections.length === 0) return;

            switch (joinType) {
                case 'from':
                    //If we have just one pending collection then just return it, there is nothing to join it with
                    if (collections.length === 1) {
                        result = collections[0];
                        return;
                    }

                    collection = collections[0];
                    break;

                case 'full':
                case 'inner':
                case 'left':
                    collection = result;
                    startIndex = 0;
                    break;

                default:
                    return;
            }

            for (var index = startIndex; index < collections.length; index++) {
                ret = [];

                collection.forEach(function (lItem) {

                    if (isFunction(comparers[0])) {
                        matches = [];
                        collections[index].forEach(function (item) {
                                if (comparers[0](lItem, item))
                                    matches.push(item);
                            }
                        );

                        //This condition is used to handle left joins with a predicate
                        if (matches.length === 0) {
                            matches = null;
                        }
                    }
                    else {
                        row = condenseToFields(lItem, comparers);
                        matches = arrayFindItem(collections[index], row);
                    }

                    if (matches !== null) {
                        if (isString(matches[0]))
                            ret.push(lItem);
                        else {
                            matches.forEach(function (rItem) {
                                ret.push(mergeObjectsFields([rItem, lItem]));
                            });
                        }
                    }
                    else {
                        if (joinType === 'left' || joinType === 'full') {
                            if (collections[index].length > 0) {
                                //The order of merging objects is important here, right -> left
                                row = convertToEmptyObject(collections[index][0]);
                                row = mergeObjectsFields([row, lItem]);
                            }
                            ret.push(mergeObjectsFields([lItem, row]));
                        }
                    }
                });

                //Next get the elements on the right that are not in the result
                if (joinType === 'full') {
                    var z = new jinqJs().from(collections[index]).not().in(ret, comparers).select(convertToFieldArray(ret[0]));
                    ret = ret.concat(z);
                }

                collection = ret;
            }

            collections = [];
            result = ret;
        },

        joinIt = function (joinType, args) {
            if (args.length === 0) return this;

            collections = [];
            collections.func = joinType;
            for (var index = 0; index < args.length; index++) {
                if (args[index].length > 0)             //Could be a url string here or an array here. Length is ok to use either way
                    collections.push(args[index]);
            }
        },

        nodeServiceCall = function(self, url, callback){
            var http = require("http");

            http.get(url, function(response){
               var content = '';

                response.on('data', function(data){ content += data; });
                response.on('end', function() {
                    var data = JSON.parse(content);
                    var collection = null;

                    if (isArray(data))
                        collection = data;
                    else
                        collection = new Array(data);

                    collections.push(collection);
                    result = collection;

                    if (isFunction(callback))
                        callback(self);
                });
            });
        },

        browserServiceCall = function(self, url, callback){
            var xmlhttp = new XMLHttpRequest();
            var collection = null;

            if (isFunction(callback)) {
                xmlhttp.onreadystatechange = function () {
                    if (xmlhttp.response.length === 0)
                        return;

                    var response = JSON.parse(xmlhttp.response);

                    if (isArray(response))
                        collection = response;
                    else
                        collection = new Array(response);

                    collections.push(collection);
                    result = collection;

                    callback(self);
                };
            }


            xmlhttp.open("GET", url, isFunction(callback));
            xmlhttp.send();

            if (!isFunction(callback)) {

                var response = JSON.parse(xmlhttp.response);

                if (isArray(response))
                    collection = response;
                else
                    collection = new Array(response);

                collections.push(collection);
            }
        },
        
        getExpressions = function(args){
          var regExpr = /([^\s]+)\s(<|>|!=|!==|=|==|===|<=|>=|\*)\s(.+)/;
          var argLen = args.length;
          var expr = new Array(argLen);
          
          for (var eIndex = 0; eIndex < argLen; eIndex++) {
              var matches = args[eIndex].match(regExpr);

              if (matches.length !== 4)
                  throw ('Invalid expression!');

              expr[eIndex] = {
                  lField: matches[1],
                  operator: convertToOperatorEnum(matches[2]),
                  rValue: matches[3]
              };
          }
          
          return expr;
        },
        
        isTruthy = function(row, expr){
          switch (expr.operator) {
            case operators.EqualEqualType:
                return (row[expr.lField] === expr.rValue);

            case operators.NotEqualEqualType:
                return (row[expr.lField] !== expr.rValue);

            case operators.LessThen:
                return (row[expr.lField] < expr.rValue);

            case operators.GreaterThen:
                return (row[expr.lField] > expr.rValue);

            case operators.NotEqual:
                return (row[expr.lField] != expr.rValue);

            case operators.Equal:
                return (row[expr.lField] == expr.rValue);

            case operators.LessThenEqual:
                return (row[expr.lField] <= expr.rValue);

            case operators.GreaterThenEqual:
                return (row[expr.lField] >= expr.rValue);

            case operators.Contains:
                return (row[expr.lField].indexOf(expr.rValue) > -1);

            default:
                return false;
          }
        };

    /* Exposed Methods (prefixed with _) */
    var _from = function () {
            var collection = null;
            var callback = null;


            if (arguments.length === 0) return this;

            result = [];
            for (var index = 0; index < arguments.length; index++) {
                if (arguments[index] === null || arguments[index].length === 0)
                    continue;

                if (arguments.length == 2 && isFunction(arguments[1])) {
                    collection = arguments[0];
                    callback = arguments[1];
                    index = arguments.length;
                }
                else {
                    collection = arguments[index];

                    //Check for a callback function we dont support asyn callbacks with multiple tables
                    if (isFunction(collection))
                        continue;
                }

                if (isString(collection)) {
                    if (!isNode())
                        browserServiceCall(this, collection, callback);
                    else
                        nodeServiceCall(this, collection, callback);
                }
                else {
                    collections.push(collection);
                }
            }

            collections.func = 'from';
            result = flattenCollection(collections);

            return (isFunction(callback) ? callback : this);
        },

        _select = function () {
            var fields = null;
            var fieldIsObject = false;
            var fieldIsPredicate = false;
            var collection = null;


            if (isEmpty(result))
                return [];

            var obj = null;
            var srcFieldName = null;
            var dstFieldName = null;
            var isSimple = false;
            var fieldDefs = null;

            if (jinqJs.settings.includeIdentity && !identityUsed) {
                _identity();
            }

            if (isEmpty(arguments)) {
                return result;
            }

            collection = new Array(result.length);

            //Check if an Array of objects is passed in as first parameter
            if (isArray(arguments[0])) {
                fields = arguments[0];
                fieldIsObject = true;
                fieldDefs = new Array(fields.length);

                for (var fIndex = 0; fIndex < fields.length; fIndex++) {
                    fieldDefs[fIndex] = {
                        hasField: hasProperty(fields[fIndex], 'field'),
                        hasText: hasProperty(fields[fIndex], 'text'),
                        hasValue: hasProperty(fields[fIndex], 'value'),
                    };
                }
            }
            else if (isFunction(arguments[0])) {
                fields = arguments[0];
                fieldIsPredicate = true;
            }
            else {
                fields = arguments;
            }

            isSimple = !isObject(result[0]);    //It cant be empty if I got here
            for (var index = 0; index < result.length; index++) {
                if (fieldIsPredicate) {
                    collection[index] = fields(result[index], index);
                }
                else {
                    obj = {};

                    for (var field = 0; field < fields.length; field++) {
                        if (fieldIsObject) {
                            if (fieldDefs[field].hasField) {
                                if (!isNumber(fields[field].field))
                                    srcFieldName = fields[field].field;
                                else
                                    srcFieldName = Object.keys(result[index])[fields[field].field];
                            }

                            dstFieldName = (fieldDefs[field].hasText ? fields[field].text : fields[field].field);
                        } else {
                            dstFieldName = srcFieldName = fields[field];
                        }

                        if (fieldIsObject && fieldDefs[field].hasValue) {
                            if (isFunction(fields[field].value))
                                obj[dstFieldName] = fields[field].value(result[index]);
                            else
                                obj[dstFieldName] = fields[field].value;
                        } else {
                            obj[dstFieldName] = (isSimple ? result[index] : (result[index][srcFieldName] || null) );
                        }
                    }

                    collection[index] = obj;
                }
            }

            return collection;
        },

        _update = function(predicate) {
          if (deleteFlag)
            throw ('A pending delete operation exists!');
          
          if (typeof predicate === 'undefined' || !isFunction(predicate))
            return this;

          delegateUpdate = predicate;

          return this;     
        },
        
        _delete = function() {
          if (delegateUpdate !== null)
            throw ('A pending update operation exists!');
          
          deleteFlag = true;
          
          return this;
        },
        
        _at = function() {
          var resLen = result.length;
          var expr = null;
          var isPredicateFunc = false;
          var isTruthfull = false;
          var argLen = arguments.length;
          
          
          if ( (delegateUpdate === null && !deleteFlag) || resLen === 0)
            return this;
          
          if (argLen > 0){
            isPredicateFunc = isFunction(arguments[0]);
            if (!isPredicateFunc) {
                expr = getExpressions(arguments);
            } 
          }
            
          for (var index = resLen-1; index > -1; index--) {
            if (isPredicateFunc) {
              if (arguments[0](result, index)) {
                if (deleteFlag)
                  result.splice(index,1);
                else
                  delegateUpdate(result, index); 
              }
            }
            else if (argLen === 0) {
              if (deleteFlag)
                result.splice(index,1);
              else
                delegateUpdate(result, index); 
            } else {
              for (var arg = 0; arg < argLen; arg++) {
                  isTruthfull = isTruthy(result[index], expr[arg]);

                  if (!isTruthfull)
                      break;
              }

              if (isTruthfull) {
                  if (deleteFlag)
                    result.splice(index,1);
                  else
                    delegateUpdate(result, index); 
              }
            }
          }       
            
          delegateUpdate = null;
          deleteFlag = false;
          
          return this;
        },

        _concat = function () {
            collections.func = null;

            for (var index = 0; index < arguments.length; index++)
                result = result.concat(arguments[index]);

            return this;
        },

        _top = function (amount) {
            var totalRows = 0;

            //Check for a percentage
            if (amount > -1 && amount < 1) {
                totalRows = result.length * amount;
            }
            else
                totalRows = amount;

            if (amount < 0) {
                result = result.slice(totalRows, (result.length - Math.abs(totalRows) * -1));
            }
            else
                result = result.slice(0, totalRows);

            return this;
        },

        _bottom = function (amount) {
            _top(amount * -1);

            return this;
        },

        _where = function (predicate) {
            var collection = [];
            var isPredicateFunc = false;
            var isTruthfull = false;
            var argLen = arguments.length;
            var resLen = result.length;
            var expr = null;
            var row = null;

            if (typeof predicate === 'undefined')
                return this;

            isPredicateFunc = isFunction(predicate);

            if (!isPredicateFunc) {
                expr = getExpressions(arguments);
            }

            for (var index = 0; index < resLen; index++) {
                row = result[index];

                if (isPredicateFunc) {
                    if (predicate(row, index))
                        collection.push(row);
                }
                else {
                    for (var arg = 0; arg < argLen; arg++) {
                        isTruthfull = isTruthy(row, expr[arg]);

                        if (!isTruthfull)
                            break;
                    }

                    if (isTruthfull)
                        collection.push(row);
                }
            }

            result = collection;

            return this;
        },

        _distinct = function () {
            var collection = [];
            var row = null;
            var field = null;
            var index = 0;
            var len = result.length;
            var collSize = 0;
            var dupp = false;

            if (arguments.length === 0) {
                if (isObject(result[0])) {
                    for (index = 0; index < len; index++) {
                        dupp = false;
                        for (var i = 0; i < collSize; i++) {
                            if (result[index] !== collection[i])
                                continue;

                            dupp = true;
                            break;
                        }

                        if (!dupp)
                            collection[collSize++] = result[index];
                    }
                }
                else {
                    var obj = {};
                    for (index = 0; index !== len; index++) {
                        row = result[index];
                        if (obj[row] !== 1) {
                            obj[row] = 1;
                            collection[collection.length] = row;
                        }
                    }
                }
            }
            else {
                var argsDistinct = arguments;
                if (Array.isArray(arguments[0]))
                    argsDistinct = arguments[0];

                for (index = 0; index < len; index++) {
                    row = condenseToFields(result[index], argsDistinct);
                    for (var fieldIndex = 0; fieldIndex < argsDistinct.length; fieldIndex++) {

                        field = argsDistinct[fieldIndex];
                        if (!arrayItemFieldValueExists(collection, field, row[field])) {
                            collection.push(row);
                            break;
                        }
                    }
                }
            }

            result = collection;

            return this;
        },

        _groupBy = function () {
            groups = arguments;

            return this;
        },

        _sum = function () {
            var sum = {};

            if (groups.length === 0) {
                sum = 0;
                for (var index = 0; index < result.length; index++)
                    sum += (arguments.length === 0 ? result[index] : result[index][arguments[0]]);

                result = [sum];
            }
            else {
                result = aggregator(arguments, function (lValue, rValue, keys) {
                    var key = keys;//JSON.stringify(keys);

                    if (!hasProperty(sum, key))
                        sum[key] = 0;

                    return sum[key] += rValue;
                });
            }

            return this;
        },

        _avg = function () {
            var avg = {};

            if (groups.length === 0) {
                avg = 0;
                for (var index = 0; index < result.length; index++)
                    avg += (arguments.length === 0 ? result[index] : result[index][arguments[0]]);

                result = [avg / result.length];
            }
            else {
                result = aggregator(arguments, function (lValue, rValue, keys) {
                    var key = JSON.stringify(keys);

                    if (!hasProperty(avg, key))
                        avg[key] = { count: 0, sum: 0 };

                    avg[key].count++;
                    avg[key].sum += rValue;

                    return avg[key].sum / avg[key].count;
                });
            }

            return this;
        },

        _count = function () {
            var total = {};

            result = aggregator(arguments, function (lValue, rValue, keys) {
                var key = JSON.stringify(keys);

                if (!hasProperty(total, key))
                    total[key] = 0;

                return ++total[key];
            });

            return this;
        },

        _min = function () {
            var minValue = {};
            var value = 0;

            if (groups.length === 0) {
                minValue = -1;
                for (var index = 0; index < result.length; index++) {
                    value = (arguments.length === 0 ? Number(result[index]) : Number(result[index][arguments[0]]));
                    minValue = (value < minValue || minValue === -1 ? value : minValue);
                }

                result = [minValue];
            } else {
                result = aggregator(arguments, function (lValue, rValue, keys) {
                    var key = JSON.stringify(keys);
                    if (!hasProperty(minValue, key))
                        minValue[key] = 0;

                    if (minValue[key] === 0 || rValue < minValue[key])
                        minValue[key] = rValue;

                    return minValue[key];
                });
            }

            return this;
        },

        _max = function () {
            var maxValue = {};
            var value = 0;

            if (groups.length === 0) {
                maxValue = -1;
                for (var index = 0; index < result.length; index++) {
                    value = (arguments.length === 0 ? Number(result[index]) : Number(result[index][arguments[0]]));
                    maxValue = (value > maxValue || maxValue === -1 ? value : maxValue);
                }

                result = [maxValue];
            } else {
                result = aggregator(arguments, function (lValue, rValue, keys) {
                    var key = JSON.stringify(keys);
                    if (!hasProperty(maxValue, key))
                        maxValue[key] = 0;

                    if (rValue > maxValue[key])
                        maxValue[key] = rValue;

                    return maxValue[key];
                });
            }

            return this;
        },

        _identity = function () {
            var id = 1;
            var label = (arguments.length === 0 ? 'ID' : arguments[0]);
            var isSimple = (result.length > 0 && !isObject(result[0]));
            var ret = [];
            var obj = null;

            identityUsed = true;
            for (var index = 0; index < result.length; index++) {
                if (isSimple) {
                    obj = {};
                    obj[label] = id++;
                    obj.Value = result[index];

                    ret.push(obj);
                }
                else
                    result[index][label] = id++;
            }

            if (isSimple)
                result = ret;

            return this;
        },

        _orderBy = function () {
            var fields = arguments;

            if (arguments.length > 0 && isArray(arguments[0])) {
                orderByComplex(arguments[0]);
                return this;
            }

            result.sort(function (first, second) {
                var firstFields = JSON.stringify(condenseToFields(first, fields));
                var secondFields = JSON.stringify(condenseToFields(second, fields));

                try {
                    return firstFields.localeCompare(secondFields);
                }
                catch (e) {
                }

                if (firstFields < secondFields)
                    return -1;

                if (firstFields > secondFields)
                    return 1;

                return 0;   //Egual
            });

            return this;
        },

        _union = function () {
            if (arguments.length === 0 || !isArray(arguments[0]) || arguments[0].length === 0) return this;

            if (!isObject(arguments[0][0])) {
                for (var index = 0; index < arguments.length; index++)
                    _concat(arguments[index]);

                _distinct();
            }
            else {
                var collection = flattenCollection(arguments);

                _concat(collection);
                groups = [];
                for (var field in arguments[0][0])
                    groups.push(field);

                _count();
            }

            return this;
        },

        _on = function () {
            if (arguments.length === 0 || !hasProperty(collections, 'func')) return this;

            onFromJoin(collections.func, arguments);
            collections.func = null;

            return this;
        },

        _in = function () {
            var ret = [];
            var outerField = null;
            var innerField = null;
            var match = false;
            var fields = [];
            var collection = null;

            if (arguments.length === 0)
                return this;

            collection = arguments[0];
            if (collection.length === 0 || result.length === 0)
                return this;

            var isInnerSimple = !isObject(collection[0]);
            var isOuterSimple = !isObject(result[0]);

            if ((!isInnerSimple || !isOuterSimple) && arguments.length < 2)
                throw 'Invalid field or missing field!';

            if (arguments.length < 2)
                fields = [0]; //Just a dummy position holder
            else {
                if (isArray(arguments[1]))
                    fields = arguments[1];
                else {
                    for (var i = 1; i < arguments.length; i++) fields.push(arguments[i]);
                }
            }

            var matches = 0;
            for (var outer = 0; outer < result.length; outer++) {
                for (var inner = 0; inner < collection.length; inner++) {
                    matches = 0;
                    for (var index = 0; index < fields.length; index++) {
                        outerField = (isOuterSimple ? result[outer] : result[outer][fields[index]]);
                        innerField = (isInnerSimple ? collection[inner] : collection[inner][fields[index]]);

                        match = (outerField === innerField);

                        if (match)
                            matches++;
                    }

                    if (matches === fields.length)
                        break;
                }

                if ((inner < collection.length && !notted) || (inner === collection.length && notted))
                    ret.push(result[outer]);
            }

            notted = false;
            result = ret;
            return this;
        },

        _join = function () {
            joinIt('inner', arguments);

            return this;
        },

        _leftJoin = function () {
            joinIt('left', arguments);

            return this;
        },

        _fullJoin = function () {
            joinIt('full', arguments);

            return this;
        },

        _not = function () {
            notted = true;

            return this;
        },

        _skip = function () {
            var totalRows = 0;

            if (arguments.length === 0 || !isNumber(arguments[0]))
                return this;

            //Check for a percentage
            var amount = arguments[0];
            if (amount > -1 && arguments[0] < 1) {
                totalRows = result.length * amount;
            }
            else
                totalRows = amount;

            result = result.slice(totalRows);

            return this;
        };

    //Globals
    this.from = _from;
    this.select = _select;
    this.update = _update;
    this.top = _top;
    this.bottom = _bottom;
    this.where = _where;
    this.distinct = _distinct;
    this.groupBy = _groupBy;
    this.sum = _sum;
    this.count = _count;
    this.min = _min;
    this.max = _max;
    this.avg = _avg;
    this.identity = _identity;
    this.orderBy = _orderBy;
    this.on = _on;
    this.join = _join;
    this.leftJoin = _leftJoin;
    this.fullJoin = _fullJoin;
    this.concat = _concat;
    this.union = _union;
    this.not = _not;
    this.in = _in;
    this.skip = _skip;
    this.filter = _where;
    this.at = _at;
    this.delete = _delete;
    this._x = function(name, args, plugin){
        storage[name] = storage[name] || {};
        return plugin.call(this, result, args, storage[name]);
    };
};

(function() {
    'use strict';

    jinqJs.addPlugin = function(name, plugin) {
        jinqJs.prototype[name] = function() {return this._x(name, arguments, plugin);};
    };

    //node.js
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports = jinqJs;

    if (typeof angular !== 'undefined'){
        angular.module('angular-jinqjs', []).service('$jinqJs', function() {return new jinqJs(); });
    }
})();
