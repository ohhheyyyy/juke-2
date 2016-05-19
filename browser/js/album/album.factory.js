'use strict';

juke.factory('StatsFactory', function ($q) {
  var statsObj = {};
  statsObj.totalTime = function (album) {
    var audio = document.createElement('audio');
    return $q(function (resolve, reject) {
      var sum = 0;
      var n = 0;
      function resolveOrRecur () {
        if (n >= album.songs.length) resolve(sum);
        else audio.src = album.songs[n++].audioUrl;
      }
      audio.addEventListener('loadedmetadata', function () {
        sum += audio.duration;
        resolveOrRecur();
      });
      resolveOrRecur();
    });
  };

  // statsObj.numSongs = function(album){
  // 	console.log("statsObj", album)
  	
  // }
  return statsObj;
});

juke.factory('GetAlbumsFactory', function($http, $q, $log){
	return {
		fetchAll: function fetchAll(){
		return $http.get('/api/albums/')
		  .then(function (res) { return res.data; })
		  .catch($log.error); // $log service can be turned on and off; also, pre-bound
		},

		fetchById: function fetchById(id){
			return $http.get('/api/albums/' + id)// temp: get one
			.then(function(res){ return res.data; })
			.catch($log.error);
		}
	}

})