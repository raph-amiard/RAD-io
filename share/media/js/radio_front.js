var get_os;
var __hasProp = Object.prototype.hasOwnProperty;
get_os = function() {
  var _result, os, os_name, oses;
  oses = {
    linux: "Linux",
    windows: "Win",
    macos: "MacOs",
    unix: "X11"
  };
  _result = [];
  for (os in oses) {
    if (!__hasProp.call(oses, os)) continue;
    os_name = oses[os];
    if (navigator.appVersion.indexOf(os_name) !== -1) {
      return os;
    }
  }
  return _result;
};
if (get_os() === "windows") {
  $(function() {
    return $('body').css({
      'font-family': 'arial, serif'
    });
  });
}