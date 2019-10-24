package io.github.jansky.ezroute;

import android.app.IntentService;
import android.content.Intent;
import android.location.Address;
import android.location.Geocoder;
import android.util.Log;

import androidx.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class FetchAddressIntentService extends IntentService {
    private static final String TAG = "FetchAddress";
    public FetchAddressIntentService(String name) {
        super(name);
    }

    @Override
    protected void onHandleIntent(@Nullable Intent intent) {
        if (intent == null)
            return;

        Geocoder geocoder = new Geocoder(this, Locale.getDefault());
        List<Address> locations = new ArrayList<>();

        try {
            locations = geocoder.getFromLocationName(intent.getExtras().getString("location"), 1);
        } catch (Exception e) {
            Log.e(TAG, "geolocate exception: " + e.getMessage());
        }

        if (locations.size() == 0) {
            Log.e(TAG, "no locations found");
            return;
        } else {

        }
    }
}
