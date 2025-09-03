const { SEASONS } = require('../utils/constants');

class GeoService {
  
  // transform playground data to GeoJSON format
  convertToGeoJSON(playgrounds) {
    const features = playgrounds.map(row => ({
      type: 'Feature',
      geometry: JSON.parse(row.geometry),
      properties: {
        id: row.id,
        name: row.name,
        features: row.features,
        location_description: row.location_d,
        council: row.council_re,
        shade_coverage: row.shade_coverage,
        latitude: row.lat,
        longitude: row.lon
      }
    }));

    return {
      type: 'FeatureCollection',
      features: features
    };
  }

  // calculate seasonal comfort score
  calculateComfortScore(shadeCoverage, season) {
    return season === SEASONS.SUMMER ? shadeCoverage : (100 - shadeCoverage);
  }

  // add seasonal comfort score to each playground
  addSeasonalScoring(playgrounds, season) {
    return playgrounds.map(playground => ({
      ...playground,
      comfort_score: this.calculateComfortScore(playground.shade_coverage, season)
    }));
  }

  // generate top 3 recommendations based on season
  generateRecommendations(playgrounds, season, limit = 3) {
    return playgrounds.slice(0, limit).map(playground => ({
      id: playground.id,
      name: playground.name,
      features: playground.features,
      location_description: playground.location_d,
      council: playground.council_re,
      shade_coverage: playground.shade_coverage,
      comfort_score: this.calculateComfortScore(playground.shade_coverage, season),
      coordinates: JSON.parse(playground.geometry).coordinates,
      recommendation_reason: this.getRecommendationReason(playground.shade_coverage, season)
    }));
  }

  // reason for recommendation
  getRecommendationReason(shadeCoverage, season) {
    if (season === SEASONS.SUMMER) {
      return `${shadeCoverage}% shaded level`;
    } else {
      return `${100 - shadeCoverage}% sunshine level`;
    }
  }

  // season description
  getSeasonDescription(season) {
    const descriptions = {
      [SEASONS.SUMMER]: 'Summer recommendation: Prioritize playgrounds with high shade coverage',
      [SEASONS.WINTER]: 'Winter recommendation: Prioritize playgrounds with abundant sunshine'
    };
    
    return descriptions[season] || descriptions[SEASONS.SUMMER];
  }

  // validate coordinates
  validateCoordinates(longitude, latitude) {
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);
    
    if (isNaN(lon) || isNaN(lat)) {
      throw new Error('Coordinates must be valid numbers');
    }
    
    if (lon < -180 || lon > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
    
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    
    return { longitude: lon, latitude: lat };
  }

  // calculate distance between two coordinates using Haversine formula
  calculateDistance(point1, point2) {
    const R = 6371; 
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // meters
  }

  // convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new GeoService();