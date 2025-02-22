const extVersion = chrome.runtime.getManifest().version;

const inject = async (branch, version) => {
  console.log('[Cumcord for Web] Injecting...');

  window.gmExtension = version;

  const branchURLs = {
    release: 'https://raw.githubusercontent.com/Cumcord/Cumcord/stable/dist/build.js',
    dev: 'https://raw.githubusercontent.com/Cumcord/Cumcord/stable/dist/build.js',
    local: 'https://raw.githubusercontent.com/Cumcord/Cumcord/stable/dist/build.js'
  };

  console.log('[Cumcord for Web] Branch =', branch);
  console.log('[Cumcord for Web] JS Url =', branchURLs[branch]);
  
  const js = await (await fetch(branchURLs[branch])).text(); // JSON.parse(localStorage.getItem('goosemodCoreJSCache'));

  const el = document.createElement('script');
  
  el.appendChild(document.createTextNode(js));
  
  document.body.appendChild(el);

  console.log('[Cumcord for Web] Injected fetched JS');
};


// Extension Storage (v10)
const storageCache = {};

chrome.storage.local.get(null, (data) => {
  Object.assign(storageCache, data);

  if (Object.keys(storageCache).length === 0 && Object.keys(localStorage).find((x) => x.toLowerCase().startsWith('SmartCord'))) { // Nothing stored in Extension storage and something GM in localStorage - migrate from LS to Ext
    const gmKeys = Object.keys(localStorage).filter((x) => x.toLowerCase().startsWith('SmartCord'));

    const setObj = {};

    for (const k of gmKeys) {
      setObj[k] = localStorage.getItem(k);
      localStorage.removeItem(k);
    }

    console.log('[Cumcord For Web] Migrated from localStorage to Extension', setObj);

    Object.assign(storageCache, setObj);
    chrome.storage.local.set(setObj);
  }


  const el = document.createElement('script');

  el.appendChild(document.createTextNode(`(${inject.toString()})(${JSON.stringify(storageCache['SmartCordUntetheredBranch'] || 'release')}, ${JSON.stringify(extVersion)})`));

  document.body.appendChild(el);
});


document.addEventListener('gmes_get', ({ }) => {
  document.dispatchEvent(new CustomEvent('gmes_get_return', {
    // Firefox requires cloneInto as doesn't like sending objects from content -> page
    detail: typeof cloneInto === 'undefined' ? storageCache : cloneInto(storageCache, window) 
  }));
});

document.addEventListener('gmes_set', ({ detail: { key, value }}) => {
  storageCache[key] = value; // Repopulate cache with updated value
  
  const obj = {}; // Create object for set
  obj[key] = value;

  chrome.storage.local.set(obj); // Actually store change
});

document.addEventListener('gmes_remove', ({ detail: { key }}) => {
  delete storageCache[key]; // Repopulate cache with updated value

  chrome.storage.local.remove(key); // Actually store change
});
