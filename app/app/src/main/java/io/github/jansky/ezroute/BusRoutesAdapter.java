package io.github.jansky.ezroute;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

/**
 * <b>BusRoutesAdapter</b> takes BusRouteActivities and will generate the
 * list display structure for the BusRouteListActivity.
 */
public class BusRoutesAdapter extends RecyclerView.Adapter<BusRoutesAdapter.ViewHolder> {
    private List<BusRoute> busRoutes;
    private LayoutInflater layoutInflater;

    /**
     * The inner ViewHolder encapsulates the structure of the
     * activity_bus_route layout and assigns the text values to the
     * appropriate locations
     */
    public class ViewHolder extends RecyclerView.ViewHolder {
        TextView busNumber, orgBusStop, dstBusStop;
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            busNumber = itemView.findViewById(R.id.bus_number);
            orgBusStop = itemView.findViewById(R.id.org_bus_stop);
            dstBusStop = itemView.findViewById(R.id.dst_bus_stop);
        }
    }

    /**
     * BusRoutesAdapter takes in BusRoutes and generates the visual
     * activity_bus_route seen on the screen
     * @param context context of the application
     * @param busRoutes a list of BusRoutes sorted in order of which
     *                  bus needs to be boarded first
     */
    BusRoutesAdapter(Context context, List<BusRoute> busRoutes) {
        this.layoutInflater = LayoutInflater.from(context);
        this.busRoutes = busRoutes;
    }

    /**
     * onCreateViewHolder() will create the individual routes viewed on screen. This is used
     * internally by the RecyclerView.Adapter class.
     * @param parent a ViewGroup
     * @param viewType a view type
     * @return a ViewHolder
     */
    @NonNull
    @Override
    public BusRoutesAdapter.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View itemView = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.activity_bus_route, parent, false);

        return new BusRoutesAdapter.ViewHolder(itemView);
    }

    /**
     * onBindViewHolder() is a method used internally by RecyclerView.Adapter. It sets the text
     * for each of the individual view rows.
     * @param holder a ViewHolder
     * @param position an index position of the list
     */
    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        BusRoute busRoute = busRoutes.get(position);
        holder.busNumber.setText(String.valueOf(busRoute.getBus().getBusNumber()));
        holder.orgBusStop.setText(busRoute.getOrgBusStop().getName());
        holder.dstBusStop.setText(busRoute.getDstBusStop().getName());
    }

    /**
     * getItemCount() is used internally by RecyclerView.Adapter and it should
     * return the amount of items, which in this case is the amount of BusRoutes
     * @return number of items
     */
    @Override
    public int getItemCount() {
        return busRoutes.size();
    }


}
