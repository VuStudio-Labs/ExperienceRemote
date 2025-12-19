import localtunnel from 'localtunnel';

interface Tunnel {
  url: string;
  close: () => void;
}

export class TunnelManager {
  private tunnel: Tunnel | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private localPort: number;
  private onUrlChange: ((url: string) => void) | null = null;

  constructor() {
    this.localPort = 3001;
  }

  async connect(localPort: number): Promise<string> {
    this.localPort = localPort;

    try {
      console.log(`Creating tunnel to localhost:${localPort}...`);

      const tunnel = await localtunnel({ port: localPort });

      this.tunnel = tunnel;
      this.reconnectAttempts = 0;

      console.log(`Tunnel established: ${tunnel.url}`);

      // Handle tunnel close/error
      tunnel.on('close', () => {
        console.log('Tunnel closed');
        this.tunnel = null;
        this.attemptReconnect();
      });

      tunnel.on('error', (err: Error) => {
        console.error('Tunnel error:', err);
      });

      return tunnel.url;
    } catch (err) {
      console.error('Failed to create tunnel:', err);
      throw err;
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect tunnel (attempt ${this.reconnectAttempts})...`);

    try {
      const url = await this.connect(this.localPort);
      this.onUrlChange?.(url);
    } catch (err) {
      console.error('Reconnect failed:', err);
      // Retry after delay
      setTimeout(() => this.attemptReconnect(), 5000);
    }
  }

  disconnect(): void {
    if (this.tunnel) {
      this.tunnel.close();
      this.tunnel = null;
    }
  }

  getUrl(): string | null {
    return this.tunnel?.url || null;
  }

  onUrlChanged(callback: (url: string) => void): void {
    this.onUrlChange = callback;
  }
}
