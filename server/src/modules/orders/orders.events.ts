import type { Response } from 'express';

interface SSEClient {
  id: string;
  tenantId: string;
  outletId?: string;
  res: Response;
}

class OrderEventEmitter {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, tenantId: string, outletId: string | undefined, res: Response) {
    this.clients.set(id, { id, tenantId, outletId, res });

    res.on('close', () => {
      this.clients.delete(id);
    });
  }

  broadcast(tenantId: string, event: string, data: unknown, outletId?: string) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const client of this.clients.values()) {
      if (client.tenantId !== tenantId) continue;
      if (outletId && client.outletId && client.outletId !== outletId) continue;

      try {
        client.res.write(payload);
      } catch {
        this.clients.delete(client.id);
      }
    }
  }
}

export const orderEvents = new OrderEventEmitter();
