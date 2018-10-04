// functionality of "Add New Viewmark Button"

function saveNewViewmark(){
  // let top buttons to scale out 
  let buttons = document.querySelectorAll('.btn-floating');
  buttons.forEach(function(button){
    button.classList.add('scale-out');
  });

  const parent = document.querySelector('.card-content');
  const oldButtonList = parent.firstElementChild;
  const newNameForm = document.createElement('div')
  newNameForm.className = 'row';
  newNameForm.innerHTML = '<div class="input-field col s9 scale-transition scale-out" style="margin: 0"><i class="material-icons prefix">edit</i><input type="text" id="nameOfViewmark"><label for="nameOfViewmark">Name Current View</label></div><input class="btn col s3 scale-transition scale-out" type="submit" value="save" style="height: 40px">';

  setTimeout(function(){
    parent.replaceChild(newNameForm, oldButtonList);
    document.querySelector('div.input-field').classList.remove('scale-out');
    document.querySelector('.btn.col.s3').classList.remove('scale-out');
    getUserInputForName(oldButtonList);
  }, 270);
}

function getUserInputForName(btnList){
  const parent = document.querySelector('.card-content');

  let name = 'default name';
  const nameInput = document.getElementById('nameOfViewmark');
  const saveBtn = document.querySelector('.btn.col.s3');

  nameInput.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
      if (nameInput.value !== '') name = nameInput.value;
      bringBackBtnList(parent, btnList);
      const submitted = new CustomEvent('nameSubmitted', {detail: name});
      document.dispatchEvent(submitted);
    }
  });

  saveBtn.addEventListener('click', function(e){
    if (nameInput.value !== '') name = nameInput.value;
    bringBackBtnList(parent, btnList);
    const submitted = new CustomEvent('nameSubmitted', {detail: name});
    document.dispatchEvent(submitted);
  });
}

function bringBackBtnList(parent, btnList){
  document.querySelector('div.input-field').classList.add('scale-out');
  document.querySelector('.btn.col.s3').classList.add('scale-out');

  setTimeout(function(){
    parent.replaceChild(btnList, parent.firstElementChild);
    for (let i = 0; i < btnList.children.length; i++){
      btnList.children[i].firstElementChild.classList.remove('scale-out');
    }
  }, 270);
}

// Saving new viewmark into local storage
function saveNewInfo(name, tabs, options){
  console.log('saving', name);
  let tab_urls = [];
  tabs.forEach(function(tab){
    tab_urls.push(tab.url);
  });

  chrome.storage.local.get('viewList', function(data){
    let items = {title: name, urls: tab_urls};
    let allViews = data['viewList'] || [];
    if (options.saveNewInfoToFirst) allViews.unshift(items);
    else allViews.push(items);
    chrome.storage.local.set({viewList: allViews}, function(){
      let event = new Event('saved');
      document.dispatchEvent(event);
    });
  });
}

// Updates the current list of the viewmarks and pagination
function updateList(options){
  const parent = document.querySelector('.card-action');
  const viewList = parent.firstElementChild;
  let viewMarkElement = document.createElement('li');

  chrome.storage.local.get('viewList', function(data){
    if (data['viewList'] === undefined){
      // Need some label for empty field
      return;
    }

    viewList.innerHTML = '';

    let startIndex = (options.currentPage - 1) * options.maxNumOfViewmarksPerPage;
    let endIndex = options.currentPage * options.maxNumOfViewmarksPerPage - 1;
    let tabLink;

    for (let i = startIndex; i <= endIndex && i < data.viewList.length; i++){
      tabLink = document.createElement('li');
      tabLink.style = 'margin: 0';
      tabLink.appendChild(createMainViewmarkElement(data.viewList[i].title, i));
      tabLink.appendChild(createViewAllTabsElement(data.viewList[i].urls))

      viewList.appendChild(tabLink);
    }

    for (let i = startIndex; i <= endIndex && i < data.viewList.length; i++){
      document.getElementById('tabBtn' + i).addEventListener('click', function(){
        data['viewList'][i]['urls'].forEach(function(url){
          chrome.tabs.create({url: url});
        });
      });

      document.getElementById('deleteBtn' + i).addEventListener('click', function(){
        data['viewList'].splice(i, 1);
        chrome.storage.local.set({'viewList': data['viewList']});
        updateList(options);
      });
    }
  });
}

function createViewAllTabsElement(urls){
  colpsBody = document.createElement('div');
  colpsBody.className = 'collapsible-body';
  urlList = document.createElement('ul');
  urlList.className = 'collection';
  urls.forEach(function(url){
    urlList.innerHTML += `<li class="collection-item">${url}</li>`;
  });
  colpsBody.appendChild(urlList);
  return colpsBody;
}

function createMainViewmarkElement(title, index){
  mainElm = document.createElement('div');
  mainElm.className = 'collapsible-header';
  mainElm.innerHTML = `${title}<a id="tabBtn${index}" class="secondary-content" href="#" style="margin-left:230px"><i class="material-icons">tab</i></a><a id="deleteBtn${index}" class="secondary-content" href="#"><i class="material-icons">delete</i></a>`;
  return mainElm;
}

// Updates the pagination panel
function updatePagination(options){
  const cardFooter = document.querySelector('.card-footer');

  chrome.storage.local.get('viewList', function(data){
    const viewList = data.viewList;
    if (viewList === undefined || viewList.length <= options.maxNumOfViewmarksPerPage){
      if (document.querySelector('.pagination')) cardFooter.removeChild(document.querySelector('.pagination'));
      return;
    }
  
    cardFooter.innerHTML = '<ul class="pagination" align="center"></ul>';
    const pagination = document.querySelector('.pagination');
    if (options.currentPage === 1)
      pagination.innerHTML = '<li class="disabled"><a href="#"><i class="material-icons">chevron_left</i></a></li>';
    else
      pagination.innerHTML = '<li class="waves-effect waves-light"><a href="#"><i class="material-icons">chevron_left</i></a></li>';
  
    for (let i=1; i - 1 < viewList.length / options.maxNumOfViewmarksPerPage; i++){
      if (i == options.currentPage)
        pagination.innerHTML += `<li id="pageBtn${i}" class="active"><a>${i}</a></li>`;
      else
        pagination.innerHTML += `<li id="pageBtn${i}" class="waves-effect waves-light"><a href="#">${i}</a></li>`;
    }
  
    if (options.currentPage === Math.ceil(viewList.length / options.maxNumOfViewmarksPerPage))
      pagination.innerHTML += '<li class="disabled"><a href="#"><i class="material-icons">chevron_right</i></a></li>';
    else
      pagination.innerHTML += '<li class="waves-effect waves-light"><a href="#"><i class="material-icons">chevron_right</i></a></li>';
  
    addPaginationEvents(viewList, options);
  });
}

function addPaginationEvents(viewList, options){
  const pagination = document.querySelector('.pagination');
  const leftBtn = pagination.firstElementChild;
  const rightBtn = pagination.lastElementChild;
  let event = new Event('pageChanged');

  function leftPage(){
    options.currentPage--;
    setTimeout(function(){
      if (options.currentPage === 1){
        leftBtn.className = 'disabled';
        leftBtn.removeEventListener('click', leftPage);
      }
      if (options.currentPage !== Math.ceil(viewList.length / options.maxNumOfViewmarksPerPage)){
        rightBtn.className = 'waves-effect waves-light';
        rightBtn.addEventListener('click', rightPage);
      }
      document.getElementById('pageBtn' + (options.currentPage + 1)).className = 'waves-effect waves-light';
      document.getElementById('pageBtn' + (options.currentPage + 1)).addEventListener('click', pageClick);
      document.getElementById('pageBtn' + (options.currentPage)).className = 'active';
      document.getElementById('pageBtn' + (options.currentPage)).removeEventListener('click', pageClick);
      document.dispatchEvent(event);
    }, 100);
  }

  function rightPage(){
    options.currentPage++;
    setTimeout(function(){
      if (options.currentPage !== 1){
        leftBtn.className = 'waves-effect waves-light';
        leftBtn.addEventListener('click', leftPage);
      }
      if (options.currentPage === Math.ceil(viewList.length / options.maxNumOfViewmarksPerPage)){
        rightBtn.className = 'disabled';
        rightBtn.removeEventListener('click', rightPage);
      }
      document.getElementById('pageBtn' + (options.currentPage - 1)).className = 'waves-effect waves-light';
      document.getElementById('pageBtn' + (options.currentPage - 1)).addEventListener('click', pageClick);
      document.getElementById('pageBtn' + (options.currentPage)).className = 'active';
      document.getElementById('pageBtn' + (options.currentPage)).removeEventListener('click', pageClick);
      document.dispatchEvent(event);
    }, 100);
  }

  function pageClick(e){
    const prevPage = options.currentPage;
    options.currentPage = parseInt(e.target.parentElement.id.slice(-1));
    setTimeout(function(){
      if (options.currentPage === 1){
        leftBtn.className = 'disabled';
        leftBtn.removeEventListener('click', leftPage);
      } else {
        leftBtn.className = 'waves-effect waves-light';
        leftBtn.addEventListener('click', leftPage);
      }

      if (options.currentPage === Math.ceil(viewList.length / options.maxNumOfViewmarksPerPage)){
        rightBtn.className = 'disabled';
        rightBtn.removeEventListener('click', rightPage);
      } else {
        rightBtn.className = 'waves-effect waves-light';
        rightBtn.addEventListener('click', rightPage);
      }
      document.getElementById('pageBtn' + prevPage).className = 'waves-effect waves-light';
      document.getElementById('pageBtn' + prevPage).addEventListener('click', pageClick);
      document.getElementById('pageBtn' + (options.currentPage)).className = 'active';
      document.getElementById('pageBtn' + (options.currentPage)).removeEventListener('click', pageClick);
      document.dispatchEvent(event);
    }, 100);
  }

  if (options.currentPage !== 1){
    leftBtn.addEventListener('click', leftPage);
  }
  
  if (options.currentPage !== Math.ceil(viewList.length / options.maxNumOfViewmarksPerPage)){
    rightBtn.addEventListener('click', rightPage);
  }

  for (let i=1; i - 1 < viewList.length / options.maxNumOfViewmarksPerPage; i++){
    document.getElementById('pageBtn' + i).addEventListener('click', pageClick);
  }
}

// add all custom event listeners
function addBackgroundEventListeners(options){
  document.addEventListener('nameSubmitted', function(e){
    let savedViewmarkName = e.detail;
    chrome.tabs.query({currentWindow: true}, function(tabs){
      saveNewInfo(savedViewmarkName, tabs, options);
    });
  });

  document.addEventListener('saved', function(){
    updateList(options);
    updatePagination(options);
  });

  document.addEventListener('pageChanged', function(){
    updateList(options);
  });
}

function addBtnEventListeners(options){
  const bookmarkBtn = document.querySelector('.btn-floating.red');
  const undoBtn = document.querySelector('.btn-floating.yellow');
  const sortBtn = document.querySelector('.btn-floating.green');
  const settingBtn = document.querySelector('.btn-floating.blue');

  bookmarkBtn.addEventListener('click', saveNewViewmark);

  sortBtn.addEventListener('click', function(){
    for (let i = 100; i < 200; i++){saveNewInfo(i.toString(), [{url: 'https://google.com'}], options);}
  });

  settingBtn.addEventListener('click', function(){
    chrome.storage.local.clear();
  });
}