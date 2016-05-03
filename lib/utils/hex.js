'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Hex = function () {
  function Hex() {
    _classCallCheck(this, Hex);
  }

  _createClass(Hex, null, [{
    key: 'hexDump',
    value: function hexDump(array) {
      var i,
          str = '';
      for (i = 0; i < array.length; i++) {
        var h = array[i].toString(16);
        if (h.length < 2) {
          h = '0' + h;
        }
        str += h;
      }
      return str;
    }
  }]);

  return Hex;
}();

exports.default = Hex;