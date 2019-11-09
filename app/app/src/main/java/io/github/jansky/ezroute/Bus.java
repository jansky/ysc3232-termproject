package io.github.jansky.ezroute;

import androidx.annotation.Nullable;

/**
 * <b>Bus</b> represent the various buses in Singapore
 */
public class Bus {
    private int busNumber;

    /**
     * This creates bus objects of a certain bus number
     * @param busNumber the unique service number for a bus
     */
    Bus(int busNumber) {
        this.busNumber = busNumber;
    }

    /**
     * getBusNumber() gets the service number of the bus
     * @return service number of the bus
     */
    public int getBusNumber() {
        return busNumber;
    }

    /**
     * Comparison of buses will return true if both buses have the same
     * service number, false otherwise
     * @param obj Any object
     * @return true if the obj is a bus and has the same service number, false otherwise
     */
    @Override
    public boolean equals(@Nullable Object obj) {
        if (obj instanceof Bus)
            return this.busNumber == ((Bus) obj).getBusNumber();
        return false;
    }
}
