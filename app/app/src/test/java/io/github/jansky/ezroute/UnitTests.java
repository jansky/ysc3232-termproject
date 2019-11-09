package io.github.jansky.ezroute;

import org.json.JSONObject;
import org.junit.Test;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import static org.junit.Assert.*;

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
public class UnitTests {
    private static final int BUS_NO = 11;
    private static final String BUS_STOP_1 = "some bus stop";
    private static final String BUS_STOP_2 = "another bus stop";
    private static final int NUM_STOPS_1 = 3;
    private static final double ORG_LAT = 1.307873;
    private static final double ORG_LNG = 103.772014;
    private static final double DST_LAT = 1.360216;
    private static final double DST_LNG = 103.989691;

    @Test
    public void bus_has_id_number() {
        Bus bus = new Bus(BUS_NO);
        assertEquals(bus.getBusNumber(), BUS_NO);
    }

    @Test
    public void bus_stop_has_name() {
        BusStop busStop = new BusStop(BUS_STOP_1);
        assertEquals(busStop.getName(), BUS_STOP_1);
    }

    @Test
    public void bus_route_has_bus_and_stops() {
        Bus bus = new Bus(BUS_NO);
        BusStop org = new BusStop(BUS_STOP_1);
        BusStop dst = new BusStop(BUS_STOP_2);

        BusRoute busRoute = new BusRoute(bus, org, dst, NUM_STOPS_1);
        assertEquals(busRoute.getBus(), bus);
        assertEquals(busRoute.getOrgBusStop(), org);
        assertEquals(busRoute.getDstBusStop(), dst);
        assertEquals(busRoute.getNumStops(), NUM_STOPS_1);
    }

    @Test
    public void bus_route_equality_makes_sense() {
        Bus bus = new Bus(BUS_NO);
        BusStop org = new BusStop(BUS_STOP_1);
        BusStop dst = new BusStop(BUS_STOP_2);

        BusRoute busRoute = new BusRoute(bus, org, dst, NUM_STOPS_1);
        BusRoute anotherRoute = new BusRoute(bus, org, dst, NUM_STOPS_1);
        assertEquals(busRoute, anotherRoute);
    }

    @Test
    public void should_get_json_response_from_server() {
        String url = "https://ezroute.janskyd.com/findroute?originlong=" + ORG_LNG +
                "&originlat=" + ORG_LAT + "&destlong=" + DST_LNG + "&destlat=" + DST_LAT;

        try {
            URL serverURL = new URL(url);
            HttpURLConnection con = (HttpURLConnection) serverURL.openConnection();
            con.setRequestMethod("GET");
            int responseCode = con.getResponseCode();
            assertEquals(responseCode, HttpURLConnection.HTTP_OK);
        } catch (Exception e) {
            assert false;
        }
    }
}