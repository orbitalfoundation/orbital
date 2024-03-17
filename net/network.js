
// react to { network:'server' } events - also first brings up network if not running already
// @todo arguably a queue should be used to prevent out of order events at startup? or are we ok for these given await?

async function observer(args) {

	if(!this.network_established) {
		this.network_established = true
		if(args.sys.server) {
			const modules = await import("./server.mjs")
			this.server = new modules.Server(args.sys)
			this.server_network_react = this.server.server_network_react.bind(this.server)
		} else {
			const modules = await import("./client.mjs")
			this.client_network_react = modules.client_network_react
		}
	}

	if(this.server_network_react) {
		this.server_network_react(args)
	} else if(this.client_network_react) {
		this.client_network_react(args)
	}

}

export const network_component_observer = {
	about:'network observer',
	observer
}

