import { WSVPNJSIP } from "./bridge";
import { WSVPNErrorEvent, WSVPNWebSocket } from "@wsvpn/js";
import { initialize } from "@doridian/jsip";
import { enableTCP, enableTCPEcho, TCPConn } from "@doridian/jsip/lib/ethernet/ip/tcp/stack";
import { dnsResolveOrIp } from "@doridian/jsip/lib/ethernet/ip/udp/dns/stack";

const win = (window as any);

export async function main() {
    initialize();
    enableTCP();
    enableTCPEcho();

    const transport = new WSVPNWebSocket("ws://10.99.10.1:9000");
    transport.addEventListener("error", (ev: WSVPNErrorEvent) => {
        console.error("ERR", ev.error);
    });
    transport.addEventListener("close", () => {
        console.warn("CLOSE");
    });
    
    const iface = new WSVPNJSIP(transport);

    await iface.connect();
    await iface.addServerDefaultGateway();
    console.log("Connected!");

    win.TCPConn = TCPConn;
    win.dnsResolveOrIp = dnsResolveOrIp;
}

main().catch(e => console.error(e));
