import { IPNet, IPNET_ALL } from "@doridian/jsip/dist/ethernet/ip/subnet";
import { Interface } from "@doridian/jsip";
import { InitParameters, WSVPNBase } from "@wsvpn/js";

let maxNumber = 0;

export class WSVPNJSIP extends Interface {
    private init?: InitParameters = undefined;

    constructor(private adapter: WSVPNBase) {
        super(`wsvpn${maxNumber++}`);
        adapter.addEventListener("packet", (ev) => {
            this.handlePacket(ev.packet.buffer.slice(ev.packet.byteOffset, ev.packet.byteLength));
        });
    }

    public async connect() {
        const init = await this.adapter.connect();
        await this.handleInit(init);
    }

    public sendPacket(msg: ArrayBuffer) {
        this.adapter.sendPacket(new Uint8Array(msg));
    }

    public getMTU() {
        return this.init!.mtu;
    }

    public isEthernet() {
        return this.init!.mode === "TAP";
    }

    private handleInit(params: InitParameters) {
        this.init = params;

        let needDHCP = false;

        this.clearRoutes();
        this.clearDNSServers();

        if (!params.do_ip_config) {
            needDHCP = true;
        } else {
            const subnet = IPNet.fromString(params.ip_address);
            this.setIP(subnet.getCreationIP());
            this.addRoute(subnet, undefined);
            const serverIp = subnet.getBaseIP();
            this.addRoute(IPNET_ALL, serverIp);
            this.addDNSServer(serverIp);
        }

        if (needDHCP) {
            console.info(`${this.getName()} starting DHCP procedure...`);
            return this.addDHCP().negotiate();
        } else {
            return Promise.resolve();
        }
    }
}

