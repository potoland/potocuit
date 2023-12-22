import WebSocket from "ws";
// import UWebSocket from 'uWebSockets.js';

export class BaseSocket {
    private internal: WebSocket;

    constructor(kind: "ws" | "uws", url: string) {
        this.internal = kind === "ws" ? new WebSocket(url) : new WebSocket(url);
    }

    set onopen(callback: WebSocket["onopen"]) {
        this.internal.onopen = callback;
    }

    set onmessage(callback: WebSocket["onmessage"]) {
        this.internal.onmessage = callback;
    }

    set onclose(callback: WebSocket["onclose"]) {
        this.internal.onclose = callback;
    }

    set onerror(callback: WebSocket["onerror"]) {
        this.internal.onerror = callback;
    }

    send(data: string) {
        return this.internal.send(data);
    }

    close(...args: Parameters<WebSocket["close"]>) {
        return this.internal.close(...args);
    }

    get readyState() {
        return this.internal.readyState;
    }
}
