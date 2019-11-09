package io.github.jansky.ezroute;

import androidx.annotation.Nullable;

/**
 * <b>BusStop</b> is the representation of a bus stop in Singapore.
 * Each bus stop has a unique name.
 */
public class BusStop {
    private String name;

    /**
     * Constructor for a BusStop
     * @param name the name of the bus stop
     */
    public BusStop(String name) {
        this.name = name;
    }

    /**
     * getName() returns the name of the bus stop.
     * @return name of the bus stop
     */
    public String getName() {
        return name;
    }

    /**
     * BusStop equality checks to see if the object compared
     * is an instance of BusStop and has the same name as this BusStop,
     * otherwise it returns false
     * @param obj Any object
     * @return true if the object is a BusStop and has the same name, false
     * otherwise
     */
    @Override
    public boolean equals(@Nullable Object obj) {
        if (obj instanceof BusStop)
            return this.name.equals(((BusStop) obj).getName());
        return false;
    }
}
