import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';

// The home hero's platform name, drawn by a few thousand dots that scatter and regather into the next name every few seconds; the pointer pushes them aside. It is decoration (aria-hidden): the headline carries the platform names as text for screen readers, and the platform chips under it say the same.
//
// The dots take the canvas's own `color` for ink and a lighter mix of it for a share of them, so the word follows the light or dark scheme. The words are drawn with the headline's font (`font` prop, a CSS font-family list). Off screen or in a hidden tab the loop does no work; with reduced motion the word is drawn once, settled, and does not change.
interface Dot {
	x: number;
	y: number;
	vx: number;
	vy: number;
	tx: number;
	ty: number;
	s: number;
	r: number;
}

export function ParticleWord({ words, font, interval = 3000, onWord, className }: { words: readonly string[]; font: string; interval?: number; onWord?: (i: number) => void; className?: string }) {
	const ref = useRef<HTMLCanvasElement>(null);
	const onWordRef = useRef(onWord);
	onWordRef.current = onWord;

	useEffect(() => {
		const cv = ref.current;
		if (!cv || words.length === 0) return;
		const ctx = cv.getContext('2d');
		if (!ctx) return;
		const reduce = prefersReducedMotion();
		let dots: Dot[] = [];
		let targets: [number, number][][] = [];
		let wi = 0;
		let W = 0;
		let H = 0;
		let raf = 0;
		let timer = 0;
		let visible = true;
		let dead = false;
		let ink = '#0a0a0a';
		let soft = '#bdbdbd';
		const mouse = { x: -9999, y: -9999 };

		const readColors = () => {
			const c = getComputedStyle(cv).color;
			ink = c;
			const m = c.match(/[\d.]+/g);
			soft = m && m.length >= 3 ? `rgba(${m[0]}, ${m[1]}, ${m[2]}, 0.3)` : c;
		};

		const sample = (word: string): [number, number][] => {
			const oc = document.createElement('canvas');
			oc.width = W;
			oc.height = H;
			const o = oc.getContext('2d');
			if (!o) return [[W / 2, H / 2]];
			const wide = /[^\x00-\x7f]/.test(word);
			// Sized to the height, or to the width with a margin either side, whichever is smaller; wide (CJK) glyphs take about one em each, Latin about two thirds.
			const fs = Math.min(H * 0.86, (W * 0.92) / (word.length * (wide ? 1.08 : 0.68)));
			o.font = `700 ${fs}px ${font}`;
			o.textAlign = 'center';
			o.textBaseline = 'middle';
			o.fillStyle = '#000';
			o.fillText(word, W / 2, H / 2 + fs * 0.05);
			const d = o.getImageData(0, 0, W, H).data;
			const g = gap();
			const pts: [number, number][] = [];
			for (let y = 0; y < H; y += g) for (let x = 0; x < W; x += g) if (d[(y * W + x) * 4 + 3] > 140) pts.push([x, y]);
			for (let i = pts.length - 1; i > 0; i--) {
				const j = (Math.random() * (i + 1)) | 0;
				[pts[i], pts[j]] = [pts[j], pts[i]];
			}
			return pts.length ? pts : [[W / 2, H / 2]];
		};
		const gap = () => (W < 700 ? 4 : 5);

		const assign = (burst: boolean) => {
			const t = targets[wi];
			for (let i = 0; i < dots.length; i++) {
				const p = dots[i];
				const q = t[i % t.length];
				const extra = i >= t.length;
				p.tx = q[0] + (extra ? (Math.random() - 0.5) * 2 : 0);
				p.ty = q[1] + (extra ? (Math.random() - 0.5) * 2 : 0);
				if (burst) {
					const a = Math.random() * Math.PI * 2;
					const f = 6 + Math.random() * 22;
					p.vx += Math.cos(a) * f;
					p.vy += Math.sin(a) * f;
				}
			}
		};

		const setup = () => {
			W = Math.max(1, cv.clientWidth);
			H = Math.max(1, cv.clientHeight);
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			cv.width = Math.round(W * dpr);
			cv.height = Math.round(H * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			readColors();
			targets = words.map(sample);
			// Low-end devices get fewer dots: at most a third as many when the browser reports two cores or fewer.
			const cap = (navigator.hardwareConcurrency || 4) <= 2 ? 2400 : 7000;
			const n = Math.min(cap, Math.max(...targets.map((t) => t.length)));
			const g = gap();
			while (dots.length < n) dots.push({ x: W / 2 + (Math.random() - 0.5) * W, y: H / 2 + (Math.random() - 0.5) * H, vx: 0, vy: 0, tx: 0, ty: 0, s: 0, r: Math.random() });
			dots.length = n;
			for (const p of dots) p.s = g * 0.42 + Math.random() * g * 0.32;
			assign(false);
			if (reduce)
				for (const p of dots) {
					p.x = p.tx;
					p.y = p.ty;
				}
		};

		const draw = (move: boolean) => {
			ctx.clearRect(0, 0, W, H);
			const R = 110;
			const R2 = R * R;
			for (let pass = 0; pass < 2; pass++) {
				ctx.fillStyle = pass === 0 ? ink : soft;
				for (const p of dots) {
					if (p.r < 0.14 !== (pass === 1)) continue;
					if (move) {
						p.vx = (p.vx + (p.tx - p.x) * 0.05) * 0.84;
						p.vy = (p.vy + (p.ty - p.y) * 0.05) * 0.84;
						const dx = p.x - mouse.x;
						const dy = p.y - mouse.y;
						const d2 = dx * dx + dy * dy;
						if (d2 < R2) {
							const d = Math.sqrt(d2) || 1;
							const f = (1 - d / R) * 9;
							p.vx += (dx / d) * f;
							p.vy += (dy / d) * f;
						}
						p.x += p.vx;
						p.y += p.vy;
					}
					const s = p.s + Math.min(1.8, Math.hypot(p.vx, p.vy) * 0.08);
					ctx.beginPath();
					ctx.arc(p.x, p.y, s / 2, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		};

		const loop = () => {
			if (dead) return;
			if (visible && !document.hidden) draw(true);
			raf = requestAnimationFrame(loop);
		};

		const onMove = (e: PointerEvent) => {
			const r = cv.getBoundingClientRect();
			mouse.x = e.clientX - r.left;
			mouse.y = e.clientY - r.top;
		};
		const onLeave = () => {
			mouse.x = -9999;
			mouse.y = -9999;
		};
		let rt = 0;
		const onResize = () => {
			clearTimeout(rt);
			rt = window.setTimeout(() => {
				setup();
				if (reduce) draw(false);
			}, 150);
		};
		const scheme = window.matchMedia('(prefers-color-scheme: dark)');
		const onScheme = () => {
			readColors();
			if (reduce) draw(false);
		};

		const io = new IntersectionObserver((es) => {
			visible = es[0]?.isIntersecting ?? true;
		});

		const start = () => {
			if (dead) return;
			setup();
			io.observe(cv);
			if (reduce) {
				draw(false);
				return;
			}
			raf = requestAnimationFrame(loop);
			timer = window.setInterval(() => {
				if (!visible || document.hidden) return;
				wi = (wi + 1) % words.length;
				assign(true);
				onWordRef.current?.(wi);
			}, interval);
		};
		// Wait for the display font, so the first word is sampled in it rather than the fallback face.
		const fonts = document.fonts;
		(fonts ? Promise.race([fonts.load(`700 100px ${font}`, words.join('')).then(() => undefined), new Promise<void>((r) => setTimeout(r, 1200))]) : Promise.resolve()).catch(() => undefined).then(start);

		cv.addEventListener('pointermove', onMove, { passive: true });
		cv.addEventListener('pointerleave', onLeave);
		window.addEventListener('resize', onResize);
		scheme.addEventListener('change', onScheme);
		return () => {
			dead = true;
			cancelAnimationFrame(raf);
			clearInterval(timer);
			clearTimeout(rt);
			io.disconnect();
			cv.removeEventListener('pointermove', onMove);
			cv.removeEventListener('pointerleave', onLeave);
			window.removeEventListener('resize', onResize);
			scheme.removeEventListener('change', onScheme);
		};
	}, [words, font, interval]);

	return <canvas ref={ref} aria-hidden='true' className={className} />;
}
