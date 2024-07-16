
import { _harmonize_resource_path } from '../sys/load.js'

export const tests = [
	{
		'name': 'server path test',
		'text': 'are server paths relative to orbital root? ( on server /some/path becomes ./some/path )',
		test: async ()=>{
			let path = "/some/path/to/some/resource.txt"
			let results = harmonize_resource_path(path,{isServer:true})
			if(results !== `.${path}`) {
				console.log(path,results)
				return false
			}
			return true
		}
	},
	{
		'name': 'client path test',
		'text': 'are client paths relative to browser root? (on client /some/path stays as /some/path )',
		test: async ()=>{
			let path = "/some/path/to/some/resource.txt"
			let results = harmonize_resource_path(path,{},{isServer:false})
			return results === `${path}`
		}
	},
	{
		'name': 'import map',
		'text': 'import maps work? ( apply importmap to mymap/mypath to generate a new path)',
		test: async ()=>{
			let path = "mymap/path/to/some/resource.txt"
			let results = harmonize_resource_path(path,{ importmaps: { mymap: "/magical" }, isServer:false })
			return results === `/magical/path/to/some/resource.txt`
		}
	},
	{
		'name': 'default import map on server?',
		'text': 'import maps work? ( apply importmap to orbital/mypath to generate a new path)',
		test: async ()=>{
			let path = "orbital/path/to/some/resource.txt"
			let results = harmonize_resource_path(path)
			return results === `./orbital/path/to/some/resource.txt`
		}
	},
	{
		'name': 'default manifest',
		'text': 'manifests work ( tack on a manifest js onto the end of anything ending in / )',
		test: async ()=>{
			let path = "/"
			let results = harmonize_resource_path(path,{manifest:'default-manifest.js',isServer:false})

			return results === `/default-manifest.js`
		}
	}
]

