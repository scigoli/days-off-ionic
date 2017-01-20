angular.module('daysOffIonicApp.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $localStorage, AuthFactory) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = $localStorage.getObject('userinfo','{}');

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);
    $localStorage.storeObject('userinfo',$scope.loginData);
    AuthFactory.login($scope.loginData);
    $scope.closeLogin();

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    // $timeout(function() {
    //   $scope.closeLogin();
    // }, 1000);
  };
})

// This controller is used to handle the commands on the top bar.
.controller('HeaderController', ['$scope', '$state', '$rootScope', 'AuthFactory', 'ngDialog', 'employeeFactory', function ($scope, $state, $rootScope, AuthFactory, ngDialog,employeeFactory) {

      $scope.loggedIn = false;
      $scope.username = '';

      if(AuthFactory.isAuthenticated()) {
          $scope.loggedIn = true;
          $scope.username = AuthFactory.getUsername();
      }

      $scope.openLogin = function () {
          ngDialog.open({ template: 'views/login.html', scope: $scope, className: 'ngdialog-theme-default', controller:'LoginController' });
      };

      $scope.logOut = function() {
         AuthFactory.logout();
          $scope.loggedIn = false;
          $scope.username = '';
      };

      // Intercept the event fired after a successful login
      $rootScope.$on('login:Successful', function () {
          $scope.loggedIn = AuthFactory.isAuthenticated();
          $scope.username = AuthFactory.getUsername();
          $scope.userId = AuthFactory.getUserId();
          employeeFactory.getEmployee($scope.userId).then(
            function (response) {console.log('user details OK= '+ JSON.stringify(response.data));},
            function (response) {console.log('user details KO= '+ JSON.stringify(response.data));}
          );
      });

      // Intercept the event fired after a successful registration of a new user
      $rootScope.$on('registration:Successful', function () {
          $scope.loggedIn = AuthFactory.isAuthenticated();
          $scope.username = AuthFactory.getUsername();
      });

      $scope.stateis = function(curstate) {
         return $state.is(curstate);
      };

  }])

// This controller is used by the 'requests' page to display requests according to the user level and also to perform actions (approve, deny, delete) on each request
.controller('RequestsController',['$scope','requestFactory','$rootScope','employeeFactory', 'AuthFactory', '$ionicModal', '$timeout', '$ionicPopover',function ($scope,requestFactory,$rootScope,employeeFactory,AuthFactory,$ionicModal, $timeout, $ionicPopover) {

    var userId = AuthFactory.getUserId();
    $scope.filtText = '';
    $scope.filtProcessed = true;
    $scope.IsManager = false;
    $scope.employees = [];
    $scope.requestData = {};
    $scope.selected = '';

    $scope.ShowItem = function(sts){
      if($scope.filtProcessed===true){
        if(sts!=0)
          return false;
      }
      return true;
    }

    $scope.ToggleProcessed = function(){
      if($scope.filtProcessed===true){
        $scope.filtProcessed = false;
        console.log('Filter is now set to: '+ $scope.filtProcessed);
      }
      else{
        $scope.filtProcessed=true;
        console.log('Filter is now set to: '+ $scope.filtProcessed);
      }
    };

    $scope.user = employeeFactory.getEmployee(userId).then(
      function (response) {
        console.log('user details OK= '+ JSON.stringify(response.data));
        $scope.IsManager = response.data.IsManager;
        if($scope.IsManager == false){
          $scope.filtText=userId;
          console.log('filtText is not empty: '+ userId);
        }
      },
      function (response) {console.log('user details KO= '+ JSON.stringify(response.data));}
    );

    // Read the full list of employees. It is used to get a local copy of employees' details instead of retrieving data from the server every time you need it (caching to improve performances)
    $scope.employees = employeeFactory.getEmployees().query(
        function (response) {
            $scope.employees = response;
            console.log('Loaded '+ $scope.employees.length + ' employees');

        },
        function (response) {
            console.log('Failed when loading employees');
        }
      );

    // given the employee's ID, return the username to be displayed in the "Requested by" and "Approved by" fields
    $scope.getEmployeeName = function (empId) {
      var retval = empId;
      for(var i = 0; i < $scope.employees.length; i++)
      {
        if($scope.employees[i].id == empId)
        {
          retval=$scope.employees[i].username;
          console.log('Found username: ' + retval);
          return retval;
        }
      }
      return retval;
    };

    // Read the full list of requests. Any filtering is done on the client side using AngularJS filters
    $scope.requests = requestFactory.getRequests().query(
        function (response) {
            $scope.requests = response;
            console.log('Response OK= '+ JSON.stringify(response));
            $scope.showMenu = true;

        },
        function (response) {
            console.log('Response KO= '+JSON.stringify(response));
            $scope.message = 'Error: ' + response.status + ' ' + response.statusText;
        }
      );

    // this function is required in order to ensure data reload after an action that affects displayed data
    $scope.reload = function () {
      requestFactory.getRequests().query(
          function (response) {
              // console.log('Reload OK= '+ JSON.stringify(response));
              $scope.requests = response;
              console.log('Reload OK = '+ JSON.stringify($scope.requests));

          },
          function (response) {
              console.log('Reload KO= '+JSON.stringify(response));
              // return response;
          }
        );
    };

    //
    // // open a pop-up form when user wants to add a new request
    // $scope.openNewRequest = function () {
    //         ngDialog.open({ template: 'views/newrequest.html', scope: $scope, className: 'ngdialog-theme-default', controller:'NewRequestController' });
    //     };
    //

    // according to the passed parameters, approve or deny a request by setting the "Status" field
    $scope.approveDenyRequest = function(requestId, newStatus) {
            $scope.request = {};
            $scope.closePopover();
            console.log('Approving request ' + requestId);

            $scope.request = requestFactory.getRequest(requestId).then(
            function(response){
              // success callback
              $scope.request =response.data;
              console.log('GET SUCCESS: here is the response ' +  JSON.stringify(response));
              $scope.request.Status = newStatus;
              console.log('Now setting status of ' + $scope.request.id + ' as ' + $scope.request.Status);
              var res = requestFactory.setRequest($scope.request.id,$scope.request).then(
                function(response){
                  $scope.requests = $scope.reload();
                },
                function(response){
                  console.log('PUT FAILURE: here is the response ' +  JSON.stringify(response));
                }
              );
            },
            function(response){
                // failure callback
                console.log('GET FAILURE: here is the response ' +  JSON.stringify(response));
            }
          );
        };

      // permanently remove a request
      $scope.removeRequest = function(requestId) {
            $scope.request = {};
            $scope.closePopover();
            console.log('Removing request ' + requestId);

            $scope.request = requestFactory.getRequest(requestId).then(
              function(response){
                // success callback
                $scope.request =response.data;
                console.log('GET SUCCESS: here is the response ' +  JSON.stringify(response));
                requestFactory.deleteRequest($scope.request.id,$scope.request).then(
                  function(response){
                    $scope.requests = $scope.reload();
                  },
                  function(response){
                    console.log('DELETE FAILURE: here is the response ' +  JSON.stringify(response));
                  }
                );
              },
              function(response){
                // failure callback
                console.log('GET FAILURE: here is the response ' +  JSON.stringify(response));
              }
            );

        };

      // detect an event fired when a new request has been successfully added
      $rootScope.$on('newRequest:Successful', function () {
            console.log('Got an event!');
            $scope.requests = $scope.reload();
      });

      // Convert status ID into a user friendly text to be displayed
      $scope.getStatusMessage = function(status){
          if (status === 0) {
              return "New";
          }
          else if (status === 1) {
              return "Approved";
          }
          else if (status === 2) {
              return "Denied";
          }
          else {
              return "Unknown";
          }

      };

      // return true if logged in user is a supervisor. This check is useful because only supervisors can access to some information and actions
      $scope.isSupervisor = function() {
          console.log('Supervisor = ' +$scope.IsManager);
          return $scope.IsManager;
      };

      // given the employee's ID, return the username to be displayed in the "Requested by" and "Approved by" fields
      $scope.getUsername = function(employeeId) {
            $scope.request = {};
            console.log('Looking for ' + employeeId);

            $scope.request = employeeFactory.getEmployee(employeeId).then(
              function(response){
                // success callback
                console.log('User found ' +  response.data.username);
                return response.data.username;
              },
              function(response){
                // failure callback
                console.log('USER GET FAILURE: here is the response ' +  JSON.stringify(response));
              }
            );

        };


        // // Create the reserve modal that we will use later
        $ionicModal.fromTemplateUrl('templates/newRequest.html', {
          scope: $scope
        }).then(function(modal) {
          $scope.requestform = modal;
        });
        //
        // // Triggered in the reserve modal to close it
        $scope.closeRequest = function() {
          $scope.requestform.hide();
        };

        // Open the reserve modal
        $scope.showRequestForm = function() {
          $scope.requestform.show();
        };
        //
        // // Perform the reserve action when the user submits the reserve form
        $scope.doRequest = function() {
          console.log('Doing request');
          requestFactory.newRequest($scope.requestData);
          $scope.closeRequest();
          // Simulate a reservation delay. Remove this and replace with your reservation
          // code if using a server system
          // $timeout(function() {
          //   $scope.closeRequest();
          // }, 1000);
        };


        // Popover handling - start
        $ionicPopover.fromTemplateUrl('templates/request-detail-popover.html', {
              scope: $scope
           }).then(function(popover) {
              $scope.popover = popover;
           });

           $scope.openPopover = function($event,requestId) {
            $scope.selected=requestId;
            $scope.popover.show($event);
           };

           $scope.closePopover = function() {
              $scope.popover.hide();
           };

           //Cleanup the popover when we're done with it!
           $scope.$on('$destroy', function() {
              $scope.popover.remove();
           });

           // Execute action on hide popover
           $scope.$on('popover.hidden', function() {
              // Execute action
           });

           // Execute action on remove popover
           $scope.$on('popover.removed', function() {
              // Execute action
           });

        // Popover handling - end


  }])

// This controller is used by the 'new request' form
.controller('NewRequestController', ['$scope','requestFactory', 'ngDialog', function ($scope,requestFactory,ngDialog) {
    $scope.doRequest = function() {
        requestFactory.newRequest($scope.requestData);
        ngDialog.close();
    };

  }])

// This controller is used by the 'details' page
.controller('RequestDetailController', ['$scope','requestFactory', '$stateParams', function ($scope,requestFactory,$stateParams) {

    console.log('Resource ID = '+ $stateParams.id + ' ' +parseInt($stateParams.id,10));
    $scope.request = {};
    $scope.request.id = $stateParams.id;
    var Requests = requestFactory.getRequests();
    var reqs = Requests.query(
      function() {
        for(var i = 0; i < reqs.length; i++)
        {
          if(reqs[i].id == $stateParams.id)
          {
            $scope.request=reqs[i];
          }
        }
      },
      function() {
        console.log("error found in getRequests");
      }

);


}])

// This controller is used by the 'employees' page. It allows displaying of active users
.controller('EmployeesController', ['employeeFactory', '$scope', function (employeeFactory,$scope) {

    // return the full list of employees, together with all the details
    $scope.employees = employeeFactory.getEmployees().query(
        function (response) {
            $scope.employees = response;
            console.log('Loaded '+ $scope.employees.length + ' employees');
        },
        function (response) {
            console.log('Failed when loading employees');
        }
      );

      // since image upload is not available yet, I'm forcing a couple of default icons
      $scope.getImage = function(isManager) {
        if(isManager){
          return "img/boss.png";
        }
        else{
          return "img/geek.jpg";
        }
      }

      // return an user friendly text to be displayed
      $scope.getLabel = function(isManager) {
        if(isManager){
          return "Manager";
        }
        else{
          return "";
        }
      }
  }])

// This controller is used by the form used to add new users (sign up)
.controller('RegisterController', ['$scope', 'ngDialog', '$localStorage', 'AuthFactory', function ($scope, ngDialog, $localStorage, AuthFactory) {

      $scope.register={};
      $scope.loginData={};

      $scope.doRegister = function() {
          console.log('Doing registration', $scope.registration);

          AuthFactory.register($scope.registration);

          ngDialog.close();

      };
  }])

// This controller is used by the login form
.controller('LoginController', ['$scope', 'ngDialog', '$localStorage', 'AuthFactory', function ($scope, ngDialog, $localStorage, AuthFactory) {

      $scope.loginData = $localStorage.getObject('userinfo','{}');

      $scope.doLogin = function() {
          if($scope.rememberMe) {
            $localStorage.storeObject('userinfo',$scope.loginData);
          }

          AuthFactory.login($scope.loginData);

          ngDialog.close();

      };

      $scope.openRegister = function () {
          ngDialog.open({ template: 'views/register.html', scope: $scope, className: 'ngdialog-theme-default', controller:'RegisterController' });
      };

}])
;
