// HEREMaps.js - Handles route calculation and turn-by-turn navigation using HERE Maps

export const calculateRoute = (platform, waypoints) => {
    return new Promise((resolve, reject) => {
      const router = platform.getRoutingService();
      const routeRequestParams = {
        mode: 'fastest;car',
        representation: 'display',
        waypoint0: `${waypoints[0].lat},${waypoints[0].lng}`,
        waypoint1: `${waypoints[1].lat},${waypoints[1].lng}`,
        routeattributes: 'summary,shape,legs',
        maneuverattributes: 'direction,action',
      };
  
      router.calculateRoute(routeRequestParams, (result) => {
        if (result.response.route) {
          const route = result.response.route[0];
          const lineString = new window.H.geo.LineString();
  
          route.shape.forEach((point) => {
            const parts = point.split(',');
            lineString.pushLatLngAlt(parts[0], parts[1]);
          });
  
          const routeLine = new window.H.map.Polyline(lineString, {
            style: { 
              strokeColor: 'blue', 
              lineWidth: 4,
              lineDash: []
            }
          });
  
          const routeInstructions = route.leg[0].maneuver.map((maneuver) => {
            return {
              instruction: maneuver.instruction,
              position: maneuver.position,
            };
          });
  
          resolve({ routeLine, routeInstructions });
        } else {
          reject('No route found');
        }
      }, reject);
    });
};
  
export const addTurnByTurnNavigation = (map, ui, routeInstructions) => {
    routeInstructions.forEach((maneuver) => {
      const marker = new window.H.map.Marker(maneuver.position);
      map.addObject(marker);
  
      const bubble = new window.H.ui.InfoBubble(
        maneuver.position,
        { content: maneuver.instruction }
      );
      ui.addBubble(bubble);
    });
};
