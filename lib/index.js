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

var Promise = require("es6-promise").Promise;
var redis = require("redis");

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

function adapter(store, op, key, data) {
	var defer = deferred(),
	    record = key !== undefined,
	    config = store.adapters.redis,
	    prefix = config.prefix || store.id,
	    lkey = prefix + (record ? "_" + key : ""),
	    client = redis.createClient(config.port, config.host, config.options);

	if (op === "get") {
		client.get(lkey, function (e, reply) {
			var result = JSON.parse(reply ? reply.toString() : null);

			if (e) {
				defer.reject(e);
			} else if (result) {
				defer.resolve(result);
			} else if (record) {
				defer.reject(new Error("Record not found in redis"));
			} else {
				defer.reject([]);
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
		client.set(lkey, JSON.stringify(data), function (e) {
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
