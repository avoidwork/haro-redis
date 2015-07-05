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

function adapter (store, op, key, data) {
	let defer = deferred(),
		record = key !== undefined,
		config = store.adapters.redis,
		prefix = config.prefix || store.id,
		lkey = prefix + (record ? "_" + key : ""),
		client = redis.createClient(config.port, config.host, config.options);

	if (op === "get") {
		client.get(lkey, function (e, reply) {
			let result = JSON.parse((reply ? reply.toString() : null));

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
