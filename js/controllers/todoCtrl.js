/*global angular */

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
angular.module('todomvc')
	.controller('TodoCtrl', ['$scope', '$routeParams', '$filter', 'store', 'appLocalSettings', 'uuid', function TodoCtrl($scope, $routeParams, $filter, store, appLocalSettings, uuid) {
		'use strict';

		var todos = $scope.todos = store.todos;

		$scope.newTodo = '';
		$scope.editedTodo = null;
		$scope.recentTodo = null;
		$scope.completedTasks = {};

		$scope.$watch('todos', function () {
			var completedTasks = $filter('filter')(todos, { completed: true }); // Filtering the tasks to identify the completed tasks

			// Sorting them to identify the order in which they were completed
			completedTasks = completedTasks.sort(function (a, b) {
				return b.completedOn - a.completedOn;
			});

			// Creating an object reference to ientify the ranking of the completed tasks based on their completion date
			// This is used in the view to highlight the latest completed tasks
			$scope.completedTasks = {};
			for (var i = 0, len = completedTasks.length; i < len; i++) {
				$scope.completedTasks[completedTasks[i].id] = i;
			}

			$scope.completedCount =  completedTasks.length;
			$scope.remainingCount = todos.length - $scope.completedCount;
			$scope.allChecked = !$scope.remainingCount;
		}, true);

		// Monitor the current route for changes and adjust the filter accordingly.
		$scope.$on('$routeChangeSuccess', function () {
			var status = $scope.status = $routeParams.status || '';
			$scope.statusFilter = (status === 'active') ?
				{ completed: false } : (status === 'completed') ?
				{ completed: true } : {};
		});

		$scope.addTodo = function () {
			var newTodo = {
				title: $scope.newTodo.trim(),
				completed: false,
				date: Date.now() // Adding date to identify when an item was created
			};

			if (!newTodo.title) {
				return;
			}

			$scope.saving = true;
			store.insert(newTodo)
				.then(function success(todos) {
					$scope.newTodo = '';
					$scope.recentTodo = todos[todos.length - 1].id; // Used to identify the recently added item. USed for the animation
				})
				.finally(function () {
					$scope.saving = false;
					// Removes the recentTodo from the localstorage to prevent repeated highlights
					setTimeout(function () {
						$scope.recentTodo = null;
						appLocalSettings.updateSettings({new: null});
					}, 3000);
				});
		};

		$scope.editTodo = function (todo) {
			$scope.editedTodo = todo;
			// Clone the original todo to restore it on demand.
			$scope.originalTodo = angular.extend({}, todo);
		};

		$scope.saveEdits = function (todo, event) {
			// Blur events are automatically triggered after the form submit event.
			// This does some unfortunate logic handling to prevent saving twice.
			if (event === 'blur' && $scope.saveEvent === 'submit') {
				$scope.saveEvent = null;
				return;
			}

			$scope.saveEvent = event;

			if ($scope.reverted) {
				// Todo edits were reverted-- don't save.
				$scope.reverted = null;
				return;
			}

			todo.title = todo.title.trim();

			if (todo.title === $scope.originalTodo.title) {
				$scope.editedTodo = null;
				return;
			}

			store[todo.title ? 'put' : 'delete'](todo)
				.then(function success() {}, function error() {
					todo.title = $scope.originalTodo.title;
				})
				.finally(function () {
					$scope.editedTodo = null;
				});
		};

		$scope.revertEdits = function (todo) {
			todos[todos.indexOf(todo)] = $scope.originalTodo;
			$scope.editedTodo = null;
			$scope.originalTodo = null;
			$scope.reverted = true;
		};

		$scope.removeTodo = function (todo) {
			store.delete(todo);
		};

		$scope.saveTodo = function (todo) {
			store.put(todo);
		};

		$scope.toggleCompleted = function (todo, completed) {
			if (angular.isDefined(completed)) {
				todo.completed = completed;
			}

			// Adding completed date to track completion
			if (todo.completed === true) {
				todo.completedOn = Date.now();
			} else {
				todo.completedOn = null;
			}

			store.put(todo, todos.indexOf(todo))
				.then(function success() {}, function error() {
					todo.completed = !todo.completed;
				});
		};

		$scope.clearCompletedTodos = function () {
			store.clearCompleted();
		};

		$scope.markAll = function (completed) {
			todos.forEach(function (todo) {
				if (todo.completed !== completed) {
					$scope.toggleCompleted(todo, completed);
				}
			});
		};
	}]);
