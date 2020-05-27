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

function createCard(card) {
  var cardWrapper = document.createElement('div');
  var cardTitle = document.createElement('div');
  var cardTitleTextElement = document.createElement('h2');
  var cardSupportingText = document.createElement('div');
  // var cardSaveButton = document.createElement('button');

  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  cardTitle.className = 'mdl-card__title';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardSupportingText.className = 'mdl-card__supporting-text';
  
  cardTitle.style.backgroundImage = 'url(' + card.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardTitleTextElement.style.color = 'white';
  cardSupportingText.style.textAlign = 'center';
  
  cardTitleTextElement.textContent = card.title;
  cardSupportingText.textContent = card.location;
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
  while(sharedMomentsArea.lastChild) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

function updateUI(data = {}) {
  console.log('Object.values', Object.values(data));

  if(Array.isArray(Object.values(data))) {
    clearCard();
    Object.values(data).map(card => {
      console.log('card', card);

      createCard(card);
    });
  }
}

let url = 'https://pwa-recovery.firebaseio.com/posts.json';
let networkDataReceived = false;


if('indexedDB' in window) {
  console.log('readAllData(\'posts\')', );
  readAllData('posts')
    .then(data => {
      if(data && !networkDataReceived) {
        console.log('[Fetched Form Cache First]', data)
        updateUI(data);
      }
    })
}

// if('caches' in window) {
//   caches.match(url)
//     .then(response => {
//       console.log('cache res', response);
//       return response && response.json()
//     })
//     .then(cards => {

//       if(cards && !networkDataReceived) {
//         console.log('[Fetched Form Cache First]', cards)
//         updateUI(cards);
//       }
//     })
// }

axios.get(url)
  .then(response => {
    console.log('[Fetched Form Network First]', response);
    networkDataReceived = true;
    updateUI(response.data);
  });
  
