package io.github.jansky.ezroute;

class BusRoute {
    private Bus bus;
    private BusStop orgBusStop;
    private BusStop dstBusStop;

    public BusRoute(Bus bus, BusStop orgBusStop, BusStop dstBusStop) {
        this.bus = bus;
        this.orgBusStop = orgBusStop;
        this.dstBusStop = dstBusStop;
    }

    public Bus getBus() {
        return bus;
    }

    public BusStop getOrgBusStop() {
        return orgBusStop;
    }

    public BusStop getDstBusStop() {
        return dstBusStop;
    }
}
