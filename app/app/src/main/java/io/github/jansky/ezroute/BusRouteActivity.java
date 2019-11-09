package io.github.jansky.ezroute;

import android.os.Bundle;

import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.snackbar.Snackbar;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import android.view.View;

/**
 * BusRouteActivity is the activity for each individual bus route. It needs
 * to be defined so that the RecyclerView.Adapter can create individual
 * activities for each BusRoute to populate the list.
 */
public class BusRouteActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_bus_route);
    }

}
