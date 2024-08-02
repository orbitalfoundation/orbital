
const isServer = (typeof window === 'undefined') ? true : false

const mongo_uri = "mongodb://localhost:27017"

async function _init() {
	if(!this.mongo || !this.client || !this.client.topology || !this.client.topology.isConnected()) {
		try {
			this.mongo = await import('mongodb')
			this.client = new this.mongo.MongoClient(mongo_uri)
			await this.client.connect()
			this.db = this.client.db()
			this.collection = this.db.collection('orbital')
			console.log("sys write: server side mongo up")
		} catch(err) {
			console.error(err)
		}
	}	
}

async function _query(blob,sys) {

	if(!blob.query) return

	await this._init()

	if(!this.mongo || !this.client || !this.client.topology || !this.client.topology.isConnected()) return

	const { query, limit, offset } = blob.query
	let cursor = this.collection.find(query);
	if (offset !== undefined) {
		cursor = cursor.skip(offset)
	}
	if (limit !== undefined) {
		cursor = cursor.limit(limit)
	}
	const documents = await cursor.toArray()

	// @todo enforce limits on offset, limit
	// @todo sanity checks on inputs
	// @todo ideally i would route this straight back to the caller? how can i do that?
	// @todo if things are marked with their subspace or zone or something then that is a great thing to filter on

	if(blob.network) {
		sys.resolve({
			network: {
				monocast: blob.network.socketid,
				packets: documents,
			}
		})
	}
}

async function _write(blob,sys) {

	if(!blob.uuid || !blob.write) return

	await this._init()

	if(!this.mongo || !this.client || !this.client.topology || !this.client.topology.isConnected()) return

	// @todo a ton of sanitization on this data before it gets stored
	// @todo auth checks also
	// @todo may want a sanitizer as a separate module
	// @todo may want auth as a separate module

	// Define the filter, update, and options
	const filter = { _id: blob.uuid }
	const update = { $set: blob }
	const options = { upsert: true, returnDocument: 'after', includeResultMetadata: true }
	const result = await this.collection.findOneAndUpdate(filter, update, options)

	if (result.lastErrorObject.upserted) {
	  console.warn('sys write: mongo document upserted error?:', result )
	} else {
	  console.log('sys write: mongo document upserted success: id=', result.value._id )
	}

}

async function resolve(blob,sys) {
	if(!isServer) return blob
	await this._query(blob,sys)
	await this._write(blob,sys)
	return blob
}

export const write_observer = {
	_init,
	_query,
	_write,
	resolve,
}








