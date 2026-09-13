#!/usr/bin/env node

import { createServer } from "./server/createServer";

function readPort(): number {
	const portArgIndex = process.argv.findIndex(arg => arg === "--port" || arg === "-p");
	const rawPort = portArgIndex === -1 ? process.env.PORT : process.argv[portArgIndex + 1];
	const port = Number(rawPort ?? 8082);

	if (!Number.isInteger(port) || port < 0 || port > 65535) {
		throw new Error(`Invalid port: ${rawPort}`);
	}

	return port;
}

function readHost(): string | undefined {
	const hostArgIndex = process.argv.findIndex(arg => arg === "--host" || arg === "-h");
	const rawHost = hostArgIndex === -1 ? process.env.HOST : process.argv[hostArgIndex + 1];

	if (rawHost === undefined || rawHost === "") {
		return undefined;
	}

	return rawHost;
}

const port = readPort();
const host = readHost();
const server = createServer({ port, host });

const stop = async () => {
	await server.stop();
	process.exit(0);
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

async function main() {
	await server.start();
	console.log(`Server listening on ${host ?? "0.0.0.0"}:${port}`);
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
