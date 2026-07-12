import { HOME, ShellEngine, type VfsNode } from './shell-engine';

/**
 * Render the sandbox filesystem as a mermaid flowchart, rooted at ~.
 * Directories are rounded nodes, files are rectangles, the current working
 * directory is highlighted. Replaces GitVibes' commit-graph panel.
 */

const MAX_NODES = 60;

function label(node: VfsNode, isCwd: boolean): string {
	if (node.kind === 'dir') {
		return `${isCwd ? '📂' : '📁'} ${node.name}`;
	}
	if (node.executable) return `⚙️ ${node.name}`;
	if (node.name.startsWith('.')) return `👻 ${node.name}`;
	return `📄 ${node.name}`;
}

function esc(text: string): string {
	// Mermaid labels are quoted; strip characters that would break out.
	return text.replace(/["`]/g, "'");
}

export function buildFsTree(engine: ShellEngine): string {
	const lines: string[] = ['flowchart TD'];
	const cwd = engine.cwd;
	let counter = 0;
	let truncated = false;

	const ids = new Map<string, string>();
	const nodeId = (path: string) => {
		let id = ids.get(path);
		if (!id) {
			id = `n${counter++}`;
			ids.set(path, id);
		}
		return id;
	};

	const rootNode = engine.getNode(HOME);
	if (!rootNode) {
		return 'flowchart TD\n  n0(["🏠 ~"])';
	}

	const emit = (path: string, node: VfsNode, parentId: string | null) => {
		if (counter >= MAX_NODES) {
			truncated = true;
			return;
		}
		const id = nodeId(path);
		const isCwd = node.kind === 'dir' && path === cwd;
		const name = path === HOME ? `🏠 ~${isCwd ? ' (you)' : ''}` : esc(label(node, isCwd));
		const text = isCwd && path !== HOME ? `${name} ⬅` : name;
		if (node.kind === 'dir') {
			lines.push(`  ${id}(["${text}"])`);
		} else {
			lines.push(`  ${id}["${text}"]`);
		}
		if (isCwd) lines.push(`  class ${id} cwdNode`);
		if (parentId) lines.push(`  ${parentId} --- ${id}`);
		if (node.kind === 'dir') {
			for (const childName of [...node.children.keys()].sort((a, b) => a.localeCompare(b))) {
				const child = node.children.get(childName)!;
				emit(path === '/' ? `/${childName}` : `${path}/${childName}`, child, id);
			}
		}
	};

	emit(HOME, rootNode, null);

	if (truncated) {
		lines.push(`  trunc["… more files"]`);
	}

	// Theme-safe highlight: a translucent green tint reads on both light and
	// dark backgrounds; concrete hexes are unavoidable inside mermaid defs.
	lines.push('  classDef cwdNode fill:#4ade8030,stroke:#22c55e,stroke-width:2px;');
	return lines.join('\n');
}
