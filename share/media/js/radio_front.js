var get_os;
get_os = function() {
  var os, os_name, oses;
  oses = {
    linux: "Linux",
    windows: "Win",
    macos: "MacOs",
    unix: "X11"
  };
  for (os in oses) {
    os_name = oses[os];
    if (navigator.appVersion.indexOf(os_name) !== -1) {
      return os;
    }
  }
};
if (get_os() === "windows") {
  $(function() {
    return $('body').css({
      'font-family': 'arial, serif'
    });
  });
}