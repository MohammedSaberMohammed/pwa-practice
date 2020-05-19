var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  // unregister service worker
  // if('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(serviceworkers => {
  //       serviceworkers.forEach(serviceWorker => {
  //         serviceWorker.unregister()
  //           .then(() => console.log('[ serviceWorker unregistered successfully ]'))
  //       })
  //     })
  // }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function onSaveButtonClicked(event) {
  // Cache On Demand
  if('caches' in window) {
    caches.open('user-requested')
    .then(userCache => {
      userCache.add('https://jsonplaceholder.typicode.com/posts')
      userCache.add('/src/images/sf-boat.jpg')
    })
  }
  console.log('clicked');
}

function createCard() {
  var cardWrapper = document.createElement('div');
  var cardTitle = document.createElement('div');
  var cardTitleTextElement = document.createElement('h2');
  var cardSupportingText = document.createElement('div');
  // var cardSaveButton = document.createElement('button');

  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  cardTitle.className = 'mdl-card__title';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardSupportingText.className = 'mdl-card__supporting-text';
  
  cardTitle.style.backgroundImage = 'url("/src/images/sf-boat.jpg")';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardTitleTextElement.style.color = 'white';
  cardSupportingText.style.textAlign = 'center';
  
  cardTitleTextElement.textContent = 'San Francisco Trip';
  cardSupportingText.textContent = 'In San Francisco';
  // cardSaveButton.textContent = 'Save';

  // cardSaveButton.addEventListener('click', onSaveButtonClicked);

  componentHandler.upgradeElement(cardWrapper);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardTitle);
  cardTitle.appendChild(cardTitleTextElement);
  cardWrapper.appendChild(cardSupportingText);
  sharedMomentsArea.appendChild(cardWrapper);
}

function clearCard() {
  if(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

let urlToFetch = 'https://jsonplaceholder.typicode.com/posts';
let networkDataReceived = false;

if('caches' in window) {
  caches.match(urlToFetch)
    .then(response => {
      if(response && !networkDataReceived) {
        console.log('[Fetched Form Cache First]', response)
        clearCard();
        createCard();
      }
    })
}

axios.get(urlToFetch)
  .then(response => {
    console.log('[Fetched Form Network First]', response);
    networkDataReceived = true;
    clearCard();
    createCard();
  });
