
// although this uses babylon it works in 3js also
// @todo have some kind of generic math library

import "../volume-babylon3d/libs/babylon.js"

function navigate(event,entity,sys) {

	if(!entity || !entity.volume || !entity.volume.transform || !entity.volume.transform.xyz || !entity.volume.transform.ypr) {
		console.error("navigate: error in entity",entity)
		return
	}

	const transform = entity.volume.transform

	// @todo note that these are 'live' values on the actual transform - may not want to do this
	const xyz = transform.xyz || [ 0,0,0 ]
	const ypr = transform.ypr || [ 0,0,0 ]

	let m = 0
	let x = 0
	switch(event.keyCode) {
		case 39: event.shiftKey ? x = -0.1 : ypr[1] -=0.1; break
		case 37: event.shiftKey ? x = 0.1 : ypr[1] +=0.1; break
		case 40: m = -0.1; break
		case 38: m = 0.1; break
		default: return
	}

	// get current orientation as euler and use to estimate translation target
	let rot = BABYLON.Quaternion.FromEulerAngles(...ypr)
	let vec = new BABYLON.Vector3(x,0,m).rotateByQuaternionToRef(rot,BABYLON.Vector3.Zero())

	// translate as a function of direction
	xyz[0] += vec.x
	xyz[1] += vec.y
	xyz[2] += vec.z

	// set targets for smoothing
	transform.target_xyz = xyz
	transform.target_ypr = ypr

	// broadcast changes
	sys.resolve({
		uuid: entity.uuid,
		volume: {
			transform: { xyz, ypr }
		}
	})

}

let handler = null

export const navigation_observer = {
	about: 'navigation observer',
	observer: (args) => {
		// @todo should be able to de-register self from observation 
		if(args.blob.tick) return false
		if(!args || !args.entity || !args.fresh || !args.entity.navigation || args.entity.network_remote) return false

		if (typeof window === 'undefined' || document === 'undefined') {
			console.error("navigation: should not be run on server")
			return false
		}

		if(handler == null) {
			handler = document.addEventListener('keydown',(event) => {
				navigate(event,args.entity,args.sys)
			})
		}

		// slight hack; force an earlier reaction to the entity since it is 'pure'
		navigate({key:'r'},args.entity,args.sys)
		return true
	}
}

