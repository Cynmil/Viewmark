chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({initialPage: 1, maxNumOfViewmarksPerPage: 10, saveNewMarksToFirst: true});
});