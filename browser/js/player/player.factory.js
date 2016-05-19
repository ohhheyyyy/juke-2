'use strict';

juke.factory('PlayerFactory', function(){
	var audio = document.createElement('audio');
	var playing = false;
	var currentSong;
	var songList;

	// function skip (interval) {
 //    if (!currentSong) return;
 //    var index = currentSong.albumIndex;
 //    index = mod( (index + (interval || 1)), album.songs.length );
 //    $scope.currentSong = $scope.album.songs[index];
 //    if ($scope.playing) $rootScope.$broadcast('play', $scope.currentSong);
 //  	};
	
	return{
	  start: function start(song, newSongList){
	  	
	  	if(playing === true){
	  		this.pause();
	  		audio.src = song.audioUrl;
	    	audio.load();
	    	audio.play();
	    	playing = true;
	    	currentSong = song;
	    	
	  	} else{
	  		audio.src = song.audioUrl;
	    	audio.load();
	    	audio.play();
	    	playing = true;
	    	currentSong = song;
	    	songList = newSongList;
	  	}
	  },

	  pause: function pause(){
	  	audio.pause()
	  	playing = false;
	  },

	  resume: function resume(){
	  	if(playing === false){
	  		audio.play();
	  		playing = true;
	  	}
	  },

	 isPlaying: function isPlaying(){
	  	if(playing === false){
	  		return false;
	  	}else{
	  		return true;
	  	}
	  },

	  getCurrentSong: function getCurrentSong(){
	  	if(currentSong !== undefined){
	  		return currentSong;
	  	}else{
	  		return null;
	  	}
	  },

	  next: function next(){
	  	var currentSongIndex = songList.indexOf(currentSong)
	  	if(currentSongIndex === songList.length-1){
	  		nextSongIndex = 0
	  	} else{
	  		var nextSongIndex = currentSongIndex + 1;
	  	}
	  	var nextSong = songList[nextSongIndex];
	  	this.start(nextSong);
	  },

	  previous: function previous(){
	  	var currentSongIndex = songList.indexOf(currentSong)
	  	if(currentSongIndex === 0){
	  		previousSongIndex = songList.length-1
	  	} else{
	  		var previousSongIndex = currentSongIndex - 1;
	  	}
	  	var previousSong = songList[previousSongIndex];
	  	this.start(previousSong);
	  },

	  getProgress: function getProgress(){
	  	var count = 0;
	  	if(playing === true){
	  		count = audio.currentTime / audio.duration;
	  	}
	  	return count;
	  }
	}

});
