// Intercept real XHR download progress BEFORE Unity's loader touches it
var realLoaded = 0;
var realTotal  = 0;

(function() {
  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function() {
    this._tracked = true;
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    if (this._tracked) {
      this.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
          realLoaded = e.loaded;
          realTotal  = e.total;
        }
      });
    }
    return origSend.apply(this, arguments);
  };
})();

function UnityProgress(gameInstance, progress) {
  if (!gameInstance.Module)
    return;

  // original logo
  if (!gameInstance.logo) {
    gameInstance.logo = document.createElement("div");
    gameInstance.logo.className = "logo " + gameInstance.Module.splashScreenStyle;
    gameInstance.container.appendChild(gameInstance.logo);
  }

  // original progress bar
  if (!gameInstance.progress) {
    gameInstance.progress = document.createElement("div");
    gameInstance.progress.className = "progress " + gameInstance.Module.splashScreenStyle;
    gameInstance.progress.empty = document.createElement("div");
    gameInstance.progress.empty.className = "empty";
    gameInstance.progress.appendChild(gameInstance.progress.empty);
    gameInstance.progress.full = document.createElement("div");
    gameInstance.progress.full.className = "full";
    gameInstance.progress.appendChild(gameInstance.progress.full);
    gameInstance.container.appendChild(gameInstance.progress);
  }

  gameInstance.progress.full.style.width  = (100 * progress) + "%";
  gameInstance.progress.empty.style.width = (100 * (1 - progress)) + "%";

  // real MB from intercepted XHR
  var label  = document.getElementById("slammpProgress");
  var credit = document.getElementById("slammpCredit");

  if (label) {
    if (progress < 1) {
      if (realTotal > 0) {
        var loadedMB = (realLoaded / 1048576).toFixed(2);
        var totalMB  = (realTotal  / 1048576).toFixed(2);
        label.innerText = loadedMB + "mb of " + totalMB + "mb loading";
      } else {
        // fallback while XHR hasn't reported size yet
        label.innerText = "connecting...";
      }
    } else {
      label.innerText = "done!!";
    }
  }

  if (progress == 1) {
    gameInstance.logo.style.display = gameInstance.progress.style.display = "none";
    if (label)  label.style.display  = "none";
    if (credit) credit.style.display = "none";
  }
}