// WheelEvent units differ across browsers/devices. Pixel-mode trackpads retain
// their exact deltas; line/page-mode mouse wheels become document pixels.
export function getJourneyWheelDelta(event, pageHeight, lineHeight = 16) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return 0;
  if (!Number.isFinite(event.deltaY) || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return 0;
  const unit = event.deltaMode === 1 ? lineHeight : event.deltaMode === 2 ? pageHeight : 1;
  return event.deltaY * unit;
}

export function hasNestedScrollTarget(target, stage, delta) {
  if (!(target instanceof Element)) return false;
  if (target.closest('input,textarea,select,[contenteditable="true"],[role="slider"]')) return true;
  for (let element = target; element && element !== stage; element = element.parentElement) {
    const overflow = getComputedStyle(element).overflowY;
    if (!/^(auto|scroll)$/.test(overflow)) continue;
    if (element.scrollHeight <= element.clientHeight + 1) continue;
    if (delta < 0 ? element.scrollTop > 0 : element.scrollTop + element.clientHeight < element.scrollHeight - 1) return true;
  }
  return false;
}
