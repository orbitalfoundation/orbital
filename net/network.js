
//
// network helper / wrapper - must be used when starting networking
// @todo these modules are imported once so checking is not needed
//

async function resolve(blob,sys) {

	if(!this._network_established) {
		this._network_established = true
		if(sys.isServer) {
			const modules = await import("./server.mjs")
			this.server = new modules.Server(sys)
			this.reactor = this.server.server_network_react.bind(this.server)
		} else {
			const modules = await import("./client.mjs")
			this.reactor = modules.client_network_react
		}
	}

	if(this.reactor) {
		this.reactor(blob,sys)
	}

	return blob
}

export const network_component_observer = {
	about:'network observer',
	resolve,
}

