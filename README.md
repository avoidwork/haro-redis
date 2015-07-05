# haro-redis

[![Join the chat at https://gitter.im/avoidwork/haro-redis](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/avoidwork/haro-redis?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![build status](https://secure.travis-ci.org/avoidwork/haro-redis.svg)](http://travis-ci.org/avoidwork/haro-redis)

[Harō](http://haro.rocks) is a modern immutable DataStore built with ES6 features, which can be wired to an API for a 
complete feedback loop. It is un-opinionated, and offers a plug'n'play solution to modeling, searching, & managing data 
on the client, or server (in RAM). It is a [partially persistent data structure](https://en.wikipedia.org/wiki/Persistent_data_structure), by maintaining version sets of records in `versions` ([MVCC](https://en.wikipedia.org/wiki/Multiversion_concurrency_control)).

***haro-redis*** is a persistent storage adapter, providing 'auto saving' behavior, as well as the ability to 
`save()` & `load()` the entire DataStore.

### How to use
Require the adapter & register it with `haro.register(key, fn)`. The key must match the `store.adapters` key. The prefix 
will be used if set, otherwise `store.id` will be the prefix for localStorage items. Records will be have keys as `prefix_key`, while 
DataStores will be `prefix`.

```javascript
var haro = require('haro'),
    store;

// Configure a store to utilize the adapter
store = haro(null, {
  adapters: {
    redis: {
        prefix: "myData",
        port: 6379,
        host: "127.0.0.1",
        config: {}
    }
  }
});

// Register the adapter
store.register('redis', require('haro-redis'));

// Ready to `load()`, `batch()` or `set()`!
```

## License
Copyright (c) 2015 Jason Mulligan
Licensed under the BSD-3 license
