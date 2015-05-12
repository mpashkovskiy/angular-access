'use strict';

angular

.module('angular-access', [])

.factory('Auth', function (User) {

  var authorize = function (loginRequired, requiredRoles, roleCheckType, callback) {
    var loggedIn = User.isUserLoggedIn();

    loginRequired = loginRequired || (requiredRoles !== undefined && requiredRoles.length > 0);
    roleCheckType = roleCheckType || 'atLeastOne';

    if (loginRequired === true && !loggedIn) {
      callback('loginRequired');
    } else if ((loginRequired === true && loggedIn) &&
              (requiredRoles === undefined || requiredRoles.length === 0)) {
      // Login is required but no specific roles are specified.
      callback('authorised');
    } else if (requiredRoles) {
      User.getCurrentUserRoles(function(roles){
        var loweredRoles = [];
        angular.forEach(roles, function (roles) {
          loweredRoles.push(roles.name.toLowerCase());
        });

        var role;
        var hasRole = false;
        for (var i = 0; i < requiredRoles.length; i += 1) {
          role = requiredRoles[i].toLowerCase();

          if (roleCheckType === 'combinationRequired') {
            hasRole = hasRole && loweredRoles.indexOf(role) > -1;
            // if all the roles are required and hasRole is false there is no point carrying on
            if (hasRole === false) {
              break;
            }
          } else if (roleCheckType === 'atLeastOne') {
            hasRole = loweredRoles.indexOf(role) > -1;
            // if we only need one of the roles and we have it there is no point carrying on
            if (hasRole) {
              break;
            }
          }
        }

        var result = hasRole ? 'authorised' : 'notAuthorised';
        callback(result);
      });
    } else {
      callback('authorised');
    }
  };

  return {
    authorize: authorize
  };

})

.directive('access', function (Auth, $route) {
  return {
    restrict: 'A',
    scope: {
      access: '='
    },
    link: function (scope, element, attrs) {
      if (scope.access !== undefined && scope.access.requiredRoles !== undefined && scope.access.requiredRoles.length > 0) {
        element.addClass('hidden');
        Auth.authorize(true, scope.access.requiredRoles, scope.access.roleCheckType, function(result) {
          if (result === 'authorised') {
            element.removeClass('hidden');
          } else {
            element.addClass('hidden');
          }
        });
      } else {
        element.removeClass('hidden');
      }
    }
  };
})

;
