/**
 * Redis persistent storage adapter for Harō
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2015
 * @license BSD-3-Clause
 * @link https://github.com/avoidwork/haro-redis
 * @version 1.0.2
 */
"use strict";

var Map = require("es6-map");
var Promise = require("es6-promise").Promise;
var redis = require("redis");
var registry = new Map();

function deferred() {
	var promise = undefined,
	    resolver = undefined,
	    rejecter = undefined;

	promise = new Promise(function (resolve, reject) {
		resolver = resolve;
		rejecter = reject;
	});

	return { resolve: resolver, reject: rejecter, promise: promise };
}

function getClient(id, port, host, options) {
	if (!registry.has(id)) {
		registry.set(id, redis.createClient(port, host, options));
	}

	return registry.get(id);
}

function adapter(store, op, key, data) {
	var defer = deferred(),
	    record = key !== undefined,
	    config = store.adapters.redis,
	    prefix = config.prefix || store.id,
	    lkey = prefix + (record ? "_" + key : ""),
	    client = getClient(store.id, config.port, config.host, config.options);

	if (op === "get") {
		client.get(lkey, function (e, reply) {
			var result = JSON.parse(reply || null);

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
