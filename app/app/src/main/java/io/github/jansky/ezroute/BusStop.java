package io.github.jansky.ezroute;

import androidx.annotation.Nullable;

public class BusStop {
    private String name;

    public BusStop(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    @Override
    public boolean equals(@Nullable Object obj) {
        if (obj instanceof BusStop)
            return this.name == ((BusStop) obj).getName();
        return false;
    }
}
