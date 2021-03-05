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

jest.autoMockOff();

describe('MockFetch test', () =>  {

   it("can set a condition which is returned by fetch", async () => {
      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('GET', 'http://mydomain.com').respondWith(200, '"Hello World"');

      await fetch('http://mydomain.com').then((response) => {
         return response.json();

      }).then((data) => {
         expect(data).toBe('Hello World');
      });
   });


   it("can set a condition which is returned by fetch", async () => {
      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('GET', 'http://mydomain.com').respondWith(200, '"Hello World"');

      await fetch('http://mydomain.com').then((response) => {
         response.json().then((data) => {
            expect(data).toBe('Hello World');
         });
      });
   });


   it("test connection with default method GET", async () => {

      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('GET', 'http://mydomain.com').respondWith(200, '"Hello World"');

      await fetch('http://mydomain.com', {}).then((response) => {
         expect(response.status).toBe(200);
      });
   });


   it("only responds when matched correctly", async () => {
      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('GET', 'http://mydomain.com').respondWith(200, '"Hello World"');

      await fetch('http://mydomain.com', { method: 'PUT'}).then((response) => {

         expect(response.status).toBe(404);
         expect(response.statusText).toBe('Not Found');
      });
   });


   it("also checks for an expected header value", async () => {
      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('GET', 'http://mydomain.com')
         .withExpectedHeader('X-AuthToken','1234')
         .otherwiseRespondWith(401, "Not Authorized")
         .respondWith(200, '"Hello World"');

      await fetch('http://mydomain.com', { method: 'GET', headers: new Headers({
         'X-AuthToken':'1234'
      })}).then((response) => {
         expect(response.status).toBe(200);
      });
   });


   it("fails when expected header is not set", async () => {
      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('GET', 'http://mydomain.com')
         .withExpectedHeader({'X-AuthToken':'1234'}).otherwiseRespondWith(401, "Not Authorized")
         .respondWith(200, '"Hello World"');

      await fetch('http://mydomain.com', { method: 'GET'}).then((response) => {

         expect(response.status).toBe(401);
         expect(response.statusText).toBe('Not Authorized');
      });
   });


   it("fails when expected header is has the wrong value", async () => {
      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('GET', 'http://mydomain.com')
         .withExpectedHeader('X-AuthToken','1234').otherwiseRespondWith(401, "Not Authorized")
         .respondWith(200, '"Hello World"');

      await fetch('http://mydomain.com', { method: 'GET', headers: new Headers({
         'X-AuthToken':'4321'
      })}).then((response) => {
         expect(response.status).toBe(401);
         expect(response.statusText).toBe('Not Authorized');
      });
   });


   it("can check for multiple expected headers", async () => {
      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('GET', 'http://mydomain.com')
         .withExpectedHeader('X-AuthToken','1234')
         .withExpectedHeader('BANANA','8757').otherwiseRespondWith(401, "Not Authorized")
         .respondWith(200, '"Hello World"');

      await fetch('http://mydomain.com', { method: 'GET', headers: new Headers({
         'X-AuthToken':'1234',
         'BANANA':'8757'
      })}).then((response) => {

         expect(response.status).toBe(200);
      });
   });


   it("rejects the promise when simulating a failed network connection", async () => {
      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('GET', 'http://mydomain.com')
         .respondWith(200, '"Hello World"');

      MockFetch.failNextCall();
      await fetch('http://mydomain.com').then((response) => {
         expect(false).toBe(true);
      }, (error) => {
         expect(true).toBe(true);
      });
   });


   it("rejects the promise ONLY for the next call when simulating a failed network connection", async () => {

      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('GET', 'http://mydomain.com')
         .respondWith(200, '"Hello World"');

      MockFetch.failNextCall();
      fetch('http://mydomain.com').then((response) => { }, (error) => { });

      // should then succeed again...
      await fetch('http://mydomain.com').then((response) => {
         expect(response.status).toBe(200);
      }, (error) => {
         expect(false).toBe(true);
      });
   });


   it("can match on the uploaded body", async () => {

      var MockFetch  = require('../mock-fetch-api.js');

      MockFetch.when('POST', 'http://mydomain.com')
         .respondWith(200, '"Hello World"');

      MockFetch.failNextCall();
      await fetch('http://mydomain.com', {
         method: 'POST',
         body: '{"ID":"5"}'
      }).then((response) => {
         expect(false).toBe(true);
      }, (error) => {
         expect(true).toBe(true);
      });
   });

});
