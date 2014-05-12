/*global angular:false, $:false, d3:false */

'use strict';

dogewand = angular.module('dogewand',[],function (){

})
.controller('iframe', function ($scope) {
	$scope.modal = {show : false };
})
.controller('menu', function ($scope) {
  $scope.toggleModal = function () {
  	$scope.modal.show = !$scope.modal.show;
  }
  $scope.close = function () {
    $scope.$emit('closebutton');
  }
});
