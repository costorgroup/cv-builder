/**
 * `autocomplete` value for CV editor fields. Chrome ignores "off" for its
 * address/contact autofill (whose popup covers our dropdowns and would fill
 * the CV with the browser's saved details), but skips fields whose value it
 * doesn't recognise. Firefox only honours "off", but doesn't push autofill
 * the same way.
 */
export const NO_AUTOFILL = "none";
