/**
 * Where the filter bar's active-tab indicator should sit.
 *
 * Extracted from FilterBar so it can be tested. jsdom reports every layout
 * measurement as zero, so the only way to pin this arithmetic is to hand it
 * numbers directly — and it needs pinning, because getting it wrong is
 * invisible at desktop widths and total on a narrow screen.
 *
 * The indicator is absolutely positioned inside the tab list, so its containing
 * block is that list's padding box. `left` and `right` are offsets from the two
 * edges of that box, and the browser resolves the width as
 * `clientWidth - left - right`. Passing anything other than the list's own
 * clientWidth as the reference makes that resolve to the wrong number.
 *
 * The bug this replaced used `scrollWidth`. While the row wraps — at and above
 * the sm breakpoint — scrollWidth equals clientWidth and nothing is wrong.
 * Below it the row is overflow-x-auto, six categories overflow, and the width
 * resolved to `clientWidth - scrollWidth + tabWidth`: at 360px that was
 * 329 - 683 + 49 = -305, which clamps to zero. The active tab lost its fill,
 * and its label — coloured for the filled state — went invisible with it.
 *
 * `movingRight` is not layout. It tells the indicator which edge leads, so the
 * two springs can be swapped and the shape stretches into the direction of
 * travel rather than compressing away from it.
 */
export const indicatorBox = (tab, listClientWidth, current) => ({
    left: tab.offsetLeft,
    right: listClientWidth - (tab.offsetLeft + tab.offsetWidth),
    top: tab.offsetTop,
    height: tab.offsetHeight,
    movingRight: current ? tab.offsetLeft >= current.left : true,
});

/**
 * The width a browser will resolve from that box. Test-only: nothing in the app
 * needs it, because the browser does this itself — but asserting the resolved
 * width is the only way to state what the box is actually *for*.
 */
export const resolvedWidth = (box, listClientWidth) =>
    listClientWidth - box.left - box.right;
