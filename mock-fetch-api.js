/*
ISC License:
Copyright (c) 2004-2010 by Internet Systems Consortium, Inc. ("ISC")
Copyright (c) 1995-2003 by Internet Software Consortium

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted, provided that the
above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND ISC DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
*/


/** MockFetch test support tool
 *
 *  Copyright (c) 2015 Adrian Geissel. All Rights Reserved.
 *  No unauthorised use without written Licence Agreement
 */

(function(global) {

require('isomorphic-fetch');

var conditions = [];
var failNextCall = false;

global.fetch = function(uri, options) {

  if(uri === 'isMocked') { return true; }

   options = Object.assign({
      method: 'GET',
      headers: null,
   }, options || {});

   return new Promise(function(FULFILL, REJECT) {

     process.nextTick(()=>{

       try {

          if(failNextCall) {
             failNextCall = false;

             return REJECT ? REJECT(new Error("failing, as requested")) : null;
          }

          for (var ii = 0; ii < conditions.length; ii++) {

             var criteria = conditions[ii];

             if(criteria.method === options.method && criteria.uri === uri) {

                // check that we have the expected headers
                for(var jj=0; jj<criteria.headers.length; jj++) {
                  var expectedHeader = criteria.headers[jj];
console.log(expectedHeader, options);

                  if(!options.headers || !options.headers.has(expectedHeader.header) || options.headers.get(expectedHeader.header) != expectedHeader.value) {

                    if(expectedHeader.elseResponse) {
                      return FULFILL(new Response("", {
                        status: expectedHeader.elseResponse.status,
                        statusText: expectedHeader.elseResponse.statusText || ''
                      }));
                    }

//console.log(criteria);
                    return FULFILL(new Response("", { status: 404, statusText: "Not Found" }));
                  }
                }

                conditions[ii].calledCount++;

                if(!!criteria.respondOnlyOnceCB && criteria.calledCount>1) {
                  if(typeof criteria.respondOnlyOnceCB === 'function') {
                    criteria.respondOnlyOnceCB(criteria);
                  }
                  return REJECT ? REJECT(new Error("uri called more than once")) : null;

                } else {

                  if(criteria.removeWhenCalled) {
                    conditions.splice(ii,1);
                  }
                  return FULFILL(new Response(criteria.response.jsonData, {
                     status: criteria.response.status,
                     headers: criteria.response.headers
                  }));
                }

             }
          }
//console.log(uri, options, conditions);
          return FULFILL(new Response("", { status: 404, statusText: "Not Found" }));
        }
        catch(ex) {

//          console.log('Unexpected Exception: ', ex);

          return REJECT ? REJECT(new Error(ex.message)) : null;
        }

      });

   });
};


module.exports = {

   clear: function() { conditions = []; },

   inspect: function() { return conditions; },

   when: function(method, uri) {

      var condition = {

         method: method,
         uri: uri,
         headers: [],
         response: null,
         respondOnlyOnceCB: null,
         calledCount: 0,
         removeWhenCalled: false,

         withExpectedHeader: function(header, value) {

            condition.headers.push({
               header: header,
               value: value,
               elseResponse: null
            });

            return condition;
         },

         otherwiseRespondWith: function(status, statusText) {

            if(condition.headers.length > 0) {
               condition.headers[condition.headers.length-1].elseResponse = {
                  status: status,
                  statusText: statusText || '',
               };
               return condition;
            }
            throw "no preceding header set";
         },

         respondWith: function(status, data, headers) {

            condition.response = {
               status: status,
               statusText: '--',
               jsonData: data,
               headers: new Headers(headers)
            };

            conditions.push(condition);
            return condition;
         },

         respondOnlyOnce: function(cb) {
            if(conditions.length > 0) {
              conditions[conditions.length-1].respondOnlyOnceCB = cb;
              return condition;
            }
            throw "respondWith() must be called first";
         },

         andThenRemove: function() {
           if(conditions.length > 0) {
             conditions[conditions.length-1].removeWhenCalled = true;
             return condition;
           }
           throw "respondWith() must be called first";
         }

      };
      return condition;
   },

   failNextCall: function () { failNextCall = true; }

};


})(typeof window === 'undefined' ? this : window);
