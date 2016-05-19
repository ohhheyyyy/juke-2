var expect = chai.expect;

describe('`PlayerFactory` factory', function () {
  beforeEach(module('juke')); // loads our app

  var song1, song2;
  before(function () {
    song1 = { audioUrl: 'http://www.stephaniequinn.com/Music/Allegro%20from%20Duet%20in%20C%20Major.mp3' };
    song2 = { audioUrl: 'http://www.stephaniequinn.com/Music/Jazz%20Rag%20Ensemble%20-%2010.mp3' };
  });

  var audioMock, PlayerFactory;
  beforeEach(function () {
    // mock audio
    var createElement = document.createElement;
    document.createElement = function () {
      var elem = createElement.apply(document, arguments);
      if (arguments[0] === 'audio') {
        elem.volume = 0;
        audioMock = elem;
      }
      return elem;
    };
  });

  afterEach(function () {
    if (audioMock) audioMock.pause();
  });

  beforeEach(inject(function ($injector) {
    PlayerFactory = $injector.get('PlayerFactory');
  }));

  /*------------------
      TEST SPECS
  /------------------*/

  describe('#start', function () {

    it('plays given song', function () {
      chai.spy.on(HTMLAudioElement.prototype, 'load');
      chai.spy.on(HTMLAudioElement.prototype, 'play');
      PlayerFactory.start(song1);
      expect(HTMLAudioElement.prototype.load).to.have.been.called();
      expect(HTMLAudioElement.prototype.play).to.have.been.called();
    });

    it('stops previous song when playing new song', function () {
      chai.spy.on(PlayerFactory, 'pause');
      chai.spy.on(HTMLAudioElement.prototype, 'play');
      PlayerFactory.start(song1);
      PlayerFactory.start(song2);
      expect(PlayerFactory.pause).to.have.been.called();
      expect(HTMLAudioElement.prototype.play).to.have.been.called();
    });

  });

  describe('#pause', function () {

    it("calls audio's `pause`", function () {
      chai.spy.on(HTMLAudioElement.prototype, 'pause');
      PlayerFactory.pause();
      expect(HTMLAudioElement.prototype.pause).to.have.been.called();
    });

  });

  describe('#resume', function () {

    it("calls audio's `play`", function () {
      chai.spy.on(HTMLAudioElement.prototype, 'play');
      PlayerFactory.resume();
      expect(HTMLAudioElement.prototype.play).to.have.been.called();
    });

  });

  describe('#isPlaying', function () {

    it('returns false when song is not playing', function () {
      expect(PlayerFactory.isPlaying()).to.equal(false);
    });

    it('returns true when song is playing', function () {
      PlayerFactory.start(song1);
      expect(PlayerFactory.isPlaying()).to.equal(true);
    });

    it('toggles with pause/resume', function () {
      PlayerFactory.start(song1);
      expect(PlayerFactory.isPlaying()).to.equal(true);
      PlayerFactory.pause();
      expect(PlayerFactory.isPlaying()).to.equal(false);
      PlayerFactory.resume();
      expect(PlayerFactory.isPlaying()).to.equal(true);
    });

  });

  describe('#getCurrentSong', function () {

    it('defaults to null', function () {
      expect(PlayerFactory.getCurrentSong()).to.equal(null);
    });

    it('returns the song that is playing', function () {
      PlayerFactory.start(song1);
      expect(PlayerFactory.getCurrentSong()).to.equal(song1);
    });

    it('returns the current song even when paused', function () {
      PlayerFactory.start(song1);
      PlayerFactory.pause();
      expect(PlayerFactory.getCurrentSong()).to.equal(song1);
    });

  });

  describe('#next', function () {

    var songList;

    before(function () {
      songList = [song1, song2];
    });

    it('starts the next song in the list', function () {
      chai.spy.on(PlayerFactory, 'start');
      // start must now accept a second argument, the current song list
      PlayerFactory.start(song1, songList);
      PlayerFactory.next();
      expect(PlayerFactory.start).to.have.been.called.with(song2);
    });

    it('cycles when it reaches the end', function () {
      chai.spy.on(PlayerFactory, 'start');
      PlayerFactory.start(song2, songList);
      PlayerFactory.next();
      expect(PlayerFactory.start).to.have.been.called.with(song1);
    });

  });

  describe('#previous', function () {

    var songList;

    before(function () {
      songList = [song1, song2];
    });

    it('starts the previous song in the list', function () {
      chai.spy.on(PlayerFactory, 'start');
      // start must now accept a second argument, the current song list
      PlayerFactory.start(song2, songList);
      PlayerFactory.previous();
      expect(PlayerFactory.start).to.have.been.called.with(song1);
    });

    it('cycles when it reaches the beginning', function () {
      chai.spy.on(PlayerFactory, 'start');
      PlayerFactory.start(song1, songList);
      PlayerFactory.previous();
      expect(PlayerFactory.start).to.have.been.called.with(song2);
    });

  });


  describe('#getProgress', function () {

    it('is 0 before playing song', function () {
      expect(PlayerFactory.getProgress()).to.equal(0);
    });

    it('is a decimal between 0 and 1 corresponding to audio play progress', function (done) {
      this.timeout(5000);
      audioMock.addEventListener('playing', function () {
        console.log("Hey")
        setTimeout(function () {
          // the song is about 59 seconds long
          expect(PlayerFactory.getProgress()).to.be.closeTo(1.5/59, 0.01);
          done();
        }, 1500);
      });
      PlayerFactory.start(song1);
    });

    it('stays stable when paused', function (done) {
      this.timeout(1000);
      audioMock.addEventListener('playing', function () {
        setTimeout(PlayerFactory.pause, 100);
      });
      audioMock.addEventListener('pause', function () {
        var progressAtPause = PlayerFactory.getProgress();
        setTimeout(function () {
          expect(PlayerFactory.getProgress()).to.equal(progressAtPause);
          done();
        }, 50);
      });
      PlayerFactory.start(song1);
    });

  });

});
