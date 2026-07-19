import {
	AtSign,
	BookOpen,
	Bot,
	Braces,
	Cog,
	Compass,
	Copy,
	Eye,
	FileCode2,
	FileSearch,
	FileText,
	FolderPlus,
	FolderTree,
	Gamepad2,
	Gauge,
	Hash,
	HelpCircle,
	History,
	KeyRound,
	Laptop,
	Layout,
	Library,
	ListOrdered,
	Lock,
	MapPin,
	Monitor,
	MoveRight,
	Palette,
	Rocket,
	Route,
	ScrollText,
	Search,
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
}

export interface NavSection extends NavItem {
	children?: NavItem[];
}

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
			{ id: 'help-lookup', label: 'Read the Manual First', icon: Gamepad2, isPlayground: true }
		]
	},
	{
		id: 'part-2',
		label: 'Moving Around',
		icon: Compass,
		children: [
			{ id: 'section-2-1', label: 'Where Am I?', icon: MapPin },
			{ id: 'section-2-2', label: 'Paths', icon: Route },
			{ id: 'section-2-3', label: 'Changing Directories', icon: MoveRight },
			{ id: 'navigation', label: 'Find the Lost API Key', icon: Gamepad2, isPlayground: true },
			{ id: 'quoting', label: 'Mind the Gap', icon: Gamepad2, isPlayground: true },
			{ id: 'section-2-4', label: 'Making Things', icon: FolderPlus },
			{ id: 'section-2-5', label: 'Looking Inside Files', icon: Eye },
			{ id: 'workspace-setup', label: 'Build Your Workspace', icon: Gamepad2, isPlayground: true }
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
			{ id: 'glob-practice', label: 'Select the Right Files', icon: Gamepad2, isPlayground: true }
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
			{ id: 'find-files', label: 'Hunt Down Every TODO', icon: Gamepad2, isPlayground: true }
		]
	},
	{
		id: 'part-5',
		label: 'Permissions & Environment',
		icon: Shield,
		children: [
			{ id: 'section-5-1', label: 'Reading ls -l', icon: ScrollText },
			{ id: 'section-5-2', label: 'chmod', icon: KeyRound },
			{ id: 'fix-permissions', label: "The Script Won't Run", icon: Gamepad2, isPlayground: true },
			{ id: 'section-5-3', label: 'sudo', icon: Lock },
			{ id: 'section-5-4', label: 'Environment Variables', icon: AtSign },
			{ id: 'path-repair', label: 'command not found', icon: Gamepad2, isPlayground: true },
			{ id: 'section-5-5', label: 'Your Shell Config', icon: FileText },
			{ id: 'alias-workshop', label: 'Make Your Shortcuts', icon: Gamepad2, isPlayground: true }
		]
	},
	{
		id: 'part-6',
		label: 'Terminal for the AI Era',
		icon: Bot,
		children: [
			{ id: 'section-6-1', label: 'Read Before You Run', icon: ShieldAlert },
			{ id: 'audit-the-agent', label: 'Audit the Agent', icon: Gamepad2, isPlayground: true },
			{ id: 'section-6-2', label: 'Your First Script', icon: FileCode2 },
			{ id: 'first-script', label: 'Automate the Backup', icon: Gamepad2, isPlayground: true },
			{ id: 'script-args', label: 'One Script, Any Folder', icon: Gamepad2, isPlayground: true },
			{ id: 'section-6-3', label: 'Exit Codes & Chaining', icon: Braces },
			{ id: 'exit-codes', label: 'Deploy Only on Green', icon: Gamepad2, isPlayground: true }
		]
	},
	{
		id: 'part-11',
		label: 'Your Cockpit',
		icon: Gauge,
		children: [
			{ id: 'section-11-1', label: 'Make It Yours', icon: Palette },
			{ id: 'prompt-designer', label: 'Design Your Prompt', icon: Wand2 },
			{ id: 'section-11-2', label: 'History Superpowers', icon: History },
			{ id: 'history-recall', label: 'Retrace Your Steps', icon: Gamepad2, isPlayground: true },
			{ id: 'section-11-3', label: 'Terminal in VS Code', icon: Layout },
			{ id: 'section-11-4', label: 'Many Terminals at Once', icon: SplitSquareHorizontal }
		]
	},
	{
		id: 'part-12',
		label: 'Under the Hood',
		icon: Cog,
		children: [
			{ id: 'section-12-1', label: 'How the Terminal Works', icon: Wrench },
			{ id: 'section-12-2', label: 'The Terminal, Evolving', icon: Sprout }
		]
	},
	{
		id: 'part-13',
		label: 'Conclusion',
		icon: BookOpen,
		children: [
			{ id: 'section-13-1', label: 'The Command-Line Mindset', icon: Wand2 },
			{ id: 'section-13-2', label: 'Quick Reference', icon: Table },
			{ id: 'section-13-3', label: 'Final Challenge', icon: Trophy },
			{ id: 'capstone', label: 'One Messy Home Folder', icon: Gamepad2, isPlayground: true },
			{ id: 'section-13-4', label: 'Keep Learning', icon: Library }
		]
	}
];
