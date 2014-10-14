/** Scrolls a long page for our milestones view. */

// added to support scrolling on jira pages.
var SCROLL_SLEEP_MS = 60;
var SCROLL_STEP_PX = 1;
var SCROLL_PAUSE_AT_TOP_AND_BOTTOM_MS = 5000;

var doScrolling = function() {
  var totalScroll = document.getElementById('main-area').clientHeight - window.innerHeight;
  var timeRequiredMs = totalScroll / SCROLL_STEP_PX * SCROLL_SLEEP_MS + SCROLL_PAUSE_AT_TOP_AND_BOTTOM_MS * 2;
	var currentScroll = 0;
  var scroller = function() {
    if (currentScroll >= totalScroll) {
      return;
    }
    currentScroll = currentScroll + SCROLL_STEP_PX;
		window.scrollBy(0, SCROLL_STEP_PX);
    setTimeout(arguments.callee, SCROLL_SLEEP_MS);
  }

  setTimeout(scroller, SCROLL_PAUSE_AT_TOP_AND_BOTTOM_MS);
  setTimeout(function() { window.scrollTo(0,0); }, timeRequiredMs - 50);
	return timeRequiredMs;
}

doScrolling();
