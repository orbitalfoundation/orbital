
const isServer = (typeof window === 'undefined') ? true : false

let	timePrevious = 0
let	sanityCheck = 0

async function run(sys) {

	const framerate = 1000/60
	const minimum = 4

	const time = performance.now()
	const delta = timePrevious ? time - timePrevious : framerate

	// arguably tick may not need an id; and or the id could change; but this would pollute the database needlessly @todo
	const tick = {name:'tick',time,delta,tick:true,uuid:`/orbital/sys/tick` }
	await sys.resolve(tick)

	timePrevious = time
	const elapsed = performance.now() - time

	const sleep = elapsed < framerate && elapsed > minimum ? (framerate-elapsed) : minimum

	const done = () => {
		run(sys)
	}

	if(!isServer && window.requestAnimationFrame) {
		window.requestAnimationFrame(done)
	} else {
		setTimeout(done,sleep)
	}
}

const resolve = async function(blob,sys) {
	if(this._initialized) return blob
	this._initialized = true
	run(sys)
	return blob
}

export const tick_observer = {
	resolve,
}
