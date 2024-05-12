
let player = null

export const player_spawner_observer = {
	about: 'player spawner observer',
	observer: (args) => {
		if(args.blob.tick) return false
		if(!args || !args.entity || !args.fresh || !args.entity.spawner || args.entity.network_remote) return false

		// @todo should be able to de-register self from observation 

		if (typeof window === 'undefined' || document === 'undefined') {
			console.error("spawner: should not be run on server")
			return false
		}

		// @todo improve this
		if(player) return false
		player = 1

		if(!args.entity.spawner_props) {
			console.error("player spawner: nothing to clone")
			return false
		}

		if(!args.sys || !args.sys.systemid) {
			console.error("player spawner: no locally unique id")
			return false
		}

		// ask sys to create a player
		// use the sys uuid
		// - may want to have different spawn points to reduce player collisions?
		// - may want to use art from localstorage that the player set elsewhere?
		// - @todo continue to refine

		const props = { ...args.entity.spawner_props }

		props.uuid = args.sys.systemid

		sys.resolve(props)

		console.log("player spawner: spawning a player")

		return true
	}
}

