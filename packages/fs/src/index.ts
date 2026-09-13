import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import cors from "@fastify/cors";
import fs from "fs/promises";
import path from "path";
import { cwd } from "process";
import { exec } from "child_process";

interface JsonResult<T = any> {
	success: boolean;
	code: number;
	errorMsg?: string;
	data?: T;
}

const successfulJson = <T = any>(data?: T): JsonResult<T> => ({
	success: true,
	code: 200,
	data,
});
const failedJson = <T = any>(code: number, message?: string): JsonResult<T> => ({
	success: false,
	code,
	errorMsg: message,
});

export const defaultConfig = {
	server: false,
	port: 8089,
	debug: false,
	dirname: cwd(),
	/** 只读模式：禁用所有写入/删除接口，用于公网部署 */
	readonly: false,
};

function createFsHandler(dirname: string) {
	const join = (url: string) => path.join(dirname, url);
	// 必须比较到路径分隔符，否则 "../dist-backup/x" 这类同前缀的兄弟目录能逃出沙箱
	const isInProject = (url: string) => {
		const full = path.normalize(join(url));
		return full === dirname || full.startsWith(dirname + path.sep);
	};

	const ensureSafe = (url: string) => {
		if (!isInProject(url)) throw new Error(`只能访问 ${dirname} 下的资源`);
		return join(url);
	};

	const wrap = <Q, R>(fn: (query: Q) => Promise<R>) => {
		return async (req: any) => {
			try {
				return successfulJson(await fn(req.method == "POST" ? req.body : req.query));
			} catch (e: any) {
				return failedJson(400, String(e));
			}
		};
	};

	return { join, ensureSafe, wrap };
}

export default function createApp(config: Partial<typeof defaultConfig> = {}) {
	const cfg = { ...defaultConfig, ...config };
	cfg.dirname = path.resolve(cfg.dirname);
	if (cfg.debug) console.log(cfg);
	const app = Fastify({
		logger: cfg.debug,
	});

	const { ensureSafe, wrap } = createFsHandler(cfg.dirname);

	// 只读模式下，所有会改动磁盘的接口直接返回403，绝不进入处理函数
	const wrapWrite = <Q, R>(fn: (query: Q) => Promise<R>) => {
		if (!cfg.readonly) return wrap(fn);
		return async (req: any, reply: any) => reply.code(403).send(failedJson(403, "服务器处于只读模式，写入接口已禁用"));
	};

	app.register(cors, {
		origin: "*",
		methods: ["GET", "POST", "OPTIONS"],
	});

	app.register(fastifyStatic, {
		root: cfg.dirname,
		prefix: "/",
		dotfiles: "allow",
		maxAge: 0,
	});

	// index.html
	app.get("/", async (req, reply) => reply.redirect("/index.html"));

	app.get(
		"/createDir",
		wrapWrite(async ({ dir }: { dir: string }) => {
			const full = ensureSafe(dir);
			await fs.mkdir(full, { recursive: true });
			return true;
		})
	);

	app.get(
		"/removeDir",
		wrapWrite(async ({ dir }: { dir: string }) => {
			const full = ensureSafe(dir);
			const stat = await fs.stat(full);
			if (!stat.isDirectory()) throw new Error(`${full} 不是文件夹`);
			await fs.rm(full, { recursive: true, force: true });
			return true;
		})
	);

	app.get(
		"/readFile",
		wrap(async ({ fileName }: { fileName: string }) => {
			const full = ensureSafe(fileName);
			const data = await fs.readFile(full);
			return [...new Uint8Array(data)];
		})
	);

	app.get(
		"/readFileAsText",
		wrap(async ({ fileName }: { fileName: string }) => {
			const full = ensureSafe(fileName);
			return await fs.readFile(full, "utf-8");
		})
	);

	app.post(
		"/writeFile",
		{
			// 只读模式下把body上限压到最小，避免有人往内存里灌数据
			bodyLimit: cfg.readonly ? 1024 : 10 * 1024 * 1024 * 1024,
		},
		wrapWrite(async ({ path: p, data }: { path: string; data: number[] }) => {
			const full = ensureSafe(p);
			await fs.mkdir(path.dirname(full), { recursive: true });
			await fs.writeFile(full, Buffer.from(data));
			return true;
		})
	);

	app.get(
		"/removeFile",
		wrapWrite(async ({ fileName }: { fileName: string }) => {
			const full = ensureSafe(fileName);
			const stat = await fs.stat(full);
			if (stat.isDirectory()) throw new Error("不能删除文件夹");
			await fs.unlink(full);
			return true;
		})
	);

	app.get(
		"/getFileList",
		wrap(async ({ dir }: { dir: string }) => {
			const full = ensureSafe(dir);
			const stat = await fs.stat(full);
			if (stat.isFile()) throw new Error("路径不是文件夹");

			const entries = await fs.readdir(full);
			const files: string[] = [];
			const folders: string[] = [];

			await Promise.all(
				entries.map(async entry => {
					if (entry.startsWith(".") || entry.startsWith("_")) return;
					const s = await fs.stat(path.join(full, entry));
					s.isDirectory() ? folders.push(entry) : files.push(entry);
				})
			);

			return { folders, files };
		})
	);

	app.get(
		"/checkFile",
		wrap(async ({ fileName }: { fileName: string }) => {
			const full = ensureSafe(fileName);
			try {
				const stat = await fs.stat(full);
				if (stat.isFile()) return "file";
				else return "directory";
			} catch {
				return {};
			}
		})
	);

	app.get(
		"/checkDir",
		wrap(async ({ dir }: { dir: string }) => {
			const full = ensureSafe(dir);
			try {
				const stat = await fs.stat(full);
				if (stat.isFile()) return "file";
				else return "directory";
			} catch {
				return {};
			}
		})
	);

	app.setNotFoundHandler((req, reply) => {
		reply.code(404).send("Sorry can't find that!");
	});

	app.setErrorHandler((err, req, reply) => {
		reply.send(failedJson(400, String(err)));
	});

	const callback = () => {
		console.log(`Server listening on port ${cfg.port}`);
		if (!cfg.server && !cfg.debug) exec(`start http://localhost:${cfg.port}/`);
	};

	// if (config.https) {
	// 	const SSLOptions = {
	// 		key: fs.readFileSync(path.join(config.dirname, "localhost.decrypted.key")),
	// 		cert: fs.readFileSync(path.join(config.dirname, "localhost.crt")),
	// 	};
	// 	const httpsServer = https.createServer(SSLOptions, app);
	// 	// 会提示NET::ERR_CERT_AUTHORITY_INVALID
	// 	// 但浏览器还是可以访问的
	// 	// todo: 解决sw注册问题
	// 	httpsServer.listen(config.port, callback);
	// } else {
	// 	app.listen(config.port, callback);
	// }
	app.listen({ port: cfg.port }, callback);

	return app;
}
