self.addEventListener("install", (event) => {
    event.waitUntil(preLoad());
});

const preLoad = async () =>{
    console.log("Installing web app");

    const cache = await caches.open("offline");
    console.log("caching index and important routes");

    return await cache.addAll(["/", "/offline.html"]);
};

self.addEventListener("fetch", (event) => {
    event.respondWith(checkResponse(event.request).catch(() => {
        // If we get a 404, try to return the offline page.
        return returnFromCache(event.request);
    }));

    event.waitUntil(addToCache(event.request));
});

const checkResponse = (request) => {
    return new Promise(async (fulfill, reject) => {
        const resp = await fetch(request);

        if(resp.status !== 404) {
            fulfill(resp);
        } else {
            reject();
        }
    });
};

const addToCache = async (request) => {
    const cache = await caches.open("offline");
    const response = await fetch(request);
    console.log(response.url + " was cached");

    return await cache.put(request, response);
};

const returnFromCache = async (request) =>{
    const cache = await caches.open("offline");
    const matching = await cache.match(request);

    if (!matching || matching.status == 404) {
        return cache.match("offline.html");
    } else {
        return matching;
    }
};