/**
 * Redis persistent storage adapter for Harō
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2015
 * @license BSD-3-Clause
 * @link https://github.com/avoidwork/haro-redis
 * @version 1.0.1
 */
"use strict";

const Promise = require("es6-promise").Promise;
const redis = require("redis");

function deferred () {
	let promise, resolver, rejecter;

	promise = new Promise(function (resolve, reject) {
		resolver = resolve;
		rejecter = reject;
	});

	return {resolve: resolver, reject: rejecter, promise: promise};
}

function rdis (store, op, key, data) {
	let defer = deferred(),
		record = key !== undefined,
		config = store.adapters.redis,
		prefix = config.prefix || store.id,
		lkey = prefix + (record ? "_" + key : ""),
		client = redis.createClient(config.port, config.host, config.options);

	if (op === "get") {
		client.get(lkey, function (e, reply) {
			let result = JSON.parse(reply.toString());

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
	}

	if (op === "remove") {
		client.del(lkey, function (e) {
			if (e) {
				defer.reject(e);
			} else {
				defer.resolve(true);
			}
		});
	}

	if (op === "set") {
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

module.exports = rdis;
