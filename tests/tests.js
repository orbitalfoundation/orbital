
import { tests as test1 } from './test-path.js'

async function runtests() {
	console.log("*************************************************************************************")
	console.log("* Testing")
	console.log("* current folder=",process.cwd())
	console.log("*************************************************************************************")
	for(const test of test1) {
		const results = await test.test()
		if(results) {
			console.log(`✅ ${test.name}:${test.text}`)
		} else {
			console.warn(`❌ ${test.name}:${test.text}`)
		}
	}
	console.log("*************************************************************************************")
}

runtests()
