import { WSVPNJSIP } from "./bridge";
import { WSVPNWebTransport, WSVPNErrorEvent } from "@wsvpn/web";
import { enableProtocols } from "@doridian/jsip";

export async function main() {
    enableProtocols();

    const transport = new WSVPNWebTransport("https://local.foxden.network:9000");
    transport.addEventListener("error", (ev: WSVPNErrorEvent) => {
        console.error("ERR", ev.error);
    });
    transport.addEventListener("close", () => {
        console.warn("CLOSE");
    });
    
    const iface = new WSVPNJSIP(transport);

    await iface.connect();
    console.log("Connected!");
}

main().catch(e => console.error(e));
