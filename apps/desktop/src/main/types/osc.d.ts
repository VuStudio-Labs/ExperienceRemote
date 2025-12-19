declare module 'osc' {
  export class UDPPort {
    constructor(options: {
      localAddress: string;
      localPort: number;
      remoteAddress: string;
      remotePort: number;
    });
    on(event: 'error', callback: (err: Error) => void): void;
    on(event: 'message', callback: (message: any) => void): void;
    open(): void;
    close(): void;
    send(message: { address: string; args?: any[] }): void;
  }
}
