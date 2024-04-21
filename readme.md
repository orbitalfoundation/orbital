# Orbital

Orbital is an agent middleware library for building digital twins, games and simulations.

See https://github.com/orbitalfoundation for examples

## Running the server

`
npm install
npm run dev
`

Now visit the default localhost with a browser such as http://localhost:4000

## Notes

Orbital runs the same engine on the client and the server with minor differences:

The server version of Orbital runs both a websocket server mode for packet based traffic and also an http server for serving ordinary html pages. It multicasts traffic from clients and also has access to a persistent datastore (which clients do not).

The client version of Orbital is bootstrapped by ordinary html pages with javascript. The client instance of Orbital talks to the server for persistence and for multiparticipant networking in a conventional client server architecture.
