export interface ServerOptions {
	port?: number;
	/** 监听地址。留空为监听所有网卡；公网部署时应设为 127.0.0.1，只允许本机的隧道进程接入 */
	host?: string;
}

export interface ServerInstance {
	start(): Promise<void>;
	stop(): Promise<void>;
}
