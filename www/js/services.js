'use strict';

// .constant('baseURL', 'http://localhost:3000/api/')
// .constant('baseURL', 'http://192.168.178.40:3000/api/')
// .constant('baseURL', 'https://days-off-cloudant.mybluemix.net/api/')
angular.module('daysOffIonicApp.services', ['ngResource'])
 .constant('baseURL', 'http://192.168.178.40:3000/api/')

.factory('$localStorage', ['$window', function ($window) {
    return {
        store: function (key, value) {
            $window.localStorage[key] = value;
        },
        get: function (key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        remove: function (key) {
            $window.localStorage.removeItem(key);
        },
        storeObject: function (key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function (key, defaultValue) {
            return JSON.parse($window.localStorage[key] || defaultValue);
        }
    };
}])

// this factory is used to manage authentication related data
.factory('AuthFactory', ['$resource', '$http', '$localStorage', '$rootScope', '$window', 'baseURL', function($resource, $http, $localStorage, $rootScope, $window, baseURL){

    var authFac = {};
    var TOKEN_KEY = 'Token';
    var isAuthenticated = false;
    var username = '';
    var userId = '';
    var authToken = undefined;


  function loadUserCredentials() {
    var credentials = $localStorage.getObject(TOKEN_KEY,'{}');
    if (credentials.username !== undefined) {
      useCredentials(credentials);
    }
  }

  function storeUserCredentials(credentials) {
    $localStorage.storeObject(TOKEN_KEY, credentials);
    useCredentials(credentials);
  }

  function useCredentials(credentials) {
    isAuthenticated = true;
    username = credentials.username;
    authToken = credentials.token;
    userId = credentials.userId

    // Set the token as header for your requests!
    $http.defaults.headers.common['x-access-token'] = authToken;
  }

  function destroyUserCredentials() {
    authToken = undefined;
    username = '';
    isAuthenticated = false;
    userId = '';
    $http.defaults.headers.common['x-access-token'] = authToken;
    $localStorage.remove(TOKEN_KEY);
  }

    authFac.login = function(loginData) {
        console.log('1. logging in ' + loginData.username + ' using ' + baseURL + 'Employees/login');
        $resource(baseURL + 'Employees/login')
        .save(loginData,
           function(response) {
             console.log('here is the response ' +  JSON.stringify(response));
             console.log('2. logging in ' + loginData.username + ' with token ' + response.id);
              storeUserCredentials({username:loginData.username, token: response.id, userId : response.userId});
              $rootScope.$broadcast('login:Successful');
           },
           function(response){
              isAuthenticated = false;

              var message = '\
                <div class="ngdialog-message">\
                <div><h3>Login Unsuccessful</h3></div>' +
                  '<div><p>' +  response.data.err.message + '</p><p>' +
                    response.data.err.name + '</p></div>' +
                '<div class="ngdialog-buttons">\
                    <button type="button" class="ngdialog-button ngdialog-button-primary" ng-click=confirm("OK")>OK</button>\
                </div>'

                ngDialog.openConfirm({ template: message, plain: 'true'});
           }

        );

    };

    authFac.logout = function() {
        $resource(baseURL + 'Employees/logout').save(function(response){
        });
        destroyUserCredentials();
    };

    authFac.register = function(registerData) {
        console.log('I am ready to register ' +  JSON.stringify(registerData));
        $resource(baseURL + 'Employees', {},{headers: { 'Access-Control-Allow-Origin': '*' }})
        .save(registerData,
           function(response) {
              console.log('I am super ready');
              authFac.login({username:registerData.username, password:registerData.password});
            if (registerData.rememberMe) {
                $localStorage.storeObject('userinfo',
                    {username:registerData.username, password:registerData.password});
            }

              $rootScope.$broadcast('registration:Successful');
           },
           function(response){

              var message = '\
                <div class="ngdialog-message">\
                <div><h3>Registration Unsuccessful</h3></div>' +
                  '<div><p>' +  response.data.err.message +
                  '</p><p>' + response.data.err.name + '</p></div>';

                ngDialog.openConfirm({ template: message, plain: 'true'});

           }

        );
    };

    authFac.isAuthenticated = function() {
        return isAuthenticated;
    };

    authFac.getUsername = function() {
        return username;
    };

    authFac.getUserId = function() {
        return userId;
    };

    loadUserCredentials();

    return authFac;

}])

// this factory is used to manage employee related data
.factory('employeeFactory', ['$resource', '$http', '$localStorage', '$rootScope', '$window', 'baseURL', function($resource, $http, $localStorage, $rootScope, $window, baseURL){

    var empFac = {};

    empFac.getEmployee = function(employeeId){
      return $http.get(baseURL+"Employees/"+employeeId);
    };

    empFac.getEmployees = function(){
      return $resource(baseURL+'Employees/:id',{ id: '@id' },  {'update':{method:'PUT' }});
    };

    return empFac;

  }])

// this factory is used to manage request related data
.factory('requestFactory', ['$resource', '$http', '$localStorage', '$rootScope', '$window', 'baseURL', function($resource, $http, $localStorage, $rootScope, $window, baseURL){

    var reqFac = {};

    reqFac.newRequest = function(requestData){
      console.log('Submitting a new request with description ' + requestData.Description + ' using ' + baseURL + 'Requests');
      $resource(baseURL + 'Requests')
      .save(requestData,
         function(response) {
           $rootScope.$broadcast('newRequest:Successful');
           console.log('SUCCESS: here is the response ' +  JSON.stringify(response));
         },
         function(response){
           console.log('FAILURE: here is the response ' +  JSON.stringify(response));
         }
      );

    };

    reqFac.getRequests = function(){
      console.log('getRequests called');
      return $resource(baseURL+'Requests/:id',{ id: '@id' },  {'update':{method:'PUT' }});
    };

    reqFac.setRequest = function(requestId, data){
        return $http.put(baseURL+"Requests/"+requestId, data)
        .then(
          function(response){
            // success callback
            console.log('PUT SUCCESS: here is the response ' +  JSON.stringify(response));
          },
          function(response){
            // failure callback
            console.log('PUT FAILURE: here is the response ' +  JSON.stringify(response));
          }
        );
    };

    reqFac.getRequest = function(requestId){
        return $http.get(baseURL+"Requests/"+requestId);
    };

    reqFac.deleteRequest = function(requestId, data){
        return $http.delete(baseURL+"Requests/"+requestId, data)
        .then(
          function(response){
            // success callback
            console.log('DELETE SUCCESS: here is the response ' +  JSON.stringify(response));
          },
          function(response){
            // failure callback
            console.log('DELETE FAILURE: here is the response ' +  JSON.stringify(response));
          }
        );
    };

    return reqFac;

}])
;
