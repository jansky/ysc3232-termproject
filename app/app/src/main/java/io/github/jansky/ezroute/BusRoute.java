package io.github.jansky.ezroute;

import androidx.annotation.Nullable;

class BusRoute {
    private Bus bus;
    private BusStop orgBusStop;
    private BusStop dstBusStop;
    private int numStops;

    public BusRoute(Bus bus, BusStop orgBusStop, BusStop dstBusStop, int numStops) {
        this.bus = bus;
        this.orgBusStop = orgBusStop;
        this.dstBusStop = dstBusStop;
        this.numStops = numStops;
    }

    public int getNumStops() {
        return numStops;
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

    @Override
    public boolean equals(@Nullable Object obj) {
        if (obj instanceof BusRoute) {
            BusRoute route = (BusRoute) obj;
            return this.numStops == route.getNumStops() &&
                    this.getBus().equals(route.getBus()) &&
                    this.getOrgBusStop().equals(route.getOrgBusStop()) &&
                    this.getDstBusStop().equals(route.getDstBusStop());
        }
        return false;
    }
}
