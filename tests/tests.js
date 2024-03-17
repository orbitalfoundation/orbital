
import {Sys} from '../sys/sys.js'
const sys = new Sys()

//////////////////////////////////////////////////////////////////////////////////////////////
// data for tests
//////////////////////////////////////////////////////////////////////////////////////////////

const sample_data = [

	// a test of loading up a module

	{
		modules: [
			process.cwd()+"/orbital/paper/paper.js",
		]
	},

	// a test of a single entity with a variety of components

	{
		uuid:"test",
		xyz:0,
		ypr:0,
		whd:0,
		color: "blue",
		onAdd: () => { console.log("added ") },
		collider: () => {
			// use a hull that is inferred from whd by default and detect if is a function by default
			console.log("collided")
		}
	}
]

//////////////////////////////////////////////////////////////////////////////////////////////
// tests
//////////////////////////////////////////////////////////////////////////////////////////////

const tests = [
	{
		'name': 'core',
		'text': 'core functionality test; load/save/query entities with components and custom component setters',
		test: async ()=>{
			await sys.resolve(sample_data)
			let results = await sys.query({uuid:"test"})
			return results[0].uuid == "test"
		}
	}
]

async function runtests() {
	console.log("*************************************************************************************")
	console.log("* Testing")
	console.log("* current folder=",process.cwd())
	console.log("*************************************************************************************")
	for(const test of tests) {
		const results = await test.test()
		if(results) {
			console.log(`✅ ${test.name}:${test.text}: passed`)
		} else {
			console.warn(`❌ ${test.name}:${test.text}: failed`)
		}
	}
	console.log("*************************************************************************************")
}

runtests()
