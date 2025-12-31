import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getStates, getCitiesByState } from '../utils/indianLocations';

/**
 * StateCitySelect Component
 * Reusable component for selecting Indian State and City with dependency
 * 
 * @param {Object} props
 * @param {string} props.state - Current selected state value
 * @param {string} props.city - Current selected city value
 * @param {Function} props.onStateChange - Callback when state changes (state: string) => void
 * @param {Function} props.onCityChange - Callback when city changes (city: string) => void
 * @param {Object} props.errors - Error messages object with state and city keys
 * @param {string} props.stateLabel - Label for state field (default: "State *")
 * @param {string} props.cityLabel - Label for city field (default: "City *")
 * @param {boolean} props.allowCustomCity - Allow typing custom city if not in list (default: false)
 * @param {string} props.className - Additional CSS classes for container
 */
export default function StateCitySelect({
  state,
  city,
  onStateChange,
  onCityChange,
  errors = {},
  stateLabel = "State *",
  cityLabel = "City *",
  allowCustomCity = false,
  className = "",
}) {
  const [availableStates] = useState(getStates());
  const [availableCities, setAvailableCities] = useState([]);

  // Update cities when state changes
  useEffect(() => {
    if (state) {
      const cities = getCitiesByState(state);
      setAvailableCities(cities);
      // Clear city if it's not in the new state's cities
      if (city && !cities.includes(city)) {
        onCityChange('');
      }
    } else {
      setAvailableCities([]);
      onCityChange('');
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load cities for initial state if editing
  useEffect(() => {
    if (state && availableCities.length === 0) {
      const cities = getCitiesByState(state);
      setAvailableCities(cities);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStateChange = (newState) => {
    onStateChange(newState);
    // City will be cleared by the useEffect above
  };

  const handleCityChange = (newCity) => {
    onCityChange(newCity);
  };

  const isCityInList = availableCities.includes(city);
  const showCustomCityInput = allowCustomCity && state && city && !isCityInList;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* State Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {stateLabel}
        </label>
        <div className="relative">
          <select
            value={state || ''}
            onChange={(e) => handleStateChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors duration-300 appearance-none bg-white ${
              errors.state
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-200 focus:border-amber-400'
            }`}
            required
          >
            <option value="">Select State</option>
            {availableStates.map((stateName) => (
              <option key={stateName} value={stateName}>
                {stateName}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        {errors.state && (
          <p className="mt-1 text-sm text-red-600">{errors.state}</p>
        )}
      </div>

      {/* City Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {cityLabel}
        </label>
        <div className="relative">
          <select
            value={isCityInList ? city : ''}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={!state}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors duration-300 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.city
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-200 focus:border-amber-400'
            }`}
            required
          >
            <option value="">
              {state ? 'Select City' : 'Select state first'}
            </option>
            {availableCities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
            {state && availableCities.length === 0 && (
              <option value="" disabled>
                No cities found
              </option>
            )}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        {/* Custom city input (optional) */}
        {showCustomCityInput && (
          <input
            type="text"
            placeholder="Or type city name"
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full px-4 py-2 mt-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
          />
        )}
        {errors.city && (
          <p className="mt-1 text-sm text-red-600">{errors.city}</p>
        )}
      </div>
    </div>
  );
}

