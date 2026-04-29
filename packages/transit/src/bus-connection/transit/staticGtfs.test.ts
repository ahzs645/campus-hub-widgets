import { describe, expect, it } from 'vitest';
import { getScheduledTrips } from './gtfsService';
import { parseStaticGtfsFiles } from './staticGtfs';

describe('static GTFS loading', () => {
  it('parses a Prince George GTFS zip into the UNBC schedule subset', () => {
    const data = parseStaticGtfsFiles({
        'feed_info.txt':
          'feed_publisher_name,feed_publisher_url,feed_lang,feed_version,feed_start_date,feed_end_date\n' +
          'Consat Telematics AB,https://consat.se,en,202604290,20260427,20260627\n',
        'stops.txt':
          'stop_id,stop_name,stop_lat,stop_lon,wheelchair_boarding,stop_code\n' +
          '105017,UNBC Exch Bay A,53.89128,-122.81364,0,105017\n',
        'routes.txt':
          'route_id,route_short_name,route_long_name,route_type,route_color,route_text_color\n' +
          '15-PRG,15,UNBC/Downtown,3,00AA47,FFFFFF\n' +
          '16-PRG,16,UNBC/College Heights,3,ED1D8F,FFFFFF\n' +
          '19-PRG,19,UNBC/Westgate,3,B2BB1E,FFFFFF\n' +
          '88-PRG,88,Westgate,3,0073AE,FFFFFF\n',
        'trips.txt':
          'route_id,service_id,trip_id,trip_headsign,shape_id,block_id,direction_id\n' +
          '15-PRG,4480,trip-inbound,UNBC,shape,block,1\n' +
          '15-PRG,4480,trip-outbound,Downtown,shape,block,0\n' +
          '16-PRG,4480,trip-college,College Heights,shape,block,1\n' +
          '19-PRG,4480,trip-loop,UNBC,shape,block,0\n' +
          '88-PRG,4480,trip-other,Westgate,shape,block,0\n',
        'stop_times.txt':
          'trip_id,arrival_time,departure_time,stop_id,stop_sequence,shape_dist_traveled,stop_headsign,pickup_type,drop_off_type,timepoint\n' +
          'trip-inbound,07:00:00,07:00:00,105017,18,8120,,0,0,1\n' +
          'trip-outbound,07:06:00,07:06:00,105017,1,0,,0,0,1\n' +
          'trip-college,07:30:00,07:30:00,105017,1,0,,0,0,1\n' +
          'trip-loop,08:00:00,08:00:00,105017,1,0,,0,0,1\n' +
          'trip-loop,08:29:00,08:29:00,105017,18,14177,,0,0,1\n' +
          'trip-other,08:00:00,08:00:00,105017,1,0,,0,0,1\n',
        'calendar_dates.txt':
          'service_id,date,exception_type\n' +
          '4480,20260429,1\n',
    });

    expect(data.stopInfo.stopName).toBe('UNBC Exch Bay A');
    expect(data.serviceDates['4480']).toEqual(['20260429']);
    expect(data.stopSchedule).toHaveLength(5);

    const trips = getScheduledTrips(new Date(2026, 3, 29, 7, 0, 0), data);
    expect(trips.map((trip) => `${trip.routeName} ${trip.headsign}`)).toEqual([
      '15 UNBC/Downtown',
      '16 UNBC/College Heights',
      '19 UNBC/Westgate Mall',
    ]);
  });
});
