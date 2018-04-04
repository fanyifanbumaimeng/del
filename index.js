'use strict';
const path = require('path');
//拓展glob
const globby = require('globby');
const isPathCwd = require('is-path-cwd');
//判断路径是不是在当前目录下
const isPathInCwd = require('is-path-in-cwd');
//将一部函数promise化，可以转单个函数也可以转模块下所有函数。
const pify = require('pify');
//封装好的rm -rf命令
const rimraf = require('rimraf');
const pMap = require('p-map');

//promise化
const rimrafP = pify(rimraf);

//判断文件是否是当前目录或者是否在当前目录下
function safeCheck(file) {
	if (isPathCwd(file)) {
		throw new Error('Cannot delete the current working directory. Can be overriden with the `force` option.');
	}

	if (!isPathInCwd(file)) {
		throw new Error('Cannot delete files/folders outside the current working directory. Can be overriden with the `force` option.');
	}
}

module.exports = (patterns, opts) => {

	opts = Object.assign({}, opts);

	const force = opts.force;
	delete opts.force;

	const dryRun = opts.dryRun;
	delete opts.dryRun;

	const mapper = file => {
		//如果传入force参数，则判断是否是本地目录或者目录外文件
		if (!force) {
			safeCheck(file);
		}

		//组成文件路径
		file = path.resolve(opts.cwd || '', file);

		if (dryRun) {
			return file;
		}
		return rimrafP(file, {glob: false}).then(() => file);
	};

	return globby(patterns, opts).then(files => pMap(files, mapper, opts));
};

module.exports.sync = (patterns, opts) => {
	opts = Object.assign({}, opts);

	const force = opts.force;
	delete opts.force;

	const dryRun = opts.dryRun;
	delete opts.dryRun;

	return globby.sync(patterns, opts).map(file => {
		if (!force) {
			safeCheck(file);
		}

		file = path.resolve(opts.cwd || '', file);

		if (!dryRun) {
			rimraf.sync(file, {glob: false});
		}

		return file;
	});
};
