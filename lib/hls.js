/**
 * HLS interface
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

var _errors = require('./errors');

var _playlistLoader = require('./loader/playlist-loader');

var _playlistLoader2 = _interopRequireDefault(_playlistLoader);

var _fragmentLoader = require('./loader/fragment-loader');

var _fragmentLoader2 = _interopRequireDefault(_fragmentLoader);

var _abrController = require('./controller/abr-controller');

var _abrController2 = _interopRequireDefault(_abrController);

var _bufferController = require('./controller/buffer-controller');

var _bufferController2 = _interopRequireDefault(_bufferController);

var _capLevelController = require('./controller/cap-level-controller');

var _capLevelController2 = _interopRequireDefault(_capLevelController);

var _streamController = require('./controller/stream-controller');

var _streamController2 = _interopRequireDefault(_streamController);

var _levelController = require('./controller/level-controller');

var _levelController2 = _interopRequireDefault(_levelController);

var _timelineController = require('./controller/timeline-controller');

var _timelineController2 = _interopRequireDefault(_timelineController);

var _fpsController = require('./controller/fps-controller');

var _fpsController2 = _interopRequireDefault(_fpsController);

var _logger = require('./utils/logger');

var _xhrLoader = require('./utils/xhr-loader');

var _xhrLoader2 = _interopRequireDefault(_xhrLoader);

var _events3 = require('events');

var _events4 = _interopRequireDefault(_events3);

var _keyLoader = require('./loader/key-loader');

var _keyLoader2 = _interopRequireDefault(_keyLoader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Hls = function () {
  _createClass(Hls, null, [{
    key: 'isSupported',
    value: function isSupported() {
      return window.MediaSource && window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
    }
  }, {
    key: 'version',
    get: function get() {
      // replaced with browserify-versionify transform
      return '__VERSION__';
    }
  }, {
    key: 'Events',
    get: function get() {
      return _events2.default;
    }
  }, {
    key: 'ErrorTypes',
    get: function get() {
      return _errors.ErrorTypes;
    }
  }, {
    key: 'ErrorDetails',
    get: function get() {
      return _errors.ErrorDetails;
    }
  }, {
    key: 'DefaultConfig',
    get: function get() {
      if (!Hls.defaultConfig) {
        Hls.defaultConfig = {
          autoStartLoad: true,
          debug: false,
          capLevelOnFPSDrop: false,
          capLevelToPlayerSize: false,
          maxBufferLength: 30,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          maxSeekHole: 2,
          bufferRangeFromVideo: true,
          seekHoleNudgeDuration: 0.01,
          stalledInBufferedNudgeThreshold: 10,
          maxFragLookUpTolerance: 0.2,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: Infinity,
          liveSyncDuration: undefined,
          liveMaxLatencyDuration: undefined,
          maxMaxBufferLength: 600,
          enableWorker: true,
          enableSoftwareAES: true,
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 1,
          manifestLoadingRetryDelay: 1000,
          levelLoadingTimeOut: 10000,
          levelLoadingMaxRetry: 4,
          levelLoadingRetryDelay: 1000,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 1000,
          fragLoadingLoopThreshold: 3,
          startFragPrefetch: false,
          fpsDroppedMonitoringPeriod: 5000,
          fpsDroppedMonitoringThreshold: 0.2,
          appendErrorMaxRetry: 3,
          loader: _xhrLoader2.default,
          fLoader: undefined,
          pLoader: undefined,
          abrController: _abrController2.default,
          bufferController: _bufferController2.default,
          capLevelController: _capLevelController2.default,
          fpsController: _fpsController2.default,
          streamController: _streamController2.default,
          timelineController: _timelineController2.default,
          enableCEA708Captions: true,
          enableMP2TPassThrough: false
        };
      }
      return Hls.defaultConfig;
    },
    set: function set(defaultConfig) {
      Hls.defaultConfig = defaultConfig;
    }
  }]);

  function Hls() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Hls);

    var defaultConfig = Hls.DefaultConfig;

    if ((config.liveSyncDurationCount || config.liveMaxLatencyDurationCount) && (config.liveSyncDuration || config.liveMaxLatencyDuration)) {
      throw new Error('Illegal hls.js config: don\'t mix up liveSyncDurationCount/liveMaxLatencyDurationCount and liveSyncDuration/liveMaxLatencyDuration');
    }

    for (var prop in defaultConfig) {
      if (prop in config) {
        continue;
      }
      config[prop] = defaultConfig[prop];
    }

    if (config.liveMaxLatencyDurationCount !== undefined && config.liveMaxLatencyDurationCount <= config.liveSyncDurationCount) {
      throw new Error('Illegal hls.js config: "liveMaxLatencyDurationCount" must be gt "liveSyncDurationCount"');
    }

    if (config.liveMaxLatencyDuration !== undefined && (config.liveMaxLatencyDuration <= config.liveSyncDuration || config.liveSyncDuration === undefined)) {
      throw new Error('Illegal hls.js config: "liveMaxLatencyDuration" must be gt "liveSyncDuration"');
    }
    console.log(config);

    (0, _logger.enableLogs)(config.debug);
    this.config = config;
    // observer setup
    var observer = this.observer = new _events4.default();
    observer.trigger = function trigger(event) {
      for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        data[_key - 1] = arguments[_key];
      }

      observer.emit.apply(observer, [event, event].concat(data));
    };

    observer.off = function off(event) {
      for (var _len2 = arguments.length, data = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        data[_key2 - 1] = arguments[_key2];
      }

      observer.removeListener.apply(observer, [event].concat(data));
    };
    this.on = observer.on.bind(observer);
    this.off = observer.off.bind(observer);
    this.trigger = observer.trigger.bind(observer);
    this.playlistLoader = new _playlistLoader2.default(this);
    this.fragmentLoader = new _fragmentLoader2.default(this);
    this.levelController = new _levelController2.default(this);
    this.abrController = new config.abrController(this);
    this.bufferController = new config.bufferController(this);
    this.capLevelController = new config.capLevelController(this);
    this.fpsController = new config.fpsController(this);
    this.streamController = new config.streamController(this);
    this.timelineController = new config.timelineController(this);
    this.keyLoader = new _keyLoader2.default(this);
  }

  _createClass(Hls, [{
    key: 'destroy',
    value: function destroy() {
      _logger.logger.log('destroy');
      this.trigger(_events2.default.DESTROYING);
      this.detachMedia();
      this.playlistLoader.destroy();
      this.fragmentLoader.destroy();
      this.levelController.destroy();
      this.abrController.destroy();
      this.bufferController.destroy();
      this.capLevelController.destroy();
      this.fpsController.destroy();
      this.streamController.destroy();
      this.timelineController.destroy();
      this.keyLoader.destroy();
      this.url = null;
      this.observer.removeAllListeners();
    }
  }, {
    key: 'attachMedia',
    value: function attachMedia(media) {
      _logger.logger.log('attachMedia');
      this.media = media;
      this.trigger(_events2.default.MEDIA_ATTACHING, { media: media });
    }
  }, {
    key: 'detachMedia',
    value: function detachMedia() {
      _logger.logger.log('detachMedia');
      this.trigger(_events2.default.MEDIA_DETACHING);
      this.media = null;
    }
  }, {
    key: 'loadSource',
    value: function loadSource(url) {
      _logger.logger.log('loadSource:' + url);
      this.url = url;
      // when attaching to a source URL, trigger a playlist load
      this.trigger(_events2.default.MANIFEST_LOADING, { url: url });
    }
  }, {
    key: 'startLoad',
    value: function startLoad() {
      var startPosition = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

      _logger.logger.log('startLoad');
      this.levelController.startLoad();
      this.streamController.startLoad(startPosition);
    }
  }, {
    key: 'stopLoad',
    value: function stopLoad() {
      _logger.logger.log('stopLoad');
      this.levelController.stopLoad();
      this.streamController.stopLoad();
    }
  }, {
    key: 'swapAudioCodec',
    value: function swapAudioCodec() {
      _logger.logger.log('swapAudioCodec');
      this.streamController.swapAudioCodec();
    }
  }, {
    key: 'recoverMediaError',
    value: function recoverMediaError() {
      _logger.logger.log('recoverMediaError');
      var media = this.media;
      this.detachMedia();
      this.attachMedia(media);
    }

    /** Return all quality levels **/

  }, {
    key: 'levels',
    get: function get() {
      return this.levelController.levels;
    }

    /** Return current playback quality level **/

  }, {
    key: 'currentLevel',
    get: function get() {
      return this.streamController.currentLevel;
    }

    /* set quality level immediately (-1 for automatic level selection) */
    ,
    set: function set(newLevel) {
      _logger.logger.log('set currentLevel:' + newLevel);
      this.loadLevel = newLevel;
      this.streamController.immediateLevelSwitch();
    }

    /** Return next playback quality level (quality level of next fragment) **/

  }, {
    key: 'nextLevel',
    get: function get() {
      return this.streamController.nextLevel;
    }

    /* set quality level for next fragment (-1 for automatic level selection) */
    ,
    set: function set(newLevel) {
      _logger.logger.log('set nextLevel:' + newLevel);
      this.levelController.manualLevel = newLevel;
      this.streamController.nextLevelSwitch();
    }

    /** Return the quality level of current/last loaded fragment **/

  }, {
    key: 'loadLevel',
    get: function get() {
      return this.levelController.level;
    }

    /* set quality level for current/next loaded fragment (-1 for automatic level selection) */
    ,
    set: function set(newLevel) {
      _logger.logger.log('set loadLevel:' + newLevel);
      this.levelController.manualLevel = newLevel;
    }

    /** Return the quality level of next loaded fragment **/

  }, {
    key: 'nextLoadLevel',
    get: function get() {
      return this.levelController.nextLoadLevel;
    }

    /** set quality level of next loaded fragment **/
    ,
    set: function set(level) {
      this.levelController.nextLoadLevel = level;
    }

    /** Return first level (index of first level referenced in manifest)
    **/

  }, {
    key: 'firstLevel',
    get: function get() {
      return this.levelController.firstLevel;
    }

    /** set first level (index of first level referenced in manifest)
    **/
    ,
    set: function set(newLevel) {
      _logger.logger.log('set firstLevel:' + newLevel);
      this.levelController.firstLevel = newLevel;
    }

    /** Return start level (level of first fragment that will be played back)
        if not overrided by user, first level appearing in manifest will be used as start level
        if -1 : automatic start level selection, playback will start from level matching download bandwidth (determined from download of first segment)
    **/

  }, {
    key: 'startLevel',
    get: function get() {
      return this.levelController.startLevel;
    }

    /** set  start level (level of first fragment that will be played back)
        if not overrided by user, first level appearing in manifest will be used as start level
        if -1 : automatic start level selection, playback will start from level matching download bandwidth (determined from download of first segment)
    **/
    ,
    set: function set(newLevel) {
      _logger.logger.log('set startLevel:' + newLevel);
      this.levelController.startLevel = newLevel;
    }

    /** Return the capping/max level value that could be used by automatic level selection algorithm **/

  }, {
    key: 'autoLevelCapping',
    get: function get() {
      return this.abrController.autoLevelCapping;
    }

    /** set the capping/max level value that could be used by automatic level selection algorithm **/
    ,
    set: function set(newLevel) {
      _logger.logger.log('set autoLevelCapping:' + newLevel);
      this.abrController.autoLevelCapping = newLevel;
    }

    /* check if we are in automatic level selection mode */

  }, {
    key: 'autoLevelEnabled',
    get: function get() {
      return this.levelController.manualLevel === -1;
    }

    /* return manual level */

  }, {
    key: 'manualLevel',
    get: function get() {
      return this.levelController.manualLevel;
    }
  }]);

  return Hls;
}();

exports.default = Hls;