package io.github.jansky.ezroute;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.DefaultItemAnimator;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.google.android.gms.maps.model.LatLng;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class BusRoutesListActivity extends AppCompatActivity {
    private static final String TAG = "BusRoutesList";

    private LatLng destination;
    private LatLng origin;
    private RequestQueue queue;
    private RecyclerView recyclerView;
    private BusRoutesAdapter busRoutesAdapter;

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
        queue = Volley.newRequestQueue(this);
        calculateRoute(orgLat, orgLng, dstLat, dstLng);
    }

    private void calculateRoute(String orgLat, String orgLng, String dstLat, String dstLng) {
        String url = "https://ezroute.janskyd.com/findroute?originlong=" + orgLng +
                "&originlat=" + orgLat + "&destlong=" + dstLng + "&destlat=" + dstLat;

        JsonObjectRequest jsonObjectRequest = new JsonObjectRequest
                (Request.Method.GET, url, null, new Response.Listener<JSONObject>() {

                    @Override
                    public void onResponse(JSONObject response) {
                        Log.d(TAG, response.toString());
                        List<BusRoute> busRoutes = new ArrayList<>();
                        try {
                            JSONArray route = response.getJSONObject("route").getJSONArray("segments");
                            for (int i = 0; i < route.length(); i++) {
                                Bus bus = new Bus(route.getJSONObject(i)
                                        .getJSONObject("busService").getInt("ServiceNo"));
                                JSONArray busStops = route.getJSONObject(i).getJSONArray("busStops");
                                BusStop orgBusStop = new BusStop(busStops.getJSONObject(0)
                                        .getString("Description"));
                                BusStop dstBusStop = new BusStop(busStops.getJSONObject(busStops.length() - 1)
                                        .getString("Description"));
                                BusRoute busRoute = new BusRoute(bus, orgBusStop, dstBusStop);
                                busRoutes.add(busRoute);
                            }
                        } catch (JSONException e) {
                            Log.e(TAG, e.toString());
                        }
                        Log.d(TAG, "done adding bus routes, size: " + busRoutes.size());
                        populateView(busRoutes);
                    }
                }, new Response.ErrorListener() {

                    @Override
                    public void onErrorResponse(VolleyError error) {
                        // TODO: Handle error

                    }
                });
        queue.add(jsonObjectRequest);
    }

    private void populateView(List<BusRoute> busRoutes) {
        busRoutesAdapter = new BusRoutesAdapter(this, busRoutes);
        recyclerView = findViewById(R.id.bus_routes_list);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setItemAnimator(new DefaultItemAnimator());
        recyclerView.setAdapter(busRoutesAdapter);
    }

}
