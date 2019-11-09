package io.github.jansky.ezroute;

import android.content.Context;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.Volley;

/**
 * The Singleton class is a singleton that handles requests for the server calculations.
 * This code was adapted from the example code found on
 * https://developer.android.com/training/volley/requestqueue
 */
class Singleton {
    private static Singleton instance;
    private RequestQueue requestQueue;
    private static Context ctx;

    private Singleton(Context context) {
        ctx = context;
        requestQueue = getRequestQueue();
    }

    static synchronized Singleton getInstance(Context context) {
        if (instance == null) {
            instance = new Singleton(context);
        }
        return instance;
    }

    private RequestQueue getRequestQueue() {
        if (requestQueue == null) {
            // getApplicationContext() is key, it keeps you from leaking the
            // Activity or BroadcastReceiver if someone passes one in.
            requestQueue = Volley.newRequestQueue(ctx.getApplicationContext());
        }
        return requestQueue;
    }

    <T> void addToRequestQueue(Request<T> req) {
        getRequestQueue().add(req);
    }
}
