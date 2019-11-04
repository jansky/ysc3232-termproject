package io.github.jansky.ezroute;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class BusRoutesAdapter extends RecyclerView.Adapter<BusRoutesAdapter.ViewHolder> {
    private List<BusRoute> busRoutes;
    private LayoutInflater layoutInflater;

    public class ViewHolder extends RecyclerView.ViewHolder {
        TextView busNumber, orgBusStop, dstBusStop;
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            busNumber = itemView.findViewById(R.id.bus_number);
            orgBusStop = itemView.findViewById(R.id.org_bus_stop);
            dstBusStop = itemView.findViewById(R.id.dst_bus_stop);
        }
    }

    BusRoutesAdapter(Context context, List<BusRoute> busRoutes) {
        this.layoutInflater = LayoutInflater.from(context);
        this.busRoutes = busRoutes;
    }

    @NonNull
    @Override
    public BusRoutesAdapter.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View itemView = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.activity_bus_route, parent, false);

        return new BusRoutesAdapter.ViewHolder(itemView);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        BusRoute busRoute = busRoutes.get(position);
        holder.busNumber.setText(String.valueOf(busRoute.getBus().getBusNumber()));
        holder.orgBusStop.setText(busRoute.getOrgBusStop().getName());
        holder.dstBusStop.setText(busRoute.getDstBusStop().getName());
    }

    @Override
    public int getItemCount() {
        return busRoutes.size();
    }


}
