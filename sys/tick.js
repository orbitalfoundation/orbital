
const isServer = (typeof window === 'undefined') ? true : false

let	timePrevious = 0
let	sanityCheck = 0

//
// client and server tick helper
//

async function _run(sys) {

	const framerate = 1000/60
	const minimum = 4

	const time = performance.now()
	const delta = timePrevious ? time - timePrevious : framerate

	// arguably tick may not need an id; and or the id could change; but this would pollute the database needlessly if it changed - @todo may remove uuid
	const tick = {name:'tick',time,delta,tick:true }
	await sys.resolve(tick)

	timePrevious = time
	const elapsed = performance.now() - time

	const sleep = elapsed < framerate && elapsed > minimum ? (framerate-elapsed) : minimum

	const done = () => {
		_run(sys)
	}

	if(!isServer && window.requestAnimationFrame) {
		window.requestAnimationFrame(done)
	} else {
		setTimeout(done,sleep)
	}
}

//
// tick is a way that other observers can run every frame
// @todo it's arguable if this is really conceptually an observer at all but observers like this are the only way orbital does 'work' for now
//

const resolve = async function(blob,sys) {
	if(this._initialized) return
	this._initialized = true
	_run(sys)
}

export const tick_observer = {
	resolve,
}
