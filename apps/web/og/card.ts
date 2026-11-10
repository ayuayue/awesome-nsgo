// The share card of an app's page: a 1200×630 PNG with the site's mark, the app's icon, name, author, platforms and screenshot, which link previews (X, Slack, Discord, Telegram, Facebook, LinkedIn…) show in place of the raw screenshot, whose height they would crop. One card serves all five languages, so it carries no copy of its own: the localized title and description sit next to it in the preview. renderSiteCard draws the site's own card, the default share image of every other page.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { APP_PLATFORMS, type App, SITE_URL, t } from '@awesome-nsgo/catalog';
import { type CSSProperties, type ReactNode, createElement } from 'react';
import satori, { type Font, type FontWeight } from 'satori';
import sharp from 'sharp';
import { type NotoIndex, WEIGHTS, fetchRetry, googleFace, notoFamily } from './noto';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

// The original look's light tokens (src/styles.css @theme static); keep in step with them.
const C = { bg: '#ffffff', soft: '#f5f6f8', line: '#e1e3e8', fg: '#0c0d10', fg2: '#5b606a', fg3: '#6b707a', blue: '#007aff', blueInk: '#0062cc', blueSoft: '#eaf3ff' };
// The top-left glow both cards share, as the site's backdrop has it.
const GLOW = 'radial-gradient(circle at 0% 0%, rgba(0, 122, 255, 0.14), rgba(0, 122, 255, 0) 55%)';
// The short platform names the cards' pills use: one card serves every language, so these stay in English.
const PLATFORM_LABEL: Record<(typeof APP_PLATFORMS)[number], string> = { mac: 'macOS', win: 'Win', linux: 'Linux', ios: 'iOS', android: 'Android', web: 'Web', miniprogram: 'Mini' };
const HOST = new URL(SITE_URL).hostname;

const PAD = 64;
const LEFT_W = 456;
// The screenshot well: the right column's width, at the 1.6 aspect most screenshots have, so cropping removes little.
const SHOT_W = 576;
const SHOT_H = 360;
const ICON = 112;

export interface Paths {
	// The site's public/ directory, which holds /shots/, /icons/ and the site's mark (favicon.svg).
	publicDir: string;
	// apps/web/og/fonts.
	fontDir: string;
}

const h = (type: string, style: CSSProperties, ...children: ReactNode[]) => createElement(type, { style }, ...children);
const img = (src: string, width: number, height: number, style: CSSProperties = {}) => createElement('img', { src, width, height, style });

const dataUri = (png: Buffer) => `data:image/png;base64,${png.toString('base64')}`;

// Satori only reads PNG, JPEG and GIF, while the screenshots and icons are WebP (and one screenshot SVG), so every image goes through sharp first, at twice its displayed size for sharpness.
export async function asPng(input: Buffer, width: number, height: number): Promise<string> {
	return dataUri(await sharp(input, { density: 144 }).resize(width * 2, height * 2, { fit: 'cover', position: 'top' }).png().toBuffer());
}

// The site's mark (public/favicon.svg) as a PNG data URI at size, rasterised from the vector at the density that size needs (the SVG is drawn on a 32 unit grid), so it stays sharp at any size.
export async function siteMark(publicDir: string, size: number): Promise<string> {
	const svg = await readFile(join(publicDir, 'favicon.svg'));
	return dataUri(await sharp(svg, { density: Math.ceil((72 * size * 2) / 32) }).resize(size * 2, size * 2).png().toBuffer());
}

// An image under public/ (a path such as /shots/x.webp) or on the ai-logo CDN.
async function imageBytes(src: string, publicDir: string, slug: string): Promise<Buffer> {
	if (src.startsWith('/')) return readFile(join(publicDir, src));
	const res = await fetchRetry(src);
	if (!res.ok) throw new Error(`share card for ${slug}: ${src} answered ${res.status}`);
	return Buffer.from(await res.arrayBuffer());
}

// ---- fonts ----

// Inter at 800 and 500 (SIL OFL, og/fonts/OFL-inter.txt). To fetch them again, ask Google Fonts' css2 API for `family=Inter:wght@500;800` with `curl -fsSL -A 'curl/8'` (the URL form googleFont in noto.ts builds): a client that is not a browser gets TrueType, which satori reads, and the two `src: url(…ttf)` entries it lists download as og/fonts/inter-500.ttf and inter-800.ttf.
let latin: Promise<Font[]> | undefined;
export function latinFonts(fontDir: string): Promise<Font[]> {
	latin ??= Promise.all([
		readFile(join(fontDir, 'inter-800.ttf')).then((data): Font => ({ name: 'Inter', data, weight: 800 })),
		readFile(join(fontDir, 'inter-500.ttf')).then((data): Font => ({ name: 'Inter', data, weight: 500 })),
	]);
	return latin;
}

// The bundled fonts cover Latin only. Text in another script (an app named 留白, an author with a Korean name) is set in the matching Noto family (noto.ts), which the full CJK fonts, about 10 MB a weight, make too large to bundle whole: scripts/og-fonts.ts subsets the families to the characters the catalog holds, into og/fonts with noto.json. A character no subset holds yet, as in an app added since, is fetched from Google Fonts subset to just that text, and the build says to run the script again.
let index: Promise<NotoIndex> | undefined;
const notoIndex = (fontDir: string) => (index ??= readFile(join(fontDir, 'noto.json'), 'utf8').then((t) => JSON.parse(t) as NotoIndex));

const extra = new Map<string, Promise<Font[]>>();
function extraFonts(fontDir: string, code: string, segment: string): Promise<Font[]> {
	const key = `${code}\n${segment}`;
	let fonts = extra.get(key);
	if (!fonts) extra.set(key, (fonts = loadExtraFonts(fontDir, code, segment)));
	return fonts;
}

async function loadExtraFonts(fontDir: string, code: string, segment: string): Promise<Font[]> {
	// Colour emoji need SVG glyph images rather than a font; an emoji in a name is left out of the card.
	if (code === 'emoji') return [];
	const family = notoFamily(code, segment);
	const local = (await notoIndex(fontDir))[family];
	if (local && [...segment].every((ch) => !ch.trim() || local.text.includes(ch))) {
		return Promise.all(WEIGHTS.map(async (weight): Promise<Font> => ({ name: family, data: await readFile(join(fontDir, local.files[String(weight)])), weight: weight as FontWeight })));
	}
	console.warn(`share card: og/fonts has no ${family} for ${JSON.stringify(segment)}, so it comes from Google Fonts; run node apps/web/scripts/og-fonts.ts to add it.`);
	return Promise.all(WEIGHTS.map(async (weight): Promise<Font> => ({ name: family, data: await googleFace(family, weight, segment), weight: weight as FontWeight })));
}

// ---- layout ----

// Long names step down so that two lines hold any name in the catalog.
function nameSize(name: string): number {
	// A CJK character is about twice as wide as a Latin one.
	const len = [...name].reduce((n, ch) => n + (/[⺀-￯]/u.test(ch) ? 2 : 1), 0);
	if (len <= 8) return 88;
	if (len <= 12) return 72;
	if (len <= 16) return 60;
	return 52;
}

function letterTile(name: string, size: number): ReactNode {
	return h('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: size * 0.225, background: 'linear-gradient(135deg, #4da3ff, #0062cc)', color: '#ffffff', fontSize: size * 0.5, fontWeight: 800 }, name.charAt(0).toUpperCase());
}

function iconNode(icon: string | undefined, name: string, size: number): ReactNode {
	return icon ? img(icon, size, size, { borderRadius: size * 0.225 }) : letterTile(name, size);
}

// "Awesome NSGo" with NSGo in the link blue. Satori drops the space at the end of a text run, so the gap is a margin.
function wordmark(size: number, letterSpacing: string): ReactNode {
	return h('div', { display: 'flex', fontSize: size, fontWeight: 800, letterSpacing, color: C.fg }, 'Awesome', h('span', { marginLeft: size * 0.26, color: C.blueInk }, 'NSGo'));
}

// The platforms as outlined pills, in the order given.
function platformPills(platforms: readonly (typeof APP_PLATFORMS)[number][], centred = false): ReactNode {
	return h(
		'div',
		{ display: 'flex', flexWrap: 'wrap', justifyContent: centred ? 'center' : 'flex-start', rowGap: 8 },
		...platforms.map((p) => h('div', { display: 'flex', alignItems: 'center', height: 36, padding: '0 14px', borderRadius: 18, border: `1px solid ${C.line}`, color: C.fg2, fontSize: 20, fontWeight: 500, marginRight: 8, marginLeft: centred ? 8 : 0 }, PLATFORM_LABEL[p])),
	);
}

// The screenshot on a rounded, hairlined surface with a soft shadow: no title bar.
function screenFrame(shot: string): ReactNode {
	return h('div', { display: 'flex', width: SHOT_W + 2, borderRadius: 20, border: `1px solid ${C.line}`, background: C.soft, overflow: 'hidden', boxShadow: '0 30px 60px -20px rgba(16, 24, 40, 0.30)' }, img(shot, SHOT_W, SHOT_H + 40));
}

interface CardImages {
	icon?: string;
	shot?: string;
	site: string;
}

function card(app: App, im: CardImages): ReactNode {
	// Without a screenshot the icon (or letter tile) fills the right column instead, on a soft tile.
	const right = im.shot
		? screenFrame(im.shot)
		: h('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 420, height: 420, borderRadius: 48, border: `1px solid ${C.line}`, background: C.soft }, iconNode(im.icon, app.name, 260));
	return h(
		'div',
		{ display: 'flex', alignItems: 'center', width: CARD_WIDTH, height: CARD_HEIGHT, padding: PAD, background: C.bg, backgroundImage: GLOW, fontFamily: 'Inter', color: C.fg },
		h(
			'div',
			{ display: 'flex', flexDirection: 'column', width: LEFT_W, height: '100%' },
			h('div', { display: 'flex', alignItems: 'center' }, img(im.site, 40, 40, { borderRadius: 11, marginRight: 14 }), wordmark(26, '-0.02em')),
			im.shot ? h('div', { display: 'flex', marginTop: 40 }, iconNode(im.icon, app.name, ICON)) : h('div', { display: 'flex', flexGrow: 1 }),
			h('div', { display: 'flex', marginTop: 28, fontSize: nameSize(app.name), fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.035em' }, app.name),
			h('div', { display: 'flex', marginTop: 16, fontSize: 30, fontWeight: 500, color: C.fg2 }, `by ${app.author}`),
			h('div', { display: 'flex', flexGrow: 1 }),
			platformPills(app.platforms.slice(0, 5)),
			h('div', { display: 'flex', marginTop: 20, fontSize: 24, fontWeight: 800, color: C.blueInk }, HOST),
		),
		h('div', { display: 'flex', flexGrow: 1, justifyContent: 'flex-end' }, right),
	);
}

export async function renderCard(app: App, paths: Paths): Promise<Buffer> {
	const [icon, shot, site, fonts] = await Promise.all([
		app.icon ? imageBytes(app.icon, paths.publicDir, app.slug).then((b) => asPng(b, ICON * 2.5, ICON * 2.5)) : undefined,
		app.image ? imageBytes(app.image, paths.publicDir, app.slug).then((b) => asPng(b, SHOT_W, SHOT_H + 40)) : undefined,
		siteMark(paths.publicDir, 40),
		latinFonts(paths.fontDir),
	]);
	const svg = await satori(card(app, { icon, shot, site }), { width: CARD_WIDTH, height: CARD_HEIGHT, fonts, loadAdditionalAsset: (code, segment) => extraFonts(paths.fontDir, code, segment) });
	return sharp(Buffer.from(svg)).png().toBuffer();
}

// The site's own share card, the default image of every page but an app's: the mark, the name, the English lead, every platform NSGo draws on and the address.
function siteCard(site: string): ReactNode {
	return h(
		'div',
		{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: CARD_WIDTH, height: CARD_HEIGHT, padding: PAD, background: C.bg, backgroundImage: GLOW, fontFamily: 'Inter', color: C.fg },
		img(site, 120, 120, { borderRadius: 32 }),
		h('div', { display: 'flex', marginTop: 36 }, wordmark(104, '-0.04em')),
		h('div', { display: 'flex', marginTop: 20, maxWidth: 900, fontSize: 30, fontWeight: 500, lineHeight: 1.4, color: C.fg2, textAlign: 'center', justifyContent: 'center' }, t('en').hero_p),
		h('div', { display: 'flex', marginTop: 36 }, platformPills(APP_PLATFORMS, true)),
		h('div', { display: 'flex', marginTop: 32, fontSize: 26, fontWeight: 800, color: C.blueInk }, HOST),
	);
}

export async function renderSiteCard(paths: Paths): Promise<Buffer> {
	const [site, fonts] = await Promise.all([siteMark(paths.publicDir, 120), latinFonts(paths.fontDir)]);
	const svg = await satori(siteCard(site), { width: CARD_WIDTH, height: CARD_HEIGHT, fonts, loadAdditionalAsset: (code, segment) => extraFonts(paths.fontDir, code, segment) });
	return sharp(Buffer.from(svg)).png().toBuffer();
}
