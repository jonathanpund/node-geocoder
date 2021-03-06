var util             = require('util'),
    AbstractGeocoder = require('./abstractgeocoder');

/**
 * Constructor
 */
var OpendataFranceGeocoder = function OpendataFranceGeocoder(httpAdapter, options) {
    this.options = ['language','email','apiKey'];

    OpendataFranceGeocoder.super_.call(this, httpAdapter, options);
};

util.inherits(OpendataFranceGeocoder, AbstractGeocoder);

OpendataFranceGeocoder.prototype._endpoint = 'http://api-adresse.data.gouv.fr/search';

OpendataFranceGeocoder.prototype._endpoint_reverse = 'http://api-adresse.data.gouv.fr/reverse';

/**
* Geocode
* @param <string|object>   value    Value to geocode (Address or parameters, as specified at https://opendatafrance/api/)
* @param <function> callback Callback method
*/
OpendataFranceGeocoder.prototype._geocode = function(value, callback) {
    var _this = this;

    var params = this._getCommonParams();

    if (typeof value == 'string') {
      params.q = value;
    } else {
      if (value.address) {
        params.q = value.address;
      }
    }
    this._forceParams(params);

    this.httpAdapter.get(this._endpoint, params, function(err, result) {
        if (err) {
            return callback(err);
        } else {

            if (result.error) {
              return callback(new Error(result.error));
            }

            var results = [];

            if (result.features) {
              for (var i = 0; i < result.features.length; i++) {
                results.push(_this._formatResult(result.features[i]));
              }
            }

            results.raw = result;
            callback(false, results);
        }

    });

};

OpendataFranceGeocoder.prototype._formatResult = function(result) {

    var latitude = result.geometry.coordinates[1];
    if (latitude) {
      latitude = parseFloat(latitude);
    }

    var longitude = result.geometry.coordinates[0];
    if (longitude) {
      longitude = parseFloat(longitude);
    }

    var properties = result.properties;

    return {
        'latitude' : latitude,
        'longitude' : longitude,
        'state' : properties.context,
        'city' : properties.city,
        'zipcode' : properties.postcode,
        'streetName': properties.street,
        'streetNumber' : properties.housenumber,
        'countryCode' : 'FR',
        'country' : 'France'
    };
};

/**
* Reverse geocoding
* @param {lat:<number>,lon:<number>, ...}  lat: Latitude, lon: Longitude, ... see https://wiki.openstreetmap.org/wiki/Nominatim#Parameters_2
* @param <function> callback Callback method
*/
OpendataFranceGeocoder.prototype._reverse = function(query, callback) {

    var _this = this;

    var params = this._getCommonParams();
    for (var k in query) {
      var v = query[k];
      params[k] = v;
    }
    this._forceParams(params);

    this.httpAdapter.get(this._endpoint_reverse , params, function(err, result) {
        if (err) {
            return callback(err);
        } else {

          if(result.error) {
            return callback(new Error(result.error));
          }

          var results = [];

          if (result.features) {
            for (var i = 0; i < result.features.length; i++) {
              results.push(_this._formatResult(result.features[i]));
            }
          }

          results.raw = result;
          callback(false, results);
        }
    });
};

/**
* Prepare common params
*
* @return <Object> common params
*/
OpendataFranceGeocoder.prototype._getCommonParams = function(){
    var params = {};

    for (var k in this.options) {
      var v = this.options[k];
      if (!v) {
        continue;
      }
      if (k === 'language') {
        k = 'accept-language';
      }
      params[k] = v;
    }

    return params;
};

OpendataFranceGeocoder.prototype._forceParams = function(params){
  params.limit = 20;
};

module.exports = OpendataFranceGeocoder;
