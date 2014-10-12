/**
 * Chrome plugin to cycle through tabs.
 * 
 * @author Benjamin Oakes <hello@benjaminoakes.com>, @benjaminoakes
 * @seealso http://code.google.com/chrome/extensions/background_pages.html
 */
var carousel = (function () {
  /** Module @namespace */
  var ns = {};

  /** @constant */
  ns.defaults = {
    /** Interval between tabs, in ms. */
    flipWait_ms: 15 * 1000,
    /** Interval between reloading a tab, in ms.  Let's not kill other people's servers with automated requests. */
    reloadWait_ms: 5 * 60 * 1000
  };

  /** English-language tutorial text for first run. */
  ns.tutorialText = [
    'First-Use Tutorial',
    '',
    'TabCarousel is simple:  open tabs you want to monitor throughout the day, then click the toolbar icon.  To stop, click the icon again.',
    '',
    'By default, TabCarousel will flip through your tabs every ' + String(ns.defaults.flipWait_ms / 1000) + ' s, reloading them every ' + String(ns.defaults.reloadWait_ms / 1000 / 60) + " min.  It's great on a unused display or TV.  Put Chrome in full-screen mode (F11, or cmd-shift-f on the Mac) and let it go.",
    '',
    'If you want to change how often TabCarousel flips through your tabs, right click on the toolbar icon and choose "Options".'
  ].join('\n');

  /**
   * Keep track of the last time a tab was refreshed so we can wait at least 5 minutes betweent refreshes.
   */
  ns.lastReloads_ms = {};

  /** Track the current url that we are on. Don't query to get it b/c that would introduce a callback. */
  ns.currentTabUrl = "";
	ns.currentTabId = 0;

  /** Is it on a Jira page? */
  ns.isActiveJiraCardWallPage = function() {
  	// ex: https://jira.corp.squareup.com/secure/RapidBoard.jspa?rapidView=279&view=detail&selectedIssue=PAY-2553
    var result = ns.currentTabUrl.indexOf('jira.') >= 0
			&& ns.currentTabUrl.indexOf('RapidBoard') > 0
			&& ns.currentTabUrl.indexOf('view=report') < 0
			&& ns.currentTabUrl.indexOf('view=plan') < 0;
		console.log("    isActiveJiraCardWallPage: " + result);
		return result;
  };

  /**
   * Reload the given tab, if it has been more than ns.reloadWait_ms ago since it's last been reloaded.
   * @function
   */
  ns.reload = function (tabId) {
    var now_ms = Date.now(),
      lastReload_ms = ns.lastReloads_ms[tabId];
    
    if (!lastReload_ms || (now_ms - lastReload_ms >= ns.reloadWait_ms())) {
      // If a tab fails reloading, the host shows up as chrome://chromewebdata/
      // Protocol chrome:// URLs can't be reloaded through script injection, but you can simulate a reload using tabs.update.
      chrome.tabs.get(tabId, function (t) { chrome.tabs.update(tabId, {url: t.url}) });
      ns.lastReloads_ms[tabId] = now_ms;
    }
  };

  /**
   * Select the given tab count, mod the number of tabs currently open.
   * @function
   * @seealso http://code.google.com/chrome/extensions/tabs.html
   * @seealso http://code.google.com/chrome/extensions/content_scripts.html#pi
   */
  ns.select = function (windowId, count) {
    chrome.tabs.getAllInWindow(windowId, function (tabs) {
      var tab = tabs[count % tabs.length],
        nextTab = tabs[(count + 1) % tabs.length];
      chrome.tabs.update(tab.id, {selected: true});

      // checks and reloads the next tab
      ns.reload(nextTab.id);

			console.log("select sets active tab: %s", tab.url);
			// Grab the url and tab here, so we can determine elsewhere if we are on a jira page.
      ns.currentTabUrl = tab.url;
			ns.currentTabId = tab.id;
    });
  };

  /**
   * Put the carousel into motion.
   * @function
   */
  ns.start = function (ms) {
    var continuation,
      count = 0,
      windowId; // window in which Carousel was started

    if (!ms) { ms = ns.flipWait_ms(); }
    chrome.windows.getCurrent(function (w) { windowId = w.id; });

    chrome.browserAction.setIcon({path: 'images/icon_32_exp_1.75_stop_emblem.png'});
    chrome.browserAction.setTitle({title: 'Stop Carousel'});
 		continuation = function () {
	    console.log("-- start continuation count=%i", count);
      ns.select(windowId, count);
      count += 1;
      setTimeout(function() { // wait a bit since moving tabs is async.
				if (ns.isActiveJiraCardWallPage()) {
					console.log("will execute script and set timeout.");
					chrome.tabs.executeScript(ns.currentTabId, // explicit tab if debugger window active.
						{file: "javascripts/jira_page_content_script.js", runAt: "document_end"}, 
						function(result) { 
							if (result) {				
								console.log("will scroll %s ms", result[0]);
								ns.lastTimeout = setTimeout(continuation, result[0]);
							} else {
								console.log("WARN: undefined result from executeScript, setting default scroll.");
								ns.lastTimeout = setTimeout(continuation, ms);
							}
						}
					);
				} else {
					console.log("setting the timeout to rotate tabs normally.");
	      	ns.lastTimeout = setTimeout(continuation, ms);
				}
			}, 100);
    };
		continuation();
  };

  /**
   * Is the carousel in motion?
   * @function
   */
  ns.running = function () {
    return !!ns.lastTimeout;
  };

  /**
   * Stop the carousel.
   * @function
   */
  ns.stop = function () {
    clearTimeout(ns.lastTimeout);
    ns.lastTimeout = undefined;
    chrome.browserAction.setIcon({path: 'images/icon_32.png'});
    chrome.browserAction.setTitle({title: 'Start Carousel'});
  };

  /**
   * Accessor for first run timestamp.
   * @function
   */
  ns.firstRun = function (value) {
    if (value) {
      localStorage['firstRun'] = value;
    } else {
      return !localStorage['firstRun'];
    }
  };

  /**
   * Accessor for user set flip wait timing or the default.
   * @function
   */
  ns.flipWait_ms = function (ms) {
    if (ms) {
      localStorage['flipWait_ms'] = ms;
    } else {
      return localStorage['flipWait_ms'] || ns.defaults.flipWait_ms;
    }
  };
	
  /**
   * Accessor for user set reload wait timing or the default.
   * @function
   */
  ns.reloadWait_ms = function (ms) {
    if (ms) {
      localStorage['reloadWait_ms'] = ms;
    } else {
      return localStorage['reloadWait_ms'] || ns.defaults.reloadWait_ms;
    }
  };
  
  /**
   * Accessor for user set automatic start preference.
   * @function
   */
  ns.automaticStart = function (value) {
    if (1 === arguments.length) {
      localStorage['automaticStart'] = !!value;
    } else {
      if (localStorage['automaticStart']) {
        return JSON.parse(localStorage['automaticStart']);
      }
    }
  };

  /**
   * Display the first-run tutorial.
   * @function
   */
  ns.tutorial = function () {
    alert(ns.tutorialText);
    ns.firstRun(Date.now());
  };

  /**
   * Chrome browser action (toolbar button) click handler.
   * @function
   */
  ns.click = function () {
    var entry, ms, parsed;

    if (ns.firstRun()) { ns.tutorial(); }

    if (!ns.running()) {
      ns.start();
    } else {
      ns.stop();
    }
  };

  /**
   * Background page onLoad handler.
   * @function
   */
  ns.load = function () {
    chrome.browserAction.onClicked.addListener(ns.click);
    chrome.browserAction.setTitle({title: 'Start Carousel'});

    if (ns.automaticStart()) { ns.start(); }
  };

  /**
   * @constructor
   */
  ns.OptionsController = function (form) {
    this.form = form;
    this.form.flipWait_ms.value = ns.flipWait_ms() / 1000;
    this.form.reloadWait_ms.value = ns.reloadWait_ms() / 60 / 1000;
    this.form.automaticStart.checked = ns.automaticStart();
    this.form.onsubmit = this.onsubmit;
  };

  ns.OptionsController.prototype = {
    /**
     * Save callback for Options form.  Keep in mind "this" is the form, not the controller.
     * @function
     */
    onsubmit: function () {
      var status = document.getElementById('status');
      status.innerHTML = '';

      ns.flipWait_ms(this.flipWait_ms.value * 1000);
      ns.reloadWait_ms(this.reloadWait_ms.value * 60 * 1000);
      ns.automaticStart(this.automaticStart.checked);

      // So the user sees a blink when saving values multiple times without leaving the page.
      setTimeout(function () {
        status.innerHTML = 'Saved';
        status.style.color = 'green';
      }, 100);

      return false;
    }
  };

  return ns;
}());
