importScripts("https://cdn.jsdelivr.net/npm/idb@4.0.5/build/iife/with-async-ittr-min.js");
importScripts('/src/js/utility.js');

/**
* 1/ Caching Strategies
 * 2/ MultiSource Fallbacks [ HTML file, images ]
 * 3/ Triming Cache [ in Order no to exceed Cache Storage ]
 * 4/ Unregister Serviceworker in [ Feed.js ] file
 */
var CACHE_STATIC_NAME = 'static-3';
var CACHE_DYNAMIC_NAME = 'dynamic-v1';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/utility.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  '/src/images/offline.jpg',
  '/favicon.ico',
  'https://cdn.jsdelivr.net/npm/idb@4.0.5/build/iife/with-async-ittr-min.js',
  'https://unpkg.com/axios/dist/axios.min.js',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// ======== Check To Design FallBack ======= 
function checkInHeader(request, header, searchMethod = 'includes'){
  switch(searchMethod) {
    case 'includes':
    default:  
      return request.headers.get('accept').includes(header);
    case 'indexOf': 
      return request.headers.get('accept').indexOf(header) > -1;
  }
}
// ======== Trim Cache =======
function trimCache(cacheName, maxItems) {
  caches.open(cacheName)
    .then(cache => {
      return cache.keys().then(cachedItems => {
        if(cachedItems.length > maxItems) {
          console.log('cachedItems, cachedItems.length, maxItems', cachedItems, cachedItems.length, maxItems);
          cache.delete(cachedItems[0])
            .then(trimCache(cacheName, maxItems))
        }
      })
    })
}
// ========= search in cache =======
function isInArray(url, array) {

  var cachePath;
  if (url.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = url.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = url; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Precaching App Shell');
        cache.addAll(STATIC_FILES);
      })
  )
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        }));
      })
  );
  return self.clients.claim();
});

/**
 * @returns { 1/ Cache With Network Fallback Strategy }
 */
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         console.log('[Request]', event.request.url);
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//             })
//             .catch(function(err) {
//               return caches.match('/offline.html');
//             });
//         }
//       })
//   );
// });

/**
 * @returns { 2/ Network with Cache Fallback Strategy [ You Can use dynamic caching with it ] }
 * **Steps: 
 *    1/ fetch from nnetwork and if network failed then
 *    2/ fetch from cache
 * **Disadvantages: 
 *    1/ if network is slow you will have to wait untill the connection timeout then fetch from cache
 */
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     fetch(event.request)
//       .then(response => {
//         caches.open(CACHE_DYNAMIC_NAME)
//           .then(cache => {
//             cache.put(event.request, response.clone());

//             return response;
//           })
//       })
//       .catch(err => {
//         return caches.match(event.request);
//       })
//   );
// });

/**
 * @returns { 3/ Cache Then Network Strategy }
 * **Steps: 
 *    1/ fetch from [Network and Cache ] at the same time From [ outer File Not from SW ]
 *    2/ if [ Cache ] responded first then show it to user and [ When Network responds ] cache its response to use it in the future from cache.
 *    3/ if [ Network ] responded first show it to the user then cache the response to use it in the future from cache.
 * **Advantages:**
 *    1/ it's the [ Enhanced Strategy ] from [ Network with cache ] 
 * **Disadvantages:**
 *    1/ if you always want an up-to-date data [ Like real-time-data ] it will not be good [ because ] it might get the response from cache.
 *    2/ [ Offline Functionality ] will not work until u use this strategy at certain urls [ check on the url ] and the other [ static_FILES ] should be fetched from static cache
 */
  self.addEventListener('fetch', event => {
    let urlToFetch = 'https://pwa-recovery.firebaseio.com/posts.json';

    if(event.request.url.indexOf(urlToFetch) > -1) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            const clonedRes = response.clone();

            // First clear Database in order to be updated
            clearAllData('posts')
              .then(data => {
                // only save jsonData in indexedDB ===> [ Cache Api Saves the whole response we can't save the desired response ]
                clonedRes.json()
                  .then(data => {
                    const receivedData = Object.values(data);

                    if(Array.isArray(receivedData)) {
                      receivedData.map(post => {

                        writeData('posts', post);
                      })
                    }
                  })
              })

            return response;
          })
      );
    } else if(isInArray(event.request.url, STATIC_FILES)) {
      // Serve the static Assets from STATIC_CACHE
      event.respondWith(
        caches.match(event.request.url)
      );
    } else {
      event.respondWith(
        caches.match(event.request)
          .then(response => {
            return response || fetch(event.request)
              .then(res => {
                caches.open(CACHE_DYNAMIC_NAME)
                  .then(cache => {
                    // trimCache(CACHE_DYNAMIC_NAME, 3);
                    cache.put(event.request, res.clone());

                    return res;
                  })
              })
              .catch(err => {
                return caches.open(CACHE_STATIC_NAME)
                  .then(cache => {
                    // [ Checking on pages names ] Not scalable solution because if u have 15 different pages you have to check 15 times 
                    // if(event.request.url.indexOf('/help')) {
                    //   return cache.match('/offline.html');
                    // }

                    // ============== [ More Better Solution Is to check the headers an see if it is html file or image, ...etc ] =======
                    if(checkInHeader(event.request, 'text/html')) {
                      return cache.match('/offline.html');
                    } else if(checkInHeader(event.request, 'image/', 'indexOf')) {
                      return cache.match('/src/images/offline.jpg');
                    }
                  })
              })
          })
      );
    }
  });

/**
 * @returns { 3/ Cache Only Strategy }
 */
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

/**
 * @returns { 4/ Network Only Strategy }
 */
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     fetch(event.request)
//   );
// });