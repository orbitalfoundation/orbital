# Orbital

Orbital is an agent middleware library for building digital twins, games and simulations.

See https://github.com/orbitalfoundation for examples

## Running the server

Orbital runs more or less the same code on server or client. The server acts as a persistent store and the client acts a transient store subscribing to server state changes. Running orbital below runs an instance of the server which mounts a socket on a default port (4000 typically) and handles incoming requests. It also runs a webserver on that port which surfaces tools to introspect server state. Run the below and then visit http://localhost:4000 with a browser:

npm install
npm run dev
