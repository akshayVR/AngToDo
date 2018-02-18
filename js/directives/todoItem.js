/*global angular */

/**
 * Directive that executes an expression when the element it is applied to gets
 * an `escape` keydown event.
 */
angular.module('todomvc')
	.directive('todo', function () { // Added directive to enable formatting of dates and other logic
		'use strict';

    return function ($scope, elem, attrs) {
      var template;

      if ($scope.todo.completed === true) {
        template = '<span class="todo-title">' + $scope.todo.title + '</span><span class="todo-metadata"> Added on ' + new Date($scope.todo.date) + '</span><span class="todo-metadata">Completed on ' + new Date($scope.todo.completedOn) + '</span>';
      } else{
        template = '<span class="todo-title">' + $scope.todo.title + '</span><span class="todo-metadata"> Added on ' + new Date($scope.todo.date) + '</span>';
      }

      elem[0].innerHTML = template;
		};
	});
