/** Open optional explanations before measuring or focusing a linked section. */
export function revealAnchor(id: string): HTMLElement | null {
	const target = document.getElementById(id);
	if (!target) return null;
	for (let node: HTMLElement | null = target; node; node = node.parentElement) {
		if (node instanceof HTMLDetailsElement) node.open = true;
	}
	return target;
}

/** Keep keyboard navigation at the lesson reached through a menu or search. */
export function focusAnchor(target: HTMLElement) {
	if (!target.hasAttribute('tabindex')) {
		target.setAttribute('tabindex', '-1');
		target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
	}
	target.focus({ preventScroll: true });
}
