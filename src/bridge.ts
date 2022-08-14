import { IPNet, IPNET_ALL } from "@doridian/jsip/lib/ethernet/ip/subnet.js";
import { Interface } from "@doridian/jsip";
import { InitParameters, WSVPNBase } from "@wsvpn/js";
import { Metric } from "@doridian/jsip/lib/ethernet/ip/router.js";

let maxNumber = 0;

export class WSVPNJSIP extends Interface {
    private init?: InitParameters = undefined;

    constructor(private adapter: WSVPNBase) {
        super(`wsvpn${maxNumber++}`);
        adapter.addEventListener("packet", (ev) => {
            this.handlePacket(ev.packet);
        });
    }

    public async connect() {
        const init = await this.adapter.connect();
        await this.handleInit(init);
    }

    public async close() {
        this.remove();
        await this.close();
    }

    public getServerIP() {
        return this.subnet?.getIP(1);
    }

    public mustGetserverIP() {
        const serverIp = this.getServerIP();
        if (!serverIp) {
            throw Error("Server IP is unset");
        }
        return serverIp;
    }

    public sendPacket(msg: ArrayBuffer) {
        this.adapter.sendPacket(msg);
    }

    public getMTU() {
        return this.init!.mtu;
    }

    public isEthernet() {
        return this.init!.mode === "TAP";
    }

    public addServerDNS() {
        this.addDNSServer(this.mustGetserverIP());
    }

    public removeServerDNS() {
        const serverIp = this.getServerIP();
        if (serverIp) {
            this.removeDNSServer(serverIp);
        }
    }

    private _makeDefaultRoute() {
        return { subnet: IPNET_ALL, router: this.mustGetserverIP(), metric: Metric.DHCPDefault };
    }

    public addServerDefaultGateway() {
        this.addRoute(this._makeDefaultRoute());
    }

    public removeDefaultGateway() {
        this.removeRoute(this._makeDefaultRoute());
    }

    private async handleInit(params: InitParameters) {
        this.init = params;

        this.clearRoutes();
        this.clearDNSServers();

        if (!params.do_ip_config) {
            console.info(`${this.getName()} starting DHCP procedure...`);
            return this.addDHCP().negotiate();
        }

        this.removeDHCP();

        const subnet = IPNet.fromString(params.ip_address);
        this.setSubnet(subnet);
        this.setIP(subnet.getCreationIP());

        this.add();
    }
}
