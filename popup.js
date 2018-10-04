(function main(){
  let options = {
    'currentPage': 1,
    'maxNumOfViewmarksPerPage': 10,
    'saveNewInfoToFirst': true
  };

  chrome.storage.sync.get(['initialPage', 'maxNumOfViewmarksPerPage', 'saveNewMarksToFirst'], function(savedData){
    options.currentPage = savedData.initialPage;
    options.maxNumOfViewmarksPerPage = savedData.maxNumOfViewmarksPerPage;
    options.saveNewInfoToFirst = savedData.saveNewMarksToFirst;
  });

  addBackgroundEventListeners(options);
  addBtnEventListeners(options);

  updateList(options);
  updatePagination(options);
  $('.collapsible').collapsible();
})();