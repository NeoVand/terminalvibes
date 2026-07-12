import { HOME, ShellEngine, type VfsNode } from './shell-engine';

/**
 * Snapshot the sandbox filesystem (rooted at ~) into a plain tree for
 * FsTreeView.svelte — the live panel beside the playground terminal.
 * Replaces the old mermaid-based renderer: a real component gives us
 * proper icons, indent guides and a readable layout at any size.
 */

export interface FsTreeNode {
	name: string;
	kind: 'dir' | 'file';
	executable: boolean;
	dotfile: boolean;
	/** The learner's current working directory. */
	isCwd: boolean;
	/** An ancestor of the cwd — the visible trail from ~ down to it. */
	onCwdPath: boolean;
	children?: FsTreeNode[];
	/** When a directory's listing was capped: how many entries were hidden. */
	hidden?: number;
}

/** Per-directory cap keeps pathological trees scannable in the panel. */
const MAX_CHILDREN = 14;

export function snapshotFsTree(engine: ShellEngine): FsTreeNode {
	const cwd = engine.cwd;

	const build = (path: string, node: VfsNode): FsTreeNode => {
		const name = path === HOME ? '~' : node.name;
		if (node.kind === 'file') {
			return {
				name,
				kind: 'file',
				executable: node.executable,
				dotfile: node.name.startsWith('.'),
				isCwd: false,
				onCwdPath: false
			};
		}
		const entries = [...node.children.keys()].sort((a, b) => {
			// Directories first, then files; dotfiles last within each group —
			// mirrors how learners scan the tree, not raw byte order.
			const na = node.children.get(a)!;
			const nb = node.children.get(b)!;
			if ((na.kind === 'dir') !== (nb.kind === 'dir')) return na.kind === 'dir' ? -1 : 1;
			if (a.startsWith('.') !== b.startsWith('.')) return a.startsWith('.') ? 1 : -1;
			return a.localeCompare(b);
		});
		const shown = entries.slice(0, MAX_CHILDREN);
		const children = shown.map((childName) => {
			const childPath = path === '/' ? `/${childName}` : `${path}/${childName}`;
			return build(childPath, node.children.get(childName)!);
		});
		return {
			name,
			kind: 'dir',
			executable: false,
			dotfile: node.name.startsWith('.'),
			isCwd: path === cwd,
			onCwdPath: path !== cwd && (cwd === path || cwd.startsWith(path === '/' ? '/' : path + '/')),
			children,
			hidden: entries.length > MAX_CHILDREN ? entries.length - MAX_CHILDREN : undefined
		};
	};

	const root = engine.getNode(HOME);
	if (!root) {
		return {
			name: '~',
			kind: 'dir',
			executable: false,
			dotfile: false,
			isCwd: cwd === HOME,
			onCwdPath: false,
			children: []
		};
	}
	return build(HOME, root);
}
