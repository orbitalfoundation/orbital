
let player = 0

const resolve = async (blob,sys) => {

	if(blob.tick) return blob
	if(!blob.spawner || blob.network) return blob

	// @todo should be able to de-register self from observation 

	if (typeof window === 'undefined' || document === 'undefined') {
		console.error("spawner: should not be run on server")
		return blob
	}

	// @todo improve this - kind of a super hack
	if(player) return blob
	player = 1

	if(!blob.spawner_props) {
		console.error("player spawner: nothing to clone")
		return blob
	}

	// ask sys to create a player
	// use the sys selfid ideally
	// - may want to have different spawn points to reduce player collisions?
	// - may want to use art from localstorage that the player set elsewhere?
	// - @todo continue to refine; clearly we don't always want to spawn a player

	const props = { ...blob.spawner_props }

	props.uuid = sys.selfid ? sys.selfid : 'a-locally-unique-uuid'

	console.log("player spawner: spawning a player",props)

	await sys.resolve(props)

	return blob
}

export const player_spawner_observer = {
	about: 'player spawner observer',
	resolve
}

