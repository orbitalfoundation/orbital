# paper - june 2024

Paper is an html layout service
The goal is to have a declarative json based representation of html that can be reactive.
A json notation can be manipulated from javascript and is more terse as well.
On the minus side there can be leaky abstraction issues and the abstraction is not 100% complete.

## Technical approach

1) Paper attaches a browser url observer - catching any requests for new urls that the browser may issue.

2) Paper queries Orbital for paper entities matching the current url. All of these are passed to a renderer.

## Renderer and SSR

The renderer accepts json blobs that are effectively a json based representation of any given html node.

Here's an example of a logo - it is a fairly direct mapping of json to html, and in fact the user can directly embed html if they wish:

	{
		uuid:'cloudcity/logo1',
		paper: {
			css:`position:absolute;left:0px;top:0px;display:flex;justify-content:left;align-items:center`,
			content:`<a extern=true href="/" style='font-size:4em;margin-top:-8px;color:#e0e0e0;text-decoration:none'>&nbsp;⚈</a>`
		}
	},

The renderer will attempt to replace or update an existing node in the live dom rather than creating a new one if possible - this is important for SSR because a static copy of the page may have been already sent to the client earlier. The json representation is authoritative and the dom representation is reactive, attempting to stay up to date with the json representation.

The renderer can also be used to pre-generate SSR (server side rendered) pages. This is html text suitable for serialization and transport over the wire. This is optional, but a reason to do it is that third party search engines don't 'run' SPA (single page apps) but rather tend to only consume html - without a statically generated page they are unable to index your content and thus your content is less visible to the internet as a whole. It's basically convenient to be able to generate static html ahead of time. 

@todo this readme.md itself should be stuffed into the documentation as a whole; there's a hope to organize the documentation as a database and then generate views of that by leveraging papers query capabilities.