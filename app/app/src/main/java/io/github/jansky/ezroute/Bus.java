package io.github.jansky.ezroute;

import androidx.annotation.Nullable;

public class Bus {
    private int busNumber;

    Bus(int busNumber) {
        this.busNumber = busNumber;
    }

    public int getBusNumber() {
        return busNumber;
    }

    @Override
    public boolean equals(@Nullable Object obj) {
        if (obj instanceof Bus)
            return this.busNumber == ((Bus) obj).getBusNumber();
        return false;
    }
}
