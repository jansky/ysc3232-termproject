package io.github.jansky.ezroute;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.DefaultItemAnimator;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.android.volley.DefaultRetryPolicy;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.RetryPolicy;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.google.android.gms.maps.model.LatLng;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * BusRoutesListActivity is the activity that contains and generates
 * all the BusRoutes viewed on screen.
 */
public class BusRoutesListActivity extends AppCompatActivity {
    private static final String TAG = "BusRoutesList";

    private LatLng destination;
    private LatLng origin;
    private RecyclerView recyclerView;
    private BusRoutesAdapter busRoutesAdapter;

    /**
     * onCreate() overrides the default method on what occurs when this
     * activity is created. In this use, it will create the container to display
     * the list of BusRoutes, as well as instruct a thread to receive the calculations
     * done by the server.
     * @param savedInstanceState the Bundle of information passed by the MapsActivity
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_bus_routes_list);

        Intent intent = getIntent();
        Bundle bundle = intent.getParcelableExtra(MapsActivity.BUNDLE);
        destination = bundle.getParcelable(MapsActivity.DESTINATION_KEY);
        origin = bundle.getParcelable(MapsActivity.ORIGIN_KEY);
        Log.i(TAG, "destination: " + destination.toString());
        Log.i(TAG, "origin: " + origin.toString());

        String orgLat = String.valueOf(origin.latitude);
        String orgLng = String.valueOf(origin.longitude);
        String dstLat = String.valueOf(destination.latitude);
        String dstLng = String.valueOf(destination.longitude);
        calculateRoute(orgLat, orgLng, dstLat, dstLng);
    }

    /**
     * calculateRoute() will perform a request to the backend server to
     * get the routes from the origin location to the destination location.
     * It will also a worker thread in the RequestQueue to update the view once
     * the calculations are complete.
     * @param orgLat string format of the origin location's latitude in decimal degrees
     * @param orgLng string format of the origin location's longitude in decimal degrees
     * @param dstLat string format of the destination location's latitude in decimal degrees
     * @param dstLng string format of the destination location's longitude in decimal degrees
     */
    private void calculateRoute(String orgLat, String orgLng, String dstLat, String dstLng) {
        Log.d(TAG, "starting to calculate route");
        String url = "https://ezroute.janskyd.com/findroute?originlong=" + orgLng +
                "&originlat=" + orgLat + "&destlong=" + dstLng + "&destlat=" + dstLat;

        // TODO: deal with error on json response
        JsonObjectRequest jsonObjectRequest = new JsonObjectRequest
                (Request.Method.GET, url, null, new Response.Listener<JSONObject>() {

                    @Override
                    public void onResponse(JSONObject response) {
                        Log.d(TAG, response.toString());
                        List<BusRoute> busRoutes = new ArrayList<>();
                        try {
                            if (response.getString("error").equals("none")){
                                JSONArray route = response.getJSONObject("route").getJSONArray("segments");
                                for (int i = 0; i < route.length(); i++) {
                                    Bus bus = new Bus(route.getJSONObject(i)
                                            .getJSONObject("busService").getInt("ServiceNo"));
                                    JSONArray busStops = route.getJSONObject(i).getJSONArray("busStops");
                                    BusStop orgBusStop = new BusStop(busStops.getJSONObject(0)
                                            .getString("Description"));
                                    BusStop dstBusStop = new BusStop(busStops.getJSONObject(busStops.length() - 1)
                                            .getString("Description"));
                                    int numStops = busStops.length();
                                    BusRoute busRoute = new BusRoute(bus, orgBusStop, dstBusStop, numStops);
                                    busRoutes.add(busRoute);
                                    Log.d(TAG, "done adding bus routes, size: " + busRoutes.size());
                                    populateView(busRoutes);
                                }
                            } else {
                                throw new IllegalArgumentException();
                            }
                        } catch (Exception e) {
                            Log.e(TAG, e.toString());
                            errorView();
                        }
                    }
                }, new Response.ErrorListener() {

                    @Override
                    public void onErrorResponse(VolleyError error) {
                        errorView();
                    }
                });
        RetryPolicy retryPolicy = new DefaultRetryPolicy(10000,
                DefaultRetryPolicy.DEFAULT_MAX_RETRIES, DefaultRetryPolicy.DEFAULT_BACKOFF_MULT);
        jsonObjectRequest.setRetryPolicy(retryPolicy);
        Singleton.getInstance(this).addToRequestQueue(jsonObjectRequest);
    }

    /**
     * populateView() will populate and update the view on the screen
     * with all the bus routes that the backend server had calculated.
     * It will also remove the progress bar when the routes are done calculating
     * @param busRoutes the list of BusRoutes calculated by the server
     */
    private void populateView(List<BusRoute> busRoutes) {
        findViewById(R.id.progress_bar).setVisibility(View.GONE);
        busRoutesAdapter = new BusRoutesAdapter(this, busRoutes);
        recyclerView = findViewById(R.id.bus_routes_list);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setItemAnimator(new DefaultItemAnimator());
        recyclerView.setAdapter(busRoutesAdapter);
    }

    /**
     * errorView() will show the sorry error message if the server fails to respond
     * or calculate a route.
     */
    private void errorView() {
        findViewById(R.id.progress_bar).setVisibility(View.GONE);
        findViewById(R.id.sorry_message).setVisibility(View.VISIBLE);
    }

}
