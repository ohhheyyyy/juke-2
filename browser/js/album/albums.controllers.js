'use strict';

juke.controller('AlbumsCtrl', function($scope, $http, $rootScope, $log, StatsFactory, GetAlbumsFactory){
  GetAlbumsFactory.fetchAll()
  .then(function(albums){
  	albums.forEach(function(album){
  		album.imageUrl = '/api/albums/' + album.id + '/image'
  	})
  	$scope.albums = albums;
  })
})