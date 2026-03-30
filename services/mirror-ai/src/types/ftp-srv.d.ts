declare module "ftp-srv" {
  type LoginResolve = (value: { root: string; cwd?: string }) => void;
  type LoginReject = (error: Error) => void;

  interface LoginContext {
    username: string;
    password: string;
  }

  interface ClientErrorPayload {
    context?: unknown;
    error: Error;
  }

  interface ServerErrorPayload {
    error: Error;
  }

  export default class FtpSrv {
    constructor(options: {
      url: string;
      anonymous?: boolean;
      greeting?: string[];
    });
    on(event: "login", listener: (ctx: LoginContext, resolve: LoginResolve, reject: LoginReject) => void): this;
    on(event: "client-error", listener: (payload: ClientErrorPayload) => void): this;
    on(event: "server-error", listener: (payload: ServerErrorPayload) => void): this;
    listen(): Promise<void>;
    close(): Promise<void>;
  }
}
