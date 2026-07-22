import {
	Anchor,
	AtSign,
	Ban,
	BookOpen,
	Boxes,
	Bot,
	Braces,
	Cog,
	Columns3,
	Compass,
	Cpu,
	DoorOpen,
	Copy,
	Eye,
	FileCode2,
	FileSearch,
	FileText,
	FolderPlus,
	FolderTree,
	Gamepad2,
	Gauge,
	Globe,
	HardDrive,
	Hash,
	HelpCircle,
	History,
	Home,
	KeyRound,
	Laptop,
	Layers,
	Layout,
	Library,
	Link2,
	ListOrdered,
	ListTree,
	Lock,
	MapPin,
	Monitor,
	MoveRight,
	Package,
	Palette,
	PenLine,
	Puzzle,
	Replace,
	Rocket,
	Route,
	Scissors,
	ScrollText,
	Search,
	Send,
	Shield,
	ShieldAlert,
	Sparkles,
	SplitSquareHorizontal,
	Sprout,
	Table,
	Terminal,
	Trash2,
	Trophy,
	Wand2,
	Workflow,
	Wrench
} from 'lucide-svelte';

export interface NavItem {
	id: string;
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any;
	isPlayground?: boolean;
	/**
	 * The graded counterpart of a playground — one per Part, always the last
	 * child. Rendered in the challenge earth-red with `Puzzle`, and, like
	 * `isPlayground`, in the smaller activity type size.
	 */
	isChallenge?: boolean;
}

/** Both flags mean "an activity, not prose", which is what the row styling keys on. */
export function isActivity(item: NavItem): boolean {
	return Boolean(item.isPlayground || item.isChallenge);
}

/**
 * The two kinds of hands-on activity. It lives here, next to the flags it
 * mirrors, so the sidebar row and the activity card name the same two things
 * from one definition rather than each declaring its own string union.
 */
export type ActivityKind = 'playground' | 'challenge';

/**
 * Challenge anchors are `ch-<part>-<slug>` (see challenges.ts). This is the
 * fallback for callers that render a card without saying which kind it is —
 * the explicit `kind` prop always wins, and importing challenges.ts here just
 * to test membership would pull all fourteen sandbox seeds into the nav
 * bundle.
 */
export function activityKindOf(id: string): ActivityKind {
	return /^ch-\d+-/.test(id) ? 'challenge' : 'playground';
}

export interface NavSection extends NavItem {
	children?: NavItem[];
}

/* ── the fourteen challenge rows ──────────────────────────────────────────
   One challenge closes each Part (src/lib/playground/challenges.ts owns the
   ids and the order), so each is the LAST child of its part-N below, flagged
   `isChallenge: true` with lucide's `Puzzle`. Row rendering already handles
   them — see activityColor() in Sidebar.svelte.

   Both ends are wired: every id here is in `challengeAnchorIds`
   (src/lib/data/sections.ts) and is rendered on the page by a
   <ChallengeActivity>, which puts the anchor in the DOM. That pairing is what
   keys.test.ts > "every sidebar target is a real anchor id" exists to protect:
   `scrollTo` looks the id up with getElementById and silently does nothing
   when it is absent, so a row without an anchor looks live and goes nowhere —
   exactly how `section-11-2` outlived a reorder.

   Labels are display copy, not `Challenge.title` verbatim: they must fit the
   expanded row's text cell (~175px at 12px) and stay unique in this index.
   Four are deliberately reworded — ch-1 would have collided with the
   section-11-1 row, ch-8 with ch-3's, and ch-2 and ch-13 were too long to
   fit. The card headings in the Part components use the same strings, so the
   TOC and the page agree on what each challenge is called. */

export const sidebarNav: NavSection[] = [
	{
		id: 'hero',
		label: 'Introduction',
		icon: Rocket,
		children: [
			{ id: 'section-intro-what', label: 'What Is the Terminal?', icon: HelpCircle },
			{ id: 'section-intro-history', label: 'A Brief History', icon: History },
			{ id: 'section-intro-shells', label: "Your Machine's Terminal", icon: Laptop },
			{ id: 'section-intro-anatomy', label: 'Anatomy of a Prompt', icon: Terminal }
		]
	},
	{
		id: 'part-1',
		label: 'First Contact',
		icon: Terminal,
		children: [
			{ id: 'section-1-1', label: 'Opening Your Terminal', icon: Monitor },
			{ id: 'section-1-2', label: 'Your First Commands', icon: Sparkles },
			{ id: 'first-steps', label: 'Say Hello to the Machine', icon: Gamepad2, isPlayground: true },
			{ id: 'section-1-3', label: 'Getting Help', icon: HelpCircle },
			{ id: 'help-lookup', label: 'Read the Manual First', icon: Gamepad2, isPlayground: true },
			{ id: 'ch-1-read-the-flags', label: 'Look It Up First', icon: Puzzle, isChallenge: true }
		]
	},
	{
		id: 'part-2',
		label: 'Moving Around',
		icon: Compass,
		children: [
			{ id: 'section-2-1', label: 'Where Am I?', icon: MapPin },
			{ id: 'section-2-2', label: 'Paths', icon: Route },
			{ id: 'quoting', label: 'Mind the Gap', icon: Gamepad2, isPlayground: true },
			{ id: 'section-2-3', label: 'Changing Directories', icon: MoveRight },
			{ id: 'navigation', label: 'Find the Lost API Key', icon: Gamepad2, isPlayground: true },
			{ id: 'section-2-4', label: 'Making Things', icon: FolderPlus },
			{ id: 'section-2-5', label: 'Looking Inside Files', icon: Eye },
			{ id: 'workspace-setup', label: 'Build Your Workspace', icon: Gamepad2, isPlayground: true },
			{ id: 'ch-2-scaffold', label: 'Scaffold It From Here', icon: Puzzle, isChallenge: true }
		]
	},
	{
		id: 'part-3',
		label: 'Copy, Move, Delete',
		icon: FolderTree,
		children: [
			{ id: 'section-3-1', label: 'Copying', icon: Copy },
			{ id: 'section-3-2', label: 'Moving & Renaming', icon: MoveRight },
			{ id: 'section-3-3', label: 'Deleting (Carefully)', icon: Trash2 },
			{ id: 'tidy-up', label: 'Clean the Downloads Mess', icon: Gamepad2, isPlayground: true },
			{ id: 'section-3-4', label: 'Wildcards', icon: Hash },
			{ id: 'glob-practice', label: 'Select the Right Files', icon: Gamepad2, isPlayground: true },
			{
				id: 'ch-3-after-the-agent',
				label: 'Clean Up After the Agent',
				icon: Puzzle,
				isChallenge: true
			}
		]
	},
	{
		id: 'part-4',
		label: 'Text & Pipes',
		icon: Workflow,
		children: [
			{ id: 'section-4-1', label: 'Redirection', icon: MoveRight },
			{ id: 'capture-errors', label: 'Catch the Red Text', icon: Gamepad2, isPlayground: true },
			{ id: 'section-4-2', label: 'Pipes', icon: Workflow },
			{ id: 'section-4-3', label: 'Searching Text', icon: Search },
			{ id: 'log-detective', label: 'Find the Crash', icon: Gamepad2, isPlayground: true },
			{ id: 'section-4-4', label: 'Counting & Shaping', icon: ListOrdered },
			{ id: 'count-lines', label: 'Count Before You Fix', icon: Gamepad2, isPlayground: true },
			{ id: 'pipeline-practice', label: 'Build a Pipeline', icon: Gamepad2, isPlayground: true },
			{ id: 'section-4-5', label: 'Finding Files', icon: FileSearch },
			{ id: 'find-files', label: 'Hunt Down Every TODO', icon: Gamepad2, isPlayground: true },
			{
				id: 'ch-4-top-visitors',
				label: 'Who Is Actually Visiting?',
				icon: Puzzle,
				isChallenge: true
			}
		]
	},
	{
		id: 'part-5',
		label: 'Permissions & Config',
		icon: Shield,
		children: [
			{ id: 'section-5-1', label: 'Reading ls -l', icon: ScrollText },
			{ id: 'section-5-2', label: 'chmod', icon: KeyRound },
			{ id: 'fix-permissions', label: "The Script Won't Run", icon: Gamepad2, isPlayground: true },
			{ id: 'section-5-3', label: 'sudo', icon: Lock },
			{ id: 'section-5-4', label: 'Environment Variables', icon: AtSign },
			{ id: 'path-repair', label: 'command not found', icon: Gamepad2, isPlayground: true },
			{ id: 'section-5-5', label: 'Your Shell Config', icon: FileText },
			{ id: 'alias-workshop', label: 'Make Your Shortcuts', icon: Gamepad2, isPlayground: true },
			{
				id: 'ch-5-deploy-kit',
				label: 'Nothing in the Kit Will Run',
				icon: Puzzle,
				isChallenge: true
			}
		]
	},
	{
		id: 'part-6',
		label: 'Scripts & Automation',
		icon: FileCode2,
		children: [
			{ id: 'section-6-1', label: 'Your First Script', icon: FileCode2 },
			{ id: 'first-script', label: 'Automate the Backup', icon: Gamepad2, isPlayground: true },
			{ id: 'script-args', label: 'One Script, Any Folder', icon: Gamepad2, isPlayground: true },
			{ id: 'section-6-2', label: 'Exit Codes & Chaining', icon: Braces },
			{ id: 'exit-codes', label: 'Deploy Only on Green', icon: Gamepad2, isPlayground: true },
			{ id: 'ch-6-ship-all-three', label: 'Ship All Three', icon: Puzzle, isChallenge: true }
		]
	},
	{
		id: 'part-7',
		label: 'Text Surgery',
		icon: Scissors,
		children: [
			{ id: 'section-7-1', label: 'Find & Replace', icon: Replace },
			{ id: 'sed-rename', label: 'Rebrand the Menu', icon: Gamepad2, isPlayground: true },
			{ id: 'section-7-2', label: 'Line Surgery', icon: Scissors },
			{ id: 'log-surgery', label: 'Silence the Debug Noise', icon: Gamepad2, isPlayground: true },
			{ id: 'section-7-3', label: 'Editing in Place', icon: PenLine },
			{ id: 'in-place-audit', label: "The Agent's Mass Edit", icon: Gamepad2, isPlayground: true },
			{ id: 'section-7-4', label: 'Columns & awk', icon: Columns3 },
			{ id: 'column-pull', label: 'Pull the Column', icon: Gamepad2, isPlayground: true },
			{ id: 'ch-7-promote-the-stack', label: 'Promote the Stack', icon: Puzzle, isChallenge: true }
		]
	},
	{
		id: 'part-8',
		label: 'Processes & Ports',
		icon: Cpu,
		children: [
			{ id: 'section-8-1', label: 'Everything Is a Process', icon: ListTree },
			{ id: 'section-8-2', label: 'Stopping Things', icon: Ban },
			{ id: 'runaway-process', label: 'Stop the Runaway', icon: Gamepad2, isPlayground: true },
			{ id: 'section-8-3', label: "Who's on Port 3000?", icon: Anchor },
			{ id: 'free-the-port', label: 'Free Port 3000', icon: Gamepad2, isPlayground: true },
			{ id: 'section-8-4', label: 'Background & Foreground', icon: Layers },
			{ id: 'backstage-jobs', label: 'Two Things at Once', icon: Gamepad2, isPlayground: true },
			{
				id: 'ch-8-agent-cleanup',
				label: "Clear the Agent's Processes",
				icon: Puzzle,
				isChallenge: true
			}
		]
	},
	{
		id: 'part-9',
		label: 'Talking to the Network',
		icon: Globe,
		children: [
			{ id: 'section-9-1', label: 'What Is localhost?', icon: Home },
			{ id: 'section-9-2', label: 'curl — Ask the Network', icon: Send },
			{ id: 'health-check', label: 'Is It Alive?', icon: Gamepad2, isPlayground: true },
			{ id: 'section-9-3', label: 'Reading JSON', icon: Braces },
			{ id: 'api-detective', label: 'Question the API', icon: Gamepad2, isPlayground: true },
			{ id: 'section-9-4', label: 'Keys & Secrets', icon: KeyRound },
			{ id: 'secret-keeper', label: 'Keep the Key Secret', icon: Gamepad2, isPlayground: true },
			{ id: 'section-9-5', label: 'A Door to Another Machine', icon: DoorOpen },
			{ id: 'ch-9-prove-the-release', label: 'Prove the Release', icon: Puzzle, isChallenge: true }
		]
	},
	{
		id: 'part-10',
		label: 'The Toolshed',
		icon: Package,
		children: [
			{ id: 'section-10-1', label: 'Package Managers', icon: Package },
			{ id: 'summon-a-tool', label: 'Install a Tool', icon: Gamepad2, isPlayground: true },
			{ id: 'section-10-2', label: 'Archives — tar & zip', icon: Boxes },
			{ id: 'open-the-crate', label: 'Peek, Then Unpack', icon: Gamepad2, isPlayground: true },
			{ id: 'section-10-3', label: 'Links & Where Things Live', icon: Link2 },
			{ id: 'section-10-4', label: 'Disk Detective', icon: HardDrive },
			{ id: 'space-hog', label: 'Find the Space Hog', icon: Gamepad2, isPlayground: true },
			{
				id: 'ch-10-handover',
				label: 'Hand It Over, Not the Bloat',
				icon: Puzzle,
				isChallenge: true
			}
		]
	},
	{
		id: 'part-11',
		label: 'Terminal for the AI Era',
		icon: Bot,
		children: [
			{ id: 'section-11-1', label: 'Read Before You Run', icon: ShieldAlert },
			{ id: 'audit-the-agent', label: 'Audit the Agent', icon: Gamepad2, isPlayground: true },
			{
				id: 'ch-11-approve-the-plan',
				label: 'Approve the Release Plan',
				icon: Puzzle,
				isChallenge: true
			}
		]
	},
	{
		id: 'part-12',
		label: 'Your Cockpit',
		icon: Gauge,
		children: [
			{ id: 'section-12-1', label: 'Make It Yours', icon: Palette },
			{ id: 'prompt-designer', label: 'Design Your Prompt', icon: Wand2 },
			{ id: 'section-12-2', label: 'History Superpowers', icon: History },
			{ id: 'history-recall', label: 'Retrace Your Steps', icon: Gamepad2, isPlayground: true },
			{ id: 'section-12-3', label: 'Terminal in VS Code', icon: Layout },
			{ id: 'section-12-4', label: 'Many Terminals at Once', icon: SplitSquareHorizontal },
			{ id: 'ch-12-handover', label: 'Hand Over the Cockpit', icon: Puzzle, isChallenge: true }
		]
	},
	{
		id: 'part-13',
		label: 'Under the Hood',
		icon: Cog,
		children: [
			{ id: 'section-13-1', label: 'How the Terminal Works', icon: Wrench },
			{ id: 'section-13-2', label: 'The Terminal, Evolving', icon: Sprout },
			{
				id: 'ch-13-exit-codes',
				label: 'What the Transcript Knows',
				icon: Puzzle,
				isChallenge: true
			}
		]
	},
	{
		id: 'part-14',
		label: 'Conclusion',
		icon: BookOpen,
		children: [
			{ id: 'section-14-1', label: 'The Command-Line Mindset', icon: Wand2 },
			{ id: 'section-14-2', label: 'Quick Reference', icon: Table },
			{ id: 'section-14-3', label: 'Final Challenge', icon: Trophy },
			{ id: 'capstone', label: 'One Messy Home Folder', icon: Gamepad2, isPlayground: true },
			// Sits between the two capstones on the page, and must be listed here:
			// the sidebar row is the only route to it, so without one the
			// "n/35 exercises" counter could never reach 35.
			{ id: 'midnight-deploy', label: 'The Midnight Deploy', icon: Gamepad2, isPlayground: true },
			{ id: 'section-14-4', label: 'Keep Learning', icon: Library },
			{
				id: 'ch-14-desk-clear',
				label: 'Clear the Desk for the Demo',
				icon: Puzzle,
				isChallenge: true
			}
		]
	}
];

/* ── anchor lookup ────────────────────────────────────────────────── */

export interface NavEntry {
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any;
}

const byId = new Map<string, NavEntry>();
for (const section of sidebarNav) {
	byId.set(section.id, { label: section.label, icon: section.icon });
	for (const child of section.children ?? []) {
		byId.set(child.id, { label: child.label, icon: child.icon });
	}
}

/**
 * Label + icon for any part or section anchor. Cross-references in the prose
 * resolve through this, so renaming a part in the sidebar renames it
 * everywhere it is mentioned.
 */
export function courseEntry(id: string): NavEntry | null {
	return byId.get(id) ?? null;
}

const partOf = new Map<string, string>();
for (const section of sidebarNav) {
	partOf.set(section.id, section.id);
	for (const child of section.children ?? []) {
		partOf.set(child.id, section.id);
	}
}

/**
 * The `part-N` (or `hero`) section that owns an anchor. The standalone
 * /parts/<slug> pages use this to decide whether a cross-reference stays a
 * same-page hash or must travel back to the full course page.
 */
export function partIdOf(id: string): string | null {
	return partOf.get(id) ?? null;
}
