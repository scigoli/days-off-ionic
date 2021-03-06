// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('daysOffIonicApp', ['ionic', 'daysOffIonicApp.controllers','daysOffIonicApp.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/sidebar.html',
    controller: 'AppCtrl'
  })

  .state('app.home', {
    url: '/home',
    views: {
      'mainContent': {
        templateUrl: 'templates/home.html'
      }
    }
  })

  .state('app.requests', {
      url: '/requests',
      views: {
        'mainContent': {
          templateUrl: 'templates/requests.html',
          controller: 'RequestsController',

          resolve: {
              requests:  ['requestFactory', function(requestFactory){
                return requestFactory.getRequests().query();
              }]

          }
        }
      }
    })
    .state('app.employees', {
      url: '/employees',
      views: {
        'mainContent': {
          templateUrl: 'templates/employees.html',
          controller: 'EmployeesController',

          resolve: {
              requests:  ['employeeFactory', function(employeeFactory){
                return employeeFactory.getEmployees().query();
              }]

          }
        }
      }
    })

;
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
