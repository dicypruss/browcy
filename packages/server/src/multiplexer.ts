import http from "node:http";
import { WebSocket } from "ws";

export interface MultiplexerOptions {
  basePort: number;
  maxPorts?: number;
}

export class AgentMultiplexer {
  private basePort: number;
  private maxPorts: number;
  private httpServer: http.Server;
  private currentPort: number | null = null;
  private isMasterNode: boolean = false;
  private activeClient: WebSocket | null = null;
  private knownPorts: Set<number> = new Set();

  constructor(options: MultiplexerOptions) {
    this.basePort = options.basePort;
    this.maxPorts = options.maxPorts || 10;
    
    // HTTP Server acts as the WebSocket server for the extension
    // and as an announcement channel for Secondary nodes
    this.httpServer = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/announce') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (!data || typeof data.port !== 'number') {
              res.writeHead(400);
              return res.end();
            }
            this.knownPorts.add(data.port);
            if (this.activeClient && this.activeClient.readyState === WebSocket.OPEN) {
              this.activeClient.send(JSON.stringify({ id: -1, action: "system_connect_port", payload: { port: data.port } }));
            }
            res.writeHead(200);
            res.end();
          } catch(e) {
            res.writeHead(500);
            res.end();
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  }

  public getServer(): http.Server {
    return this.httpServer;
  }

  public getActiveClient(): WebSocket | null {
    return this.activeClient;
  }

  public getPort(): number | null {
    return this.currentPort;
  }

  public isMaster(): boolean {
    return this.isMasterNode;
  }

  public setActiveClient(client: WebSocket | null) {
    this.activeClient = client;
    if (this.isMasterNode && client && client.readyState === WebSocket.OPEN) {
      // Send all previously announced ports to the newly connected extension
      for (const port of this.knownPorts) {
        client.send(JSON.stringify({ id: -1, action: "system_connect_port", payload: { port } }));
      }
    }
  }

  public async start(): Promise<{ port: number; isMaster: boolean }> {
    let bound = false;
    for (let port = this.basePort; port <= this.basePort + this.maxPorts; port++) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.httpServer.once('error', reject);
          this.httpServer.listen(port, '127.0.0.1', () => {
            this.httpServer.removeListener('error', reject);
            resolve();
          });
        });
        
        this.currentPort = port;
        this.isMasterNode = (port === this.basePort);
        bound = true;
        break;
      } catch (e: any) {
        if (e.code !== 'EADDRINUSE') {
          throw e;
        }
      }
    }

    if (!bound || this.currentPort === null) {
      throw new Error(`Could not bind to any port in range ${this.basePort}-${this.basePort + this.maxPorts}`);
    }

    // If we are Secondary, announce to Master
    if (!this.isMasterNode) {
      try {
        await fetch(`http://127.0.0.1:${this.basePort}/announce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ port: this.currentPort })
        });
      } catch (err: any) {
        console.error("Failed to announce to Primary node (it may be restarting):", err.message);
      }
    }

    return { port: this.currentPort, isMaster: this.isMasterNode };
  }
}
