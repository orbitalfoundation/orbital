
//import crypto from 'crypto'
//function uuidv4() {
//	if(typeof crypto !== 'undefined') {
//		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16) )
//	}
//	return 0
//}

///
/// https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
/// Public Domain/MIT
///

const uuidv4 = () => {
	var d = new Date().getTime();//Timestamp
	var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16;//random number between 0 and 16
		if(d > 0){//Use timestamp until depleted
			r = (d + r)%16 | 0;
			d = Math.floor(d/16);
		} else {//Use microseconds since page-load if supported
			r = (d2 + r)%16 | 0;
			d2 = Math.floor(d2/16);
		}
		return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
}

///
/// generate a local uuid using local storage for persistence
/// it's beneficial to at least have some kind of persistence so that preferences exist between refreshes of the browser page
///

export const uuid_client = () => {
	if(typeof window === 'undefined') {
		const err = "sys: client guid should not be run on server"
		console.error(err)
		throw err
	}
	const storage = window.localStorage
	if(!storage) {
		return "client-"+uuidv4()
	} else {
		let local = storage["orbital-local-uuid"]
		if(!local) {
			local = storage['orbital-local-uuid'] = uuidv4()
		}
		return local
	}
}

///
/// generate a server guid - here we try to use the mac address to be durable and unique
/// @todo probaby best to not use an async import and also not to rely on npm install node_modules
///

export const uuid_server = () => {
	return new Promise( (resolve,reject) => {
		import('node-machine-id').then(modules=>{
			const id = "server-" + modules.default.machineIdSync({original:true})
			resolve(id)
		})
		reject()
	})
}
