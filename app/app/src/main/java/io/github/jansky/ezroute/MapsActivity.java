package io.github.jansky.ezroute;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;

import com.google.android.gms.common.api.Status;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.android.libraries.places.api.Places;
import com.google.android.libraries.places.api.model.Place;
import com.google.android.libraries.places.api.model.RectangularBounds;
import com.google.android.libraries.places.widget.AutocompleteSupportFragment;
import com.google.android.libraries.places.widget.listener.PlaceSelectionListener;

import java.util.Arrays;

/**
 * The MapsActivity is the functionality of the Google Maps view
 * that is on screen. It will allow the user to find and navigate to a destination location
 * using the Google Places api.
 */
public class MapsActivity extends FragmentActivity implements OnMapReadyCallback {

    // constants
    private static final String TAG = "MapActivity";
    private static final String FINE_LOCATION = Manifest.permission.ACCESS_FINE_LOCATION;
    private static final String COARSE_LOCATION = Manifest.permission.ACCESS_COARSE_LOCATION;
    private static final int LOCATION_REQUEST_CODE = 1111;
    private static final float DEFAULT_ZOOM = 17f;
    public static final String DESTINATION_KEY = "io.github.jansky.ezroute.DESTINATION_KEY";
    public static final String ORIGIN_KEY = "io.github.jansky.ezroute.ORIGIN_KEY";
    public static final String BUNDLE = "io.github.jansky.ezroute.BUNDLE";

    // variables
    private GoogleMap mMap;
    private Marker marker;
    private boolean mLocationPermissionGranted = false;
    private FusedLocationProviderClient mFusedLocationProviderClient;
    private AutocompleteSupportFragment autocompleteSupportFragment;
    private LatLng destinationLocation = null;
    private LatLng originLocation = null;

    /**
     * onCreate() overrides the default onCreate method. It will set the screen to
     * the current location of the user and restrict the search bounds to Singapore
     * @param savedInstanceState bundle of information, but not used as it is the default
     *                           starting activity of the application.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);
        final Button navigateButton = findViewById(R.id.navigate_button);
        navigateButton.setVisibility(View.GONE);
        if (!Places.isInitialized()) {
            Places.initialize(getApplicationContext(), getString(R.string.google_maps_key));
        }

        final AutocompleteSupportFragment autocompleteSupportFragment = (AutocompleteSupportFragment)
                getSupportFragmentManager().findFragmentById(R.id.autocomplete_fragment);

        autocompleteSupportFragment.setPlaceFields(Arrays.asList(Place.Field.ID, Place.Field.NAME,
                Place.Field.LAT_LNG));
        RectangularBounds bounds = RectangularBounds.newInstance(
                new LatLng(1.1304753, 103.6920359),
                new LatLng(1.4504753, 104.0120359)
        );
        autocompleteSupportFragment.setLocationRestriction(bounds);

        autocompleteSupportFragment.setOnPlaceSelectedListener(new PlaceSelectionListener() {
            @Override
            public void onPlaceSelected(Place place) {
                // TODO: Get info about the selected place.
                LatLng latLng = place.getLatLng();
                destinationLocation = latLng;
                updateCamera(latLng, DEFAULT_ZOOM);
                marker = mMap.addMarker(new MarkerOptions().position(latLng));
                navigateButton.setVisibility(View.VISIBLE);
                Log.i(TAG, "Place: " + place.getName() + ", " + destinationLocation);
            }

            @Override
            public void onError(Status status) {
                Log.i(TAG, "An error occurred: " + status);
            }
        });

        autocompleteSupportFragment.getView().findViewById(R.id.places_autocomplete_clear_button)
                .setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        ((EditText) autocompleteSupportFragment.getView().
                                findViewById(R.id.places_autocomplete_search_input)).setText("");
                        marker.remove();
                        navigateButton.setVisibility(View.GONE);
                    }
                });

        // check to see if permissions is correct, then initialize map
        getLocationPermission();
    }

    /**
     * onMapReady() defines what happens when the map is ready and loaded.
     * It will check to see if the user's location permissions are allowed
     * for the app's usage.
     * @param googleMap the base GoogleMap
     */
    @Override
    public void onMapReady(GoogleMap googleMap) {
        Log.d(TAG, "map is ready to load");
        mMap = googleMap;
        if (mLocationPermissionGranted) {
            getDeviceLocation();

            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                    != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this,
                    Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                return;
            }
            mMap.setMyLocationEnabled(true);
        }
    }

    /**
     * navigateRoute() gathers the origin location and destination location
     * and starts the activity to display the routes as a list. This is triggered
     * when the button is clicked.
     * @param view
     */
    public void navigateRoute(View view) {
        Bundle bundle = new Bundle();
        bundle.putParcelable(DESTINATION_KEY, destinationLocation);
        bundle.putParcelable(ORIGIN_KEY, originLocation);
        Intent intent = new Intent(this, BusRoutesListActivity.class);
        intent.putExtra(BUNDLE, bundle);
        startActivity(intent);
    }

    /**
     * initMap() initializes the map for the application to display.
     */
    private void initMap() {
        Log.d(TAG, "initializing map");
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);
    }

    /**
     * getLocationPermission() will check and prompt the user to enable
     * location permissions to be used by the application.
     */
    private void getLocationPermission() {
        Log.d(TAG, "getting location permissions");
        String[] permissions = {FINE_LOCATION, COARSE_LOCATION};

        if (ContextCompat.checkSelfPermission(this.getApplicationContext(), FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(this.getApplicationContext(), COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED) {
            mLocationPermissionGranted = true;
            initMap();
        } else {
            ActivityCompat.requestPermissions(this, permissions, LOCATION_REQUEST_CODE);
        }
    }

    /**
     * onRequestPermissionsResult() will check through the permissions to see if everything
     * is properly given. If so, it will allow the user to run the application.
     * @param requestCode A request code that is unique to the message request
     * @param permissions the string array of permissions that it will check
     * @param grantResults the values of grantResults that indicate if a permission
     *                     has or has not been granted.
     */
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        mLocationPermissionGranted = false;

        switch (requestCode) {
            case LOCATION_REQUEST_CODE: {
                if (grantResults.length > 0) {
                    for (int grantResult : grantResults) {
                        if (grantResult != PackageManager.PERMISSION_GRANTED) {
                            return;
                        }
                    }
                    mLocationPermissionGranted = true;
                    initMap();
                }
            }
        }
    }

    /**
     * getDeviceLocation() will get the device's location and display it on the map
     */
    private void getDeviceLocation() {
        Log.d(TAG, "getting device current location");

        mFusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(this);

        try {
            if (mLocationPermissionGranted) {
                final Task location = mFusedLocationProviderClient.getLastLocation();
                location.addOnCompleteListener(new OnCompleteListener() {
                    @Override
                    public void onComplete(@NonNull Task task) {
                        if (task.isSuccessful()) {
                            Log.d(TAG, "location found");
                            Location currentLocation = (Location) task.getResult();
                            originLocation = new LatLng(currentLocation.getLatitude(), currentLocation.getLongitude());
                            updateCamera(originLocation, DEFAULT_ZOOM);
                            Log.d(TAG, "origin location: " + originLocation);
                        } else {
                            Log.d(TAG, "couldn't get current location");
                        }
                    }
                });
            }
        } catch (SecurityException e) {
            Log.e(TAG, "getDeviceLocation SecurityException: " + e.getMessage());
        }
    }

    /**
     * updateCamera() will move the camera to the location desired and will change the
     * zoom level accordingly
     * @param latLng location of where the camera should pan to
     * @param zoom the zoom level the camera should be set to at the location
     */
    private void updateCamera(LatLng latLng, float zoom) {
        Log.d(TAG, "updating camera: " + latLng.latitude + ", " + latLng.longitude);
        mMap.clear();
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(latLng, zoom));
        hideKeyboard();
    }

    /**
     * hideKeyboard() makes sure that the system keyboard is hidden when an action is performed.
     */
    private void hideKeyboard() {
        View view = this.getCurrentFocus();
        if (view != null) {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }
}
