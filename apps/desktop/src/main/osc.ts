import osc from 'osc';

export class OSCSender {
  private udpPort: osc.UDPPort;
  public host: string;
  public port: number;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;

    this.udpPort = new osc.UDPPort({
      localAddress: '0.0.0.0',
      localPort: 0, // Random local port
      remoteAddress: host,
      remotePort: port,
    });

    this.udpPort.on('error', (err: Error) => {
      console.error('OSC error:', err);
    });

    this.udpPort.open();
  }

  send(address: string, args: any[] = []): void {
    try {
      this.udpPort.send({
        address,
        args,
      });
      console.log(`OSC sent: ${address}`, args);
    } catch (err) {
      console.error('OSC send error:', err);
    }
  }

  sendMedia(action: string): void {
    this.send(`/remote/media/${action}`);
  }

  sendTrigger(trigger: number): void {
    this.send(`/remote/osc/${trigger}`);
  }

  sendVolume(value: number): void {
    this.send('/remote/volume', [{ type: 'i', value }]);
  }

  updateSettings(host: string, port: number): void {
    this.host = host;
    this.port = port;

    // Close and reopen with new settings
    this.udpPort.close();

    this.udpPort = new osc.UDPPort({
      localAddress: '0.0.0.0',
      localPort: 0,
      remoteAddress: host,
      remotePort: port,
    });

    this.udpPort.on('error', (err: Error) => {
      console.error('OSC error:', err);
    });

    this.udpPort.open();
  }

  close(): void {
    this.udpPort.close();
  }
}
