"use strict";

const Map = require("es6-map");
const deferred = require("tiny-defer");
const redis = require("redis");

let registry = new Map();

function getClient (id, port, host, options) {
	if (!registry.has(id)) {
		registry.set(id, redis.createClient(port, host, options));
	}

	return registry.get(id);
}

function adapter (store, op, key, data) {
	let defer = deferred(),
		record = key !== undefined,
		config = store.adapters.redis,
		prefix = config.prefix || store.id,
		lkey = prefix + (record ? "_" + key : ""),
		client = getClient(store.id, config.port, config.host, config.options);

	if (op === "get") {
		client.get(lkey, function (e, reply) {
			let result = JSON.parse(reply || null);

			if (e) {
				defer.reject(e);
			} else if (result) {
				defer.resolve(result);
			} else if (record) {
				defer.reject(new Error("Record not found in redis"));
			} else {
				defer.resolve([]);
			}
		});
	} else if (op === "remove") {
		client.del(lkey, function (e) {
			if (e) {
				defer.reject(e);
			} else {
				defer.resolve(true);
			}
		});
	} else if (op === "set") {
		client.set(lkey, JSON.stringify(record ? data : store.toArray()), function (e) {
			if (e) {
				defer.reject(e);
			} else {
				defer.resolve(true);
			}
		});
	}

	return defer.promise;
}

module.exports = adapter;
