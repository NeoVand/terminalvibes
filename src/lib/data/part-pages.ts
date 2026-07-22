import manifest from './timeline-manifest.json';

/**
 * The standalone /parts/<slug> pages — one prerendered, crawlable URL per
 * part. The single-page course at / stays the canonical reading experience;
 * these exist so each part has a shareable link, its own title/description,
 * and its own social card. Slugs are semantic (they are the marketing
 * surface); ids are the same `part-N` anchors the rest of the app uses.
 */
export interface PartPage {
	/** Anchor id on the main page, e.g. `part-7` */
	id: string;
	/** URL slug under /parts/ */
	slug: string;
	/** Full display title, matching the part's SectionHeader */
	title: string;
	/** Meta/OG description, written for search results (~150 chars) */
	description: string;
}

export const SITE_URL = 'https://neovand.github.io/terminalvibes';

export const partPages: PartPage[] = [
	{
		id: 'part-1',
		slug: 'first-contact',
		title: 'First Contact',
		description:
			'Open a terminal on macOS, Linux, or Windows, run your first commands, and learn to look any command up before you trust it — nothing here can break your machine.'
	},
	{
		id: 'part-2',
		slug: 'moving-around',
		title: 'Moving Around: Your Mental Map of the Machine',
		description:
			'pwd, ls, and cd — read paths like addresses, move through the filesystem freely, create files and folders, and peek inside them without an editor.'
	},
	{
		id: 'part-3',
		slug: 'copy-move-delete',
		title: 'Copy, Move, Delete — and the Habits That Keep You Safe',
		description:
			'cp, mv, rm, and wildcards — the fast tools that have no undo, and the look-before-you-act habits that make them safe: ls first, echo the glob, then commit.'
	},
	{
		id: 'part-4',
		slug: 'text-and-pipes',
		title: 'Text & Pipes: How Small Tools Combine',
		description:
			'Redirection, pipes, grep, sort, uniq, cut, and find — compose small tools into pipelines that search, count, and reshape any text on your machine.'
	},
	{
		id: 'part-5',
		slug: 'permissions-and-environment',
		title: 'Permissions & Environment: How the Machine Decides',
		description:
			'Decode ls -l, fix "Permission denied" with chmod, use sudo with respect, and demystify "command not found" with PATH, which, and your shell config.'
	},
	{
		id: 'part-6',
		slug: 'scripts-and-automation',
		title: 'Scripts & Automation: Teach the Machine Your Routine',
		description:
			'Turn commands you type into scripts you keep: shebangs, chmod +x, arguments, exit codes, and the && / || chains that decide what runs next.'
	},
	{
		id: 'part-7',
		slug: 'text-surgery',
		title: 'Text Surgery: Find, Change, Extract',
		description:
			'sed and awk without the mystery — find-and-replace on streams, drop and print lines by address, pull columns from any table, and edit files in place safely.'
	},
	{
		id: 'part-8',
		slug: 'processes-and-ports',
		title: "Processes & Ports: When Things Won't Stop",
		description:
			'ps, kill, lsof, and job control — see what is running, stop it politely (then firmly), and fix "port already in use" in ten seconds instead of a reboot.'
	},
	{
		id: 'part-9',
		slug: 'talking-to-the-network',
		title: 'Talking to the Network',
		description:
			'localhost, curl, jq, API keys, and ssh — check a server yourself instead of trusting a claim, read JSON replies, and keep your secrets out of shell history.'
	},
	{
		id: 'part-10',
		slug: 'the-toolshed',
		title: 'The Toolshed: Getting, Unpacking, Finding',
		description:
			'Package managers, tar and zip, symlinks, and du — install new tools, open what arrives, follow the arrows to where things live, and find what eats your disk.'
	},
	{
		id: 'part-11',
		slug: 'terminal-for-the-ai-era',
		title: 'Terminal for the AI Era: Read, Verify, Run',
		description:
			'The skill the whole course builds to: audit any AI-proposed command before you approve it — the four-step routine, the red-flag list, and real incidents.'
	},
	{
		id: 'part-12',
		slug: 'your-cockpit',
		title: 'Your Cockpit: Making the Terminal a Place You Like',
		description:
			'Themes, fonts, and prompts worth living in — plus history superpowers (Ctrl+R, !!), the VS Code integrated terminal, and running many terminals at once.'
	},
	{
		id: 'part-13',
		slug: 'under-the-hood',
		title: "Under the Hood: The Machine You've Been Driving",
		description:
			'TTYs, PTYs, escape sequences, and signals — how the terminal actually works, what Ctrl+C really does, and the protocols AI agents use to read your shell.'
	},
	{
		id: 'part-14',
		slug: 'conclusion',
		title: 'Conclusion: The Terminal Is Yours Now',
		description:
			'The command-line mindset, a dense quick-reference card, two final challenges, an honest skill checklist, and the references worth knowing by name.'
	}
];

const bySlug = new Map(partPages.map((p) => [p.slug, p]));
const byId = new Map(partPages.map((p) => [p.id, p]));

export function partPageBySlug(slug: string): PartPage | null {
	return bySlug.get(slug) ?? null;
}

export function partPageById(id: string): PartPage | null {
	return byId.get(id) ?? null;
}

/** Banner image filename for a part, from the timeline manifest. */
export function partImage(id: string): string | null {
	const item = (manifest as { id: string; image?: string }[]).find((it) => it.id === id);
	return item?.image ?? null;
}
