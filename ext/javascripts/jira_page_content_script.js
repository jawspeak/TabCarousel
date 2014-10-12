/** Scrolls a jira card wall page so we can see all the information. */

// added to support scrolling on jira pages.
var SCROLL_SLEEP_MS = 30;
var SCROLL_STEP_PX = 2;
var SCROLL_PAUSE_AT_TOP_AND_BOTTOM_MS = 500;

setTimeout(function f(){
	// seemed that the script was getting killed, so added this to see if it keeps running.
	console.log("... jaw was here");
	setTimeout(f, 2000);
}, 2000);

var doScrolling = function() {
	// tested against JIRA Agile v6.6.0 and JIRA v6.3.4.
	var scrollDiv = document.getElementById('ghx-pool');
  var totalScroll = scrollDiv.scrollHeight;
  var timeRequiredMs = totalScroll / SCROLL_STEP_PX * SCROLL_SLEEP_MS + SCROLL_PAUSE_AT_TOP_AND_BOTTOM_MS * 2;
	scrollDiv.scrollTop = 0; // reset to top
	var currentScroll = 0;
  var scroller = function() {
    if (currentScroll >= totalScroll) {
      return;
    }
    currentScroll = currentScroll + SCROLL_STEP_PX;
    scrollDiv.scrollTop = currentScroll;
    setTimeout(arguments.callee, SCROLL_SLEEP_MS);
  }

  setTimeout(scroller, SCROLL_PAUSE_AT_TOP_AND_BOTTOM_MS);
  setTimeout(function() { scrollDiv.scrollTop = 0;}, 
		timeRequiredMs + SCROLL_PAUSE_AT_TOP_AND_BOTTOM_MS);
	return timeRequiredMs;
}

doScrolling();
