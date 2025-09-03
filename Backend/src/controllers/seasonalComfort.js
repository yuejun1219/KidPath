const playgroundService = require("../services/playgroundService");
const geoService = require("../services/geoService");
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  SEASONS,
  DEFAULT_CONFIG,
  VALIDATION_RULES,
} = require("../utils/constants");

class SeasonalComfortController {
  // api: get seasonal comfort playgrounds
  async getSeasonalComfortData(req, res) {
    try {
      const season = req.query.season || VALIDATION_RULES.SEASON.DEFAULT_VALUE;

      // validate season
      if (!VALIDATION_RULES.SEASON.VALID_VALUES.includes(season)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.INVALID_SEASON,
          valid_seasons: VALIDATION_RULES.SEASON.VALID_VALUES,
        });
      }
    
      //  parse BBOX from query
      let bbox = null;
      if (req.query.bbox) {
        const bboxParts = req.query.bbox.split(',').map(parseFloat);
        if (bboxParts.length === 4 && bboxParts.every(Number.isFinite)) {
          bbox = bboxParts;
        } else {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: "Invalid BBOX format",
            example: "bbox=144.90,-37.81,145.02,-37.70",
          });
        }
      }      

      console.log(`get ${season} playgrounds data`);
      if (bbox) console.log("with BBOX:", bbox);

      // get playground data
      const playgrounds = await playgroundService.getPlaygroundsBySeason(
        season,
        bbox
      );

      // calculate seasonal comfort scoring
      const playgroundsWithScoring = geoService.addSeasonalScoring(
        playgrounds,
        season
      );

      // convert to geojson
      const geojson = geoService.convertToGeoJSON(playgroundsWithScoring);

      // generate top recommendations
      const topRecommendations = geoService.generateRecommendations(
        playgroundsWithScoring,
        season,
        DEFAULT_CONFIG.RECOMMENDATION_LIMIT
      );

      const response = {
        season,
        total_playgrounds: playgrounds.length,
        playgrounds_geojson: geojson,
        top_recommendations: topRecommendations,
        metadata: {
          season_description: geoService.getSeasonDescription(season),
          query_time: new Date().toISOString(),
          buffer_radius_meters: Math.round(
            DEFAULT_CONFIG.BUFFER_RADIUS * 111000
          ),
        },
      };

      console.log(`return ${playgrounds.length} playgrounds results`);
      res.json(response);
    } catch (error) {
      console.error(
        "SeasonalComfortController.getSeasonalComfortData error:",
        error
      );
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: "Internal Server Error",
        message: error.message,
        season: req.query.season || "summer",
      });
    }
  }

  // get single playground's detail by id
  async getPlaygroundDetail(req, res) {
    try {
      const playgroundId = parseInt(req.params.id);

      if (isNaN(playgroundId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Invalid playground ID",
        });
      }

      const playground = await playgroundService.getPlaygroundById(
        playgroundId
      );

      if (!playground) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: ERROR_MESSAGES.PLAYGROUND_NOT_FOUND,
        });
      }

      const response = {
        id: playground.id,
        name: playground.name,
        features: playground.features,
        location_description: playground.location_d,
        council: playground.council_re,
        coordinates: [playground.lon, playground.lat],
        shade_coverage: playground.shade_coverage,
        geometry: JSON.parse(playground.geometry),
      };

      res.json(response);
    } catch (error) {
      console.error(
        "SeasonalComfortController.getPlaygroundDetail error:",
        error
      );
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }

  // get nearest playgrounds by coordinates
  async getNearestPlaygrounds(req, res) {
    try {
      const { longitude, latitude, limit } = req.query;

      if (!longitude || !latitude) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.MISSING_REQUIRED_PARAMS,
          required: ["longitude", "latitude"],
        });
      }

      // validate coordinates
      const coords = geoService.validateCoordinates(longitude, latitude);
      const searchLimit = Math.min(
        parseInt(limit) || DEFAULT_CONFIG.NEAREST_PLAYGROUND_LIMIT,
        VALIDATION_RULES.PAGINATION.MAX_LIMIT
      );

      const nearestPlaygrounds = await playgroundService.getNearestPlaygrounds(
        coords.longitude,
        coords.latitude,
        searchLimit
      );

      const response = {
        search_point: coords,
        total_found: nearestPlaygrounds.length,
        playgrounds: nearestPlaygrounds,
      };

      res.json(response);
    } catch (error) {
      console.error(
        "SeasonalComfortController.getNearestPlaygrounds error:",
        error
      );
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }

  // get statistics
  async getStatistics(req, res) {
    try {
      const [basicStats, shadeStats] = await Promise.all([
        playgroundService.getStatistics(),
        playgroundService.getShadeDistribution(),
      ]);

      const response = {
        basic_statistics: basicStats,
        shade_distribution: shadeStats,
        generated_at: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error("SeasonalComfortController.getStatistics error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
}

module.exports = new SeasonalComfortController();
