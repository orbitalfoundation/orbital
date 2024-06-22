
//
// network helper / wrapper - must be used when starting networking
//

async function observer(args) {

	if(!this.network_established) {
		this.network_established = true
		if(args.sys.server) {
			const modules = await import("./server.mjs")
			this.server = new modules.Server(args.sys)
			this.reactor = this.server.server_network_react.bind(this.server)
		} else {
			const modules = await import("./client.mjs")
			this.reactor = modules.client_network_react
		}
	}

	if(this.reactor) {
		this.reactor(args)
	}

}

export const network_component_observer = {
	about:'network observer',
	observer
}

