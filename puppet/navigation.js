
// although this uses babylon it works in 3js also
// @todo have some kind of generic math library

import "@orbital/volume-babylon3d/libs/babylon.js"

function navigate(event,entity,sys) {

	if(!entity || !entity.volume || !entity.volume.transform || !entity.volume.transform.xyz || !entity.volume.transform.ypr) {
		console.error("navigate: error in entity",entity)
		return
	}

	const transform = entity.volume.transform

	const xyz = transform.xyz || [ 0,0,0 ]
	const ypr = transform.ypr || [ 0,0,0 ]

	let m = 0
	switch(event.keyCode) {
		case 39: ypr[1] -=0.1; break
		case 37: ypr[1] +=0.1; break
		case 40: m = -0.1; break
		case 38: m = 0.1; break
		default: return
	}

	// get current orientation as euler and use to estimate translation target
	let rot = BABYLON.Quaternion.FromEulerAngles(...ypr)
	let vec = new BABYLON.Vector3(0,0,m).rotateByQuaternionToRef(rot,BABYLON.Vector3.Zero())

	// translate as a function of direction
	xyz[0] += vec.x
	xyz[1] += vec.y
	xyz[2] += vec.z

	// set targets
	transform.target_xyz = xyz
	transform.target_ypr = ypr

	// @todo technically i don't need to do the below since volume is reactive ... need to think about networking however
	sys.resolve({
		uuid: entity.uuid,
		volume: entity.volume
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

