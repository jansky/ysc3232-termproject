package io.github.jansky.ezroute;

import androidx.annotation.Nullable;

/**
 * <b>BusRoute</b> contains a Bus and the origin and destination
 * BusStop, including the number of stops between the origin and destination,
 * inclusive of both stops.
 */
class BusRoute {
    private Bus bus;
    private BusStop orgBusStop;
    private BusStop dstBusStop;
    private int numStops;

    /**
     * Constructor for BusRoutes
     * @param bus a Bus
     * @param orgBusStop the starting/origin BusStop
     * @param dstBusStop the ending/destination BusStop
     * @param numStops the number of stops on the route
     */
    public BusRoute(Bus bus, BusStop orgBusStop, BusStop dstBusStop, int numStops) {
        this.bus = bus;
        this.orgBusStop = orgBusStop;
        this.dstBusStop = dstBusStop;
        this.numStops = numStops;
    }

    /**
     * getNumStops() gets the number of stops of the BusRoute
     * @return number of bus stops
     */
    public int getNumStops() {
        return numStops;
    }

    /**
     * getBus() gets the bus associated with the BusRoute
     * @return a Bus
     */
    public Bus getBus() {
        return bus;
    }

    /**
     * getOrgBusStop() gets the origin BusStop of the BusRoute
     * @return
     */
    public BusStop getOrgBusStop() {
        return orgBusStop;
    }

    /**
     * getDstBusStop() gets the destination BusStop of the BusRoute
     * @return
     */
    public BusStop getDstBusStop() {
        return dstBusStop;
    }

    /**
     * BusRoute equality checks to see if the Bus, origin BusStop,
     * destination BusStop, and number of stops is the same. Generally, a bus route
     * would be equal if it has the same bus, origin, and destination location, but
     * checking for number of bus stops would account for express buses. Although
     * express buses should have an additional suffix lettering to its service number
     * (like 33A or 151A), checking the number of stops is another assurance of equality
     * @param obj Any object
     * @return true if both BusRoutes have the same Bus, origin/destination BusStop, and number of
     * bus stops, false otherwise
     */
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
