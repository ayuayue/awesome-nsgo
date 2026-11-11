import { AI_TOOLS, APP_PLATFORMS, APPS, type AppPlatform, DOCS, INSTALL_CMDS, INSTALL_TABS, type InstallTab, LANGS, NSGO_SITE, PLUGINS, SITE_REPO, STATE_SOLUTIONS, TEMPLATES, UI_LIBS, fill, pick } from '@awesome-nsgo/catalog';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Fragment, useMemo, useState } from 'react';
import { AppCard } from '../components/EntryCard';
import { NavIcon } from '../components/marks';
import { ParticleWord } from '../components/ParticleWord';
import { useLang, useT } from '../lib/lang';
import { useCountUp } from '../lib/motion';
import { validateHomeSearch } from '../lib/page-search';
import { pageHead } from '../lib/seo';
import { DEFAULT_SORT, sortApps } from '../lib/showcase';
import { useSite } from '../lib/site';

// The apps the home page shows, in the showcase's default order: up to eight, a full two rows of four on a laptop.
const FEATURED_APPS = sortApps(APPS, DEFAULT_SORT, {}).slice(0, 8);

// Every platform an app can run on, with how many listed apps run there; the hero's dots spell them in this order and a chip under them names each.
const PLATFORM_ORDER: readonly AppPlatform[] = ['mac', 'ios', 'win', 'android', 'web', 'miniprogram', 'linux'];
const PLATFORMS = PLATFORM_ORDER.filter((p) => (APP_PLATFORMS as readonly string[]).includes(p)).map((p) => ({ p, n: APPS.filter((a) => a.platforms.includes(p)).length }));

// The devices beside the "build once" terminal show real screenshots, taken from listed apps that have one.
const SHOTS = APPS.filter((a) => a.image).map((a) => ({ name: a.name, image: a.image as string }));

export const Route = createFileRoute('/')({
	validateSearch: validateHomeSearch,
	head: ({ match }) => pageHead({ lang: match.search.lang, path: '/', title: null, desc: 'desc_home', name: 'nav_home' }),
	component: HomePage,
});

const SHELL = 'site-shell mx-auto px-6 max-sm:px-5';
const LABEL = 'font-mono text-[12.5px] font-semibold tracking-[0.14em] text-fg-3';
const H2 = 'm-0 text-[length:clamp(32px,4.4vw,56px)] leading-[1.1] font-bold tracking-[-0.03em] [&:is(:lang(zh-CN),:lang(zh-TW),:lang(ja),:lang(ko))]:leading-[1.25] [&:is(:lang(zh-CN),:lang(zh-TW),:lang(ja),:lang(ko))]:tracking-[-0.01em]';
const BTN = 'box-border inline-flex min-h-13 items-center justify-center gap-2 rounded-[12px] px-7 py-0 text-[16px] font-semibold max-sm:flex-auto';
const DISPLAY_FONT = "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans', 'Apple SD Gothic Neo', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";

function HomePage() {
	return (
		<div className='enter'>
			<Hero />
			<Showcase />
			<BuildOnce />
			<PluginRows />
			<Categories />
			<Faq />
			<SubmitBand />
		</div>
	);
}

// The install command split into words, each with the class that colours it like a shell: the command, its subcommands, the module path, flags and their values, and the app's name.
function tokens(cmd: string): { w: string; c: string }[] {
	const words = cmd.split(' ');
	return words.map((w, i) => {
		const prev = words[i - 1] ?? '';
		const c = i === 0 ? 'tk-b' : w.startsWith('-') ? 'tk-f' : prev.startsWith('-') ? 'tk-v' : w.includes('/') ? 'tk-p' : i === words.length - 1 ? 'tk-a' : 'tk-s';
		return { w, c };
	});
}

function Hero() {
	const t = useT();
	const { copy, copied } = useSite();
	const { install } = Route.useSearch();
	const navigate = useNavigate({ from: '/' });
	const tab: InstallTab = install ?? 'go';
	const setTab = (k: InstallTab) => void navigate({ search: (prev) => ({ ...prev, install: k === 'go' ? undefined : k }), replace: true, resetScroll: false });
	const [word, setWord] = useState(0);
	const e = useCountUp();
	const words = useMemo(() => PLATFORMS.map(({ p }) => t[`platform_${p}`]), [t]);

	const stats = [
		{ n: APPS.length, label: t.st_apps },
		{ n: PLUGINS.length, label: t.st_plugins },
		{ n: DOCS.length, label: t.hm_st_guides },
		{ n: LANGS.length, label: t.hm_st_langs },
	];

	return (
		<section className='relative overflow-hidden border-b border-line'>
			<div aria-hidden='true' className='hm-floor-wrap'>
				<div className='hm-floor' />
			</div>
			<div className={`${SHELL} relative flex flex-col items-center pt-16 text-center max-sm:pt-10`}>
				<Link to='/showcase' search={{ sort: 'newest' }} className='rise [animation-delay:0.05s] btn-g inline-flex h-9 items-center gap-2.5 border border-line-2 bg-panel pr-4 pl-3 text-[14px] font-medium text-fg no-underline max-md:h-11'>
					<span className='hm-live' aria-hidden='true' />
					{fill(t.live_badge, { n: APPS.length })}
					<span className='arrow' aria-hidden='true'>
						→
					</span>
				</Link>

				<h1 className='rise [animation-delay:0.15s] m-0 mt-7 text-[length:clamp(28px,4.2vw,56px)] leading-[1.2] font-bold tracking-[-0.02em]'>
					{t.hm_h1}
					<span className='sr-only'> {words.join(', ')}</span>
				</h1>
				<ParticleWord words={words} font={DISPLAY_FONT} onWord={setWord} className='rise [animation-delay:0.25s] block h-[clamp(140px,22vw,290px)] w-full cursor-crosshair text-fg' />

				<ul aria-label={t.f_platform} className='rise [animation-delay:0.32s] m-0 flex list-none flex-wrap justify-center gap-2 p-0'>
					{PLATFORMS.map(({ p, n }, i) => (
						<li key={p}>
							<Link to='/showcase' search={{ platform: p }} data-on={i === word ? '' : undefined} className={`hm-chip inline-flex h-8 items-center gap-1.5 rounded-full border border-line-2 bg-panel px-3 text-[13px] font-medium no-underline max-md:h-10 ${n ? 'text-fg' : 'text-fg-3'}`}>
								{t[`platform_${p}`]}
								{n > 0 && <span className='font-mono text-[11px] opacity-70 tabular-nums'>{n}</span>}
							</Link>
						</li>
					))}
				</ul>

				<p className='rise [animation-delay:0.4s] m-0 mt-7 max-w-[600px] text-[18px] leading-[1.75] text-fg-2 max-sm:text-[16px] [&:is(:lang(zh-CN),:lang(zh-TW),:lang(ja),:lang(ko))]:max-w-[34em]'>
					{t.hero_p} {t.hero_p2}
				</p>

				<div className='rise [animation-delay:0.48s] mt-8 flex flex-wrap justify-center gap-3 max-sm:self-stretch'>
					<Link to='/showcase' className={`btn-c ${BTN}`}>
						{t.explore} <span className='arrow'>→</span>
					</Link>
					<a className={`btn-g border border-line-2 bg-panel text-fg ${BTN}`} href={NSGO_SITE} target='_blank' rel='noopener'>
						{t.site}
					</a>
				</div>

				{/* The install command for the template picked in the tabs, highlighted like a shell, with its copy button. The tab lives in the address (?install=). */}
				<div className='rise [animation-delay:0.56s] hm-term mt-8 w-full max-w-[760px] overflow-hidden rounded-[14px] text-left [box-shadow:var(--sh-3)]'>
					<div className='flex flex-wrap items-center gap-1 border-b border-white/10 py-1.5 pr-1.5 pl-4'>
						<span className='mr-2 text-[12.5px] text-[#a1a1a1]'>{t.hm_term}</span>
						<div role='tablist' aria-label={t.a_install} className='flex gap-0.5'>
							{INSTALL_TABS.map((it) => (
								<button key={it.key} type='button' role='tab' aria-selected={tab === it.key} onClick={() => setTab(it.key)} className='hm-tab min-h-8 min-w-11 rounded-[8px] border-0 bg-transparent px-3 font-mono text-[12.5px] text-[#a1a1a1] max-md:min-h-10'>
									{it.label}
								</button>
							))}
						</div>
						<button type='button' onClick={() => copy(INSTALL_CMDS[tab], 'cmd')} aria-label={t.a_copy_install} className='ml-auto min-h-8 min-w-[72px] rounded-[8px] border-0 bg-[#ededed] px-3 text-[13px] font-semibold text-[#0a0a0a] max-md:min-h-10'>
							{copied === 'cmd' ? t.copied : t.copy}
						</button>
					</div>
					<code className='block px-[18px] pt-4 pb-[18px] font-mono text-[13px] leading-[1.7] break-words'>
						<span className='tk-pr'>$ </span>
						{tokens(INSTALL_CMDS[tab]).map((k, i) => (
							<Fragment key={i}>
								{i > 0 && ' '}
								<span className={`${k.c} whitespace-nowrap`}>{k.w}</span>
							</Fragment>
						))}
						<span className='hm-caret' aria-hidden='true' />
					</code>
				</div>

				<dl className='rise [animation-delay:0.64s] m-0 mt-16 mb-16 grid w-full grid-cols-4 overflow-hidden rounded-[14px] border border-line-2 bg-panel max-md:grid-cols-2 max-sm:mt-10 max-sm:mb-10'>
					{stats.map((st) => (
						<div key={st.label} className='flex flex-col-reverse items-center gap-1 px-3 py-5 [box-shadow:-1px_0_0_var(--color-line-2),0_-1px_0_var(--color-line-2)]'>
							<dt className='text-[14px] text-fg-3'>{st.label}</dt>
							<dd className='m-0 font-[family-name:var(--font-display)] text-[44px] leading-[1.1] font-bold tracking-[-0.03em] tabular-nums max-sm:text-[36px]'>{Math.round(st.n * e)}</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
}

// The apps as a plain grid of cards, the same cards as the showcase page: screenshot, icon, name, author, Go or TSX, one line and the platforms, so the list reads at a glance and every card opens the app.
function Showcase() {
	const t = useT();
	if (FEATURED_APPS.length === 0) return null;
	return (
		<section aria-labelledby='hm-show' className='border-b border-line bg-soft'>
			<div className={`${SHELL} py-24 max-sm:py-16`}>
				<div className='rv mb-10 flex flex-wrap items-end justify-between gap-5'>
					<div className='flex flex-col gap-3.5'>
						<span className={LABEL}>01 · SHOWCASE</span>
						<h2 id='hm-show' className={H2}>
							{t.hm_show_h}
						</h2>
						<p className='m-0 text-[16px] text-fg-2'>{t.hm_show_p}</p>
					</div>
					<Link to='/showcase' className='btn-g btn-44 inline-flex min-h-12 items-center gap-2 border border-line-2 bg-panel px-5 text-[15px] font-semibold text-fg no-underline'>
						{fill(t.feat_all, { n: APPS.length })} <span className='arrow'>→</span>
					</Link>
				</div>
				<div className='grid grid-cols-[repeat(auto-fill,minmax(min(100%,270px),1fr))] gap-4'>
					{FEATURED_APPS.map((a, k) => (
						<AppCard key={a.slug} app={a} k={k} as='h3' like={false} score={false} />
					))}
				</div>
			</div>
		</section>
	);
}

// The commands that make and run an app, typing themselves out, beside the same app on a Mac, in a browser and on a phone.
function BuildOnce() {
	const t = useT();
	const [desk, web, phone] = [SHOTS[0], SHOTS[1] ?? SHOTS[0], SHOTS[2] ?? SHOTS[0]];
	const lines: { w: string; c: string }[][] = [tokens(INSTALL_CMDS.tsx), [{ w: 'cd', c: 'tk-b' }, { w: 'my-app', c: 'tk-a' }], tokens('go tool nsgo doctor'), tokens('go tool nsgo dev')];
	return (
		<section aria-labelledby='hm-build' className='border-b border-line'>
			<div className={`${SHELL} rv flex flex-wrap items-center gap-14 py-24 max-sm:py-16`}>
				<div className='flex min-w-0 flex-[1_1_440px] flex-col gap-5'>
					<span className={LABEL}>02 · BUILD ONCE</span>
					<h2 id='hm-build' className={H2}>
						{t.hm_build_h1}
						<br />
						{t.hm_build_h2}
					</h2>
					<p className='m-0 max-w-[32em] text-[17px] leading-[1.75] text-fg-2'>{t.hm_build_p}</p>
					<div className='hm-term rounded-[14px] px-6 py-5 font-mono text-[13.5px] leading-[1.8] [box-shadow:var(--sh-3)]'>
						<div aria-hidden='true' className='mb-3.5 flex gap-[7px]'>
							<span className='size-[11px] rounded-full bg-[#ff5f57]' />
							<span className='size-[11px] rounded-full bg-[#febc2e]' />
							<span className='size-[11px] rounded-full bg-[#28c840]' />
						</div>
						{lines.map((ln, i) => (
							<div key={i} className='hm-ln break-words' style={{ animationDelay: `${i * 0.5}s` }}>
								<span className='tk-pr'>$ </span>
								{ln.map((k, j) => (
									<Fragment key={j}>
										{j > 0 && ' '}
										<span className={`${k.c} whitespace-nowrap`}>{k.w}</span>
									</Fragment>
								))}
								{i === lines.length - 1 && <span className='hm-caret' aria-hidden='true' />}
							</div>
						))}
					</div>
				</div>
				{desk && (
					<div aria-hidden='true' className='relative h-[460px] min-w-0 flex-[1_1_500px] max-sm:h-[300px]'>
						<div className='hm-pop absolute top-8 left-0 w-[78%]'>
							<div className='hm-bob overflow-hidden rounded-[12px] border border-line-2 bg-white [box-shadow:var(--sh-3)]'>
								<div className='flex h-[30px] items-center gap-[7px] border-b border-[#e5e7eb] bg-[#f3f4f6] px-3'>
									<span className='size-2.5 rounded-full bg-[#ff5f57]' />
									<span className='size-2.5 rounded-full bg-[#febc2e]' />
									<span className='size-2.5 rounded-full bg-[#28c840]' />
									<span className='ml-2 text-[12px] text-[#4b5160]'>macOS · {desk.name}</span>
								</div>
								<img src={desk.image} alt='' width={1200} height={750} loading='lazy' decoding='async' className='block h-auto w-full' />
							</div>
						</div>
						<div className='hm-pop absolute right-0 bottom-2.5 w-[60%]' style={{ animationDelay: '0.5s' }}>
							<div className='hm-bob overflow-hidden rounded-[12px] border border-line-2 bg-white [box-shadow:var(--sh-3)]' style={{ animationDelay: '-2s' }}>
								<div className='flex h-[30px] items-center gap-2.5 border-b border-[#e5e7eb] bg-[#f3f4f6] px-3'>
									<span className='text-[12px] text-[#4b5160]'>Web</span>
									<span className='flex h-[18px] flex-1 items-center rounded-[6px] border border-[#d5d8dd] bg-white px-2 font-mono text-[10.5px] text-[#4b5160]'>localhost</span>
								</div>
								<img src={web.image} alt='' width={1200} height={750} loading='lazy' decoding='async' className='block h-auto w-full' />
							</div>
						</div>
						<div className='hm-pop absolute top-0 right-[4%] w-[150px] max-sm:w-[100px]' style={{ animationDelay: '1s' }}>
							<div className='hm-bob rounded-[30px] bg-[#0a0a0a] p-[7px] [box-shadow:var(--sh-3)] max-sm:rounded-[22px] max-sm:p-[5px]' style={{ animationDelay: '-4s' }}>
								<div className='relative aspect-[9/19.5] overflow-hidden rounded-[24px] bg-[#e7e4df] max-sm:rounded-[18px]'>
									<img src={phone.image} alt='' loading='lazy' decoding='async' className='block size-full object-cover object-[50%_40%]' />
									<span className='absolute top-2 left-1/2 h-3.5 w-12 -translate-x-1/2 rounded-[10px] bg-[#0a0a0a] max-sm:h-2.5 max-sm:w-8' />
								</div>
							</div>
							<span className='mt-3 block text-center text-[12px] text-fg-3'>iOS</span>
						</div>
					</div>
				)}
			</div>
		</section>
	);
}

// Every official package as a pill, in two rows that scroll opposite ways and stop under the pointer. Each pill opens the plugins page.
function PluginRows() {
	const t = useT();
	const lang = useLang();
	if (PLUGINS.length === 0) return null;
	const half = Math.ceil(PLUGINS.length / 2);
	const rows = [PLUGINS.slice(0, half), PLUGINS.slice(half)];
	return (
		<section aria-labelledby='hm-plug' className='overflow-hidden border-b border-line bg-soft py-24 max-sm:py-16'>
			<div className={`${SHELL} rv mb-11 flex flex-wrap items-end justify-between gap-6`}>
				<div className='flex flex-col gap-3.5'>
					<span className={LABEL}>03 · PLUGINS</span>
					<h2 id='hm-plug' className={H2}>
						{fill(t.hm_plug_h1, { n: PLUGINS.length })}
						<br />
						{t.hm_plug_h2}
					</h2>
				</div>
				<div className='flex max-w-[420px] flex-col items-start gap-3'>
					<p className='m-0 text-[16px] leading-[1.7] text-fg-2'>{t.hm_plug_p}</p>
					<Link to='/plugins' className='btn-g inline-flex min-h-12 items-center gap-2 border border-line-2 bg-panel px-5 text-[15px] font-semibold text-fg no-underline'>
						{t.hm_plug_all} <span className='arrow'>→</span>
					</Link>
				</div>
			</div>
			<div className='hm-rows flex flex-col gap-3'>
				{rows.map((row, r) => (
					<div key={r} className='hm-row' data-dir={r === 1 ? 'r' : undefined}>
						{[0, 1].map((copyIdx) =>
							row.map((p) => (
								<Link key={`${copyIdx}-${p.slug}`} to='/plugins' aria-hidden={copyIdx === 1 ? true : undefined} tabIndex={copyIdx === 1 ? -1 : undefined} className='btn-g inline-flex max-w-[460px] flex-none items-baseline gap-2.5 border border-line-2 bg-panel px-5 py-3.5 whitespace-nowrap text-fg no-underline'>
									<span className='text-[15.5px] font-bold'>{p.name}</span>
									<span className='truncate text-[14px] text-fg-3'>{pick(p.desc, lang)}</span>
								</Link>
							)),
						)}
					</div>
				))}
			</div>
		</section>
	);
}

function Categories() {
	const t = useT();
	const nState = STATE_SOLUTIONS.length;
	const nTpl = TEMPLATES.length;
	const nAi = AI_TOOLS.length;
	// The categories still waiting for their first entries wear an inverted badge; showcase, plugins and ui always have entries.
	const cats = [
		{ to: '/showcase', name: t.cat_show_name, badge: t.cat_show_badge, wanted: false, desc: t.cat_show_desc },
		{ to: '/plugins', name: t.nav_plugins, badge: t.cat_plug_badge, wanted: false, desc: fill(t.cat_plug_desc, { n: PLUGINS.length }) },
		{ to: '/ui', name: t.cat_ui_name, badge: fill(t.cat_ui_badge, { n: UI_LIBS.length }), wanted: false, desc: t.cat_ui_desc },
		{ to: '/state', name: t.cat_state_name, badge: nState ? fill(t.cat_state_count, { n: nState }) : t.cat_state_badge, wanted: nState === 0, desc: t.cat_state_desc },
		{ to: '/templates', name: t.cat_tpl_name, badge: nTpl ? fill(t.cat_tpl_count, { n: nTpl }) : t.cat_tpl_badge, wanted: nTpl === 0, desc: t.cat_tpl_desc },
		{ to: '/ai', name: t.cat_ai_name, badge: nAi ? fill(t.cat_ai_count, { n: nAi }) : t.cat_ai_badge, wanted: nAi === 0, desc: t.cat_ai_desc },
	] as const;
	return (
		<section aria-labelledby='cats' className='border-b border-line'>
			<div className={`${SHELL} py-24 max-sm:py-16`}>
				<div className='rv mb-10 flex flex-col gap-3.5'>
					<span className={LABEL}>04 · CATALOG</span>
					<h2 id='cats' className={H2}>
						{t.cats_h}
					</h2>
					<p className='m-0 text-[15px] text-fg-3'>{t.cats_src}</p>
				</div>
				<div className='grid grid-cols-3 gap-4 max-split:grid-cols-2 max-tab:grid-cols-1'>
					{cats.map((c, k) => (
						// The reveal is on a wrapper: on the tile itself its settled transform would override the tile's hover lift.
						<div key={c.to} className={`rv d${k} flex`}>
							<Link to={c.to} className='tile spot group relative flex min-h-[200px] flex-1 flex-col gap-3.5 rounded-card border border-line-2 bg-panel p-7 text-fg no-underline hover:border-line-3 hover:[box-shadow:var(--sh-2)] max-sm:min-h-0 max-sm:p-5'>
								<span className='flex items-start justify-between gap-3'>
									<span className='ichip flex size-11 items-center justify-center rounded-box bg-soft text-fg'>
										<NavIcon to={c.to} />
									</span>
									<span className={`inline-flex h-6 items-center rounded-full px-2.5 font-mono text-[12px] font-semibold ${c.wanted ? 'bg-fg text-bg' : 'border border-line-2 text-fg-2'}`}>{c.badge}</span>
								</span>
								<span className='mt-1 text-[21px] font-bold tracking-[-0.015em]'>
									{c.name} <span className='arrow text-fg-3'>→</span>
								</span>
								<span className='text-[15px] leading-[1.65] text-fg-2'>{c.desc}</span>
							</Link>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function Faq() {
	const t = useT();
	const qa = [
		[t.hm_q1, t.hm_a1],
		[t.hm_q2, t.hm_a2],
		[t.hm_q3, t.hm_a3],
		[t.hm_q4, t.hm_a4],
		[t.hm_q5, t.hm_a5],
	] as const;
	return (
		<section aria-labelledby='hm-faq' className='border-b border-line bg-soft'>
			<div className={`${SHELL} flex flex-wrap gap-x-18 gap-y-10 py-24 max-sm:py-16`}>
				<div className='rv flex flex-[1_1_260px] flex-col gap-3.5'>
					<span className={LABEL}>05 · FAQ</span>
					<h2 id='hm-faq' className={H2}>
						{t.hm_faq_h}
					</h2>
					<p className='m-0 text-[16px] leading-[1.7] text-fg-2'>
						{t.hm_faq_more}{' '}
						<a href={`${SITE_REPO}/issues`} target='_blank' rel='noopener' className='text-fg underline'>
							{t.hm_faq_issue}
						</a>
					</p>
				</div>
				<div className='min-w-0 flex-[2_1_560px] border-t border-line-2'>
					{qa.map(([q, a], i) => (
						<details key={i} className='hm-faq rv border-b border-line-2'>
							<summary className='flex min-h-11 items-center justify-between gap-4 px-2 py-5 text-[18px] font-semibold hover:bg-[color-mix(in_srgb,var(--color-fg)_3%,transparent)]'>
								{q}
								<span className='hm-plus flex-none text-[26px] leading-none font-light' aria-hidden='true'>
									+
								</span>
							</summary>
							<p className='m-0 max-w-[46em] px-2 pb-6 text-[15.5px] leading-[1.85] text-fg-2'>{a}</p>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}

// The call to submit, inverted from the page: how a submission goes in three steps, a marquee of the call, and the buttons. Steps and marquee are in the page's language.
function SubmitBand() {
	const t = useT();
	const { openSubmit } = useSite();
	const steps = [
		[t.hm_s1_t, t.hm_s1_d],
		[t.hm_s2_t, t.hm_s2_d],
		[t.hm_s3_t, t.hm_s3_d],
	] as const;
	const phrase = (
		<>
			<span className='pr-12'>
				{t.hm_marq} <span className='hm-star'>✦</span>
			</span>
			<span className='hm-outline pr-12'>
				SHIP IT <span className='hm-star'>✦</span>
			</span>
		</>
	);
	return (
		<section aria-label={t.hm_marq} className='overflow-hidden bg-fg text-bg'>
			<div aria-hidden='true' className='overflow-hidden pt-14 pb-4'>
				<div className='hm-marq font-[family-name:var(--font-display)] text-[length:clamp(56px,9vw,140px)] leading-[1.1] font-bold tracking-[-0.03em] whitespace-nowrap'>
					{phrase}
					{phrase}
				</div>
			</div>
			<div className={`${SHELL} pt-8`}>
				<ol className='m-0 grid list-none grid-cols-3 gap-4 p-0 max-split:grid-cols-1'>
					{steps.map(([title, desc], i) => (
						<li key={i} className='rv flex flex-col gap-3.5 rounded-[14px] border border-[color-mix(in_srgb,var(--color-bg)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-bg)_4%,transparent)] p-6'>
							<span className='flex items-center gap-3'>
								<span className='flex size-9 flex-none items-center justify-center rounded-full bg-bg font-mono text-[14px] font-semibold text-fg'>{i + 1}</span>
								<span aria-hidden='true' className='hm-step-line h-px flex-1 bg-[color-mix(in_srgb,var(--color-bg)_28%,transparent)]' />
							</span>
							<span className='text-[19px] font-bold'>{title}</span>
							<span className='text-[14.5px] leading-[1.75] opacity-70'>{desc}</span>
						</li>
					))}
				</ol>
			</div>
			<div className={`${SHELL} flex flex-wrap items-center justify-between gap-7 pt-8 pb-22 max-sm:pb-16`}>
				<p className='m-0 max-w-[36em] text-[18px] leading-[1.75] opacity-70 max-sm:text-[16px]'>{t.hm_cta_p}</p>
				<div className='flex flex-wrap gap-3 max-sm:self-stretch'>
					<button type='button' onClick={() => openSubmit()} className={`btn-g border-0 bg-bg text-fg hover:!bg-bg hover:opacity-90 ${BTN}`}>
						{t.submit_short} <span className='arrow'>→</span>
					</button>
					<a href={SITE_REPO} target='_blank' rel='noopener' className={`btn-g border border-[color-mix(in_srgb,var(--color-bg)_30%,transparent)] text-bg no-underline hover:!bg-transparent hover:!text-bg ${BTN}`}>
						GitHub ↗
					</a>
				</div>
			</div>
		</section>
	);
}
