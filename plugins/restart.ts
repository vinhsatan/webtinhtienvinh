import path from 'node:path';
import process from 'node:process';
import micromatch from 'micromatch';
import type { Plugin } from 'vite';

export interface VitePluginRestartOptions {
	/**
	 * Enable glob support for watcher (it's disabled by Vite, but add this plugin will turn it on by default)
	 *
	 * @default true
	 */
	glob?: boolean;
	/**
	 * @default 500
	 */
	delay?: number;
	/**
	 * Array of files to watch, changes to those file will trigger a server restart
	 */
	restart?: string | string[];
	/**
	 * Array of files to watch, changes to those file will trigger a client full page reload
	 */
	reload?: string | string[];
}

let i = 0;

function toArray<T>(arr: T | T[] | undefined): T[] {
	if (!arr) return [];
	if (Array.isArray(arr)) return arr;
	return [arr];
}

export function restart(options: VitePluginRestartOptions = {}): Plugin {
	const { delay = 500, glob: enableGlob = true } = options;

	let root = process.cwd();
	let reloadGlobs: string[] = [];
	let restartGlobs: string[] = [];

	let timerState = 'reload';
	let timer: ReturnType<typeof setTimeout> | undefined;

	function clear() {
		clearTimeout(timer);
	}
	function schedule(fn: () => void) {
		clear();
		timer = setTimeout(fn, delay);
	}

	return {
		name: `vite-plugin-restart:${i++}`,
		apply: 'serve',
		config(c) {
			if (!enableGlob) return;
			if (!c.server) c.server = {};
			if (!c.server.watch) c.server.watch = {};
		},
		configResolved(config) {
			// Chuẩn hóa root: Windows dùng backslash → chuyển sang / để micromatch match đúng
			root = config.root.replace(/\\/g, '/');

			restartGlobs = toArray(options.restart).map((i) =>
				path.posix.join(root, i)
			);
			reloadGlobs = toArray(options.reload).map((i) =>
				path.posix.join(root, i)
			);
		},
		configureServer(server) {
			server.watcher.add([...restartGlobs, ...reloadGlobs]);
			server.watcher.on('add', handleFileChange);
			server.watcher.on('change', handleFileChange);
			server.watcher.on('unlink', handleFileChange);

			function handleFileChange(file: string) {
				// Windows: chuẩn hóa path để micromatch match đúng
				const fileNorm = file.replace(/\\/g, '/');
				if (micromatch.isMatch(fileNorm, restartGlobs)) {
					timerState = 'restart';
					console.log('File changed, scheduling restart:', file);
					schedule(() => {
						server.restart();
					});
				} else if (
					micromatch.isMatch(fileNorm, reloadGlobs) &&
					timerState !== 'restart'
				) {
					timerState = 'reload';
					const rel = path.relative(path.resolve(root), file);
					console.log('[Vite] File changed → reload trang:', rel || file);
					schedule(() => {
						server.ws.send({ type: 'full-reload' });
						timerState = '';
					});
				}
			}
		},
	};
}
