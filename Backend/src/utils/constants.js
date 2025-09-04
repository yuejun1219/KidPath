// season
const SEASONS = {
  SUMMER: 'summer',
  WINTER: 'winter'
};

// order based on season
const ORDER_BY_SEASON = {
  [SEASONS.SUMMER]: 'ORDER BY shade_coverage DESC', // summer: order by shade coverage high to low
  [SEASONS.WINTER]: 'ORDER BY shade_coverage ASC'   // winter: order by shade coverage low to high
};

// API HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// error messages
const ERROR_MESSAGES = {
  INVALID_SEASON: 'the season parameter is invalid. Plz use summer or winter',
  PLAYGROUND_NOT_FOUND: 'playground not found',
  DATABASE_CONNECTION_FAILED: 'could not connect to the database',
  INVALID_COORDINATES: 'the provided coordinates are invalid',
  MISSING_REQUIRED_PARAMS: 'missing required parameters',
};

// success messages
const SUCCESS_MESSAGES = {
  DATA_RETRIEVED: 'get data successfully',
  DATABASE_CONNECTED: 'database connected successfully',
  HEALTH_CHECK_PASSED: 'health check passed',
};

// default configurations
const DEFAULT_CONFIG = {
  RECOMMENDATION_LIMIT: 3,
  NEAREST_PLAYGROUND_LIMIT: 5,
  BUFFER_RADIUS: 0.0005,
  PORT: 3000
};

// validation rules
const VALIDATION_RULES = {
  SEASON: {
    VALID_VALUES: [SEASONS.SUMMER, SEASONS.WINTER],
    DEFAULT_VALUE: SEASONS.SUMMER
  },
  COORDINATES: {
    LONGITUDE: { MIN: -180, MAX: 180 },
    LATITUDE: { MIN: -90, MAX: 90 }
  },
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0
  }
};

module.exports = {
  SEASONS,
  ORDER_BY_SEASON,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_CONFIG,
  VALIDATION_RULES
};