// A still field of dots behind the top of each page, lit from the top left. Absolute, not fixed, so it costs nothing while scrolling. The drifting lanes over it are the home hero's (routes/index.tsx).
export function Background() {
	return (
		<div aria-hidden='true' className='pointer-events-none absolute inset-x-0 top-0 -z-1 h-[760px] overflow-hidden max-sm:h-[520px]'>
			<div className='backdrop-glow' />
			<div className='backdrop-dots' />
		</div>
	);
}
