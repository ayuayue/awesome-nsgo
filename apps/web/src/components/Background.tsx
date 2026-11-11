import { useEffect } from 'react';

// The page's backdrop in the black-and-white look is the plain page colour: no colour fields or streaks. What stays is the pointer spotlight on `.spot` tiles, which reads the pointer's position relative to the tile under it.
export function Background() {
	useEffect(() => {
		const onMove = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse' || !(e.target instanceof Element)) return;
			const el = e.target.closest<HTMLElement>('.spot');
			if (!el) return;
			const r = el.getBoundingClientRect();
			el.style.setProperty('--mx', `${e.clientX - r.left}px`);
			el.style.setProperty('--my', `${e.clientY - r.top}px`);
		};
		document.addEventListener('pointermove', onMove, { passive: true });
		return () => document.removeEventListener('pointermove', onMove);
	}, []);
	return null;
}
