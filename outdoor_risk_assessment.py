import numpy as np
from datetime import datetime
import requests
import rasterio
import os
from pyproj import CRS
from scipy.ndimage import sobel

class OutdoorRiskAssessment:
    def __init__(self):
        # Define activity types and their base difficulty
        self.activity_types = {
            'hiking': {'base_difficulty': 2, 'weather_sensitivity': 0.7, 'equipment_importance': 0.5, 'weight_sensitivity': 0.8},
            'rock_climbing': {'base_difficulty': 4, 'weather_sensitivity': 0.9, 'equipment_importance': 0.9, 'weight_sensitivity': 0.7},
            'mountain_biking': {'base_difficulty': 3, 'weather_sensitivity': 0.6, 'equipment_importance': 0.8, 'weight_sensitivity': 0.4},
            'backcountry_skiing': {'base_difficulty': 4, 'weather_sensitivity': 0.95, 'equipment_importance': 0.9, 'weight_sensitivity': 0.6},
            'kayaking': {'base_difficulty': 3, 'weather_sensitivity': 0.8, 'equipment_importance': 0.7, 'weight_sensitivity': 0.3},
            'trail_running': {'base_difficulty': 2.5, 'weather_sensitivity': 0.75, 'equipment_importance': 0.6, 'weight_sensitivity': 0.85}
        }
        
        # Experience levels
        self.experience_levels = {
            'beginner': 1.5,
            'intermediate': 1.0,
            'advanced': 0.7,
            'expert': 0.5
        }
        
        # Equipment quality modifiers
        self.equipment_quality = {
            'poor': 2.0,
            'basic': 1.5,
            'good': 1.0,
            'excellent': 0.8
        }
        
        # Weather risk thresholds (in Fahrenheit)
        self.weather_thresholds = {
            'temperature': {'min': 14, 'max': 95},  # in Fahrenheit
            'precipitation': {'light': 0.04, 'moderate': 0.2, 'heavy': 0.4},  # in inches
            'wind_speed': {'light': 9, 'moderate': 18, 'strong': 31}  # in mph
        }
        
        # Risk categories
        self.risk_categories = {
            'low': {'min': 0, 'max': 3},
            'moderate': {'min': 3, 'max': 6},
            'high': {'min': 6, 'max': 8},
            'extreme': {'min': 8, 'max': 10}
        }
        
        # Weight carried risk thresholds (in pounds)
        self.weight_thresholds = {
            'light': 10,      # 0-10 lbs
            'moderate': 25,    # 11-25 lbs
            'heavy': 40,       # 26-40 lbs
            'very_heavy': 60   # 41+ lbs
        }
        
        # Physical attributes risk modifiers
        self.physical_attributes = {
            'age': {
                'young': {'min': 18, 'max': 35, 'modifier': 0.9},
                'middle': {'min': 36, 'max': 50, 'modifier': 1.0},
                'older': {'min': 51, 'max': 65, 'modifier': 1.2},
                'senior': {'min': 66, 'max': 120, 'modifier': 1.5}
            },
            'height_weight_ratio': {  # BMI-like categories
                'underweight': {'modifier': 1.2},
                'normal': {'modifier': 1.0},
                'overweight': {'modifier': 1.2},
                'obese': {'modifier': 1.5}
            },
            'gender': {
                'male': {'modifier': 1.0},
                'female': {'modifier': 1.0},
                'other': {'modifier': 1.0}  # Base modifier the same for fairness
            }
        }

        # Location specific additional risk factors
        self.location_specific_risks = {
            'Manitou Incline': {
                'altitude_gain': 2000,  # feet
                'inclination': 40,  # average degrees
                'risk_modifier': 1.8   # higher risk modifier
            }
        }
    
    def assess_terrain_difficulty(self, location, terrain_data):
        """
        Assess terrain difficulty based on elevation, slope, and ruggedness
        
        Parameters:
        location (tuple): (latitude, longitude)
        terrain_data (dict): Contains 'elevation', 'slope', 'ruggedness' metrics
        
        Returns:
        float: Terrain difficulty score (0-10)
        """
        # Extract terrain parameters
        elevation = terrain_data.get('elevation', 0)  # feet
        slope = terrain_data.get('slope', 0)  # degrees
        ruggedness = terrain_data.get('ruggedness', 0)  # index 0-1
        
        # Normalize each parameter to a 0-10 scale
        elevation_score = min(10, elevation / 1640)  # 16400 feet would be max
        slope_score = min(10, slope / 4.5)  # 45 degrees would be max
        ruggedness_score = ruggedness * 10
        
        # Calculate weighted terrain difficulty
        terrain_difficulty = (0.3 * elevation_score + 
                             0.4 * slope_score + 
                             0.3 * ruggedness_score)
        
        return terrain_difficulty
    
    def calculate_weather_risk(self, weather_data, activity_type):
        """
        Calculate weather-related risk based on forecast and activity
        
        Parameters:
        weather_data (dict): Contains weather metrics
        activity_type (str): Type of outdoor activity
        
        Returns:
        float: Weather risk score (0-10)
        """
        # Extract weather parameters
        temperature = weather_data.get('temperature', 68)  # Fahrenheit
        precipitation = weather_data.get('precipitation', 0)  # inches
        wind_speed = weather_data.get('wind_speed', 0)  # mph
        thunderstorm_risk = weather_data.get('thunderstorm_risk', 0)  # 0-1 probability
        
        # Calculate temperature risk (higher for extreme temps)
        temp_min = self.weather_thresholds['temperature']['min']
        temp_max = self.weather_thresholds['temperature']['max']
        if temp_min <= temperature <= temp_max:
            temp_risk = 0
        else:
            temp_risk = min(10, abs(temperature - (temp_min if temperature < temp_min else temp_max)) / 3.6)
        
        # Calculate precipitation risk
        if precipitation < self.weather_thresholds['precipitation']['light']:
            precip_risk = 0
        elif precipitation < self.weather_thresholds['precipitation']['moderate']:
            precip_risk = 3
        elif precipitation < self.weather_thresholds['precipitation']['heavy']:
            precip_risk = 7
        else:
            precip_risk = 10
        
        # Calculate wind risk
        if wind_speed < self.weather_thresholds['wind_speed']['light']:
            wind_risk = 0
        elif wind_speed < self.weather_thresholds['wind_speed']['moderate']:
            wind_risk = 3
        elif wind_speed < self.weather_thresholds['wind_speed']['strong']:
            wind_risk = 7
        else:
            wind_risk = 10
        
        # Thunderstorm risk (0-10)
        lightning_risk = thunderstorm_risk * 10
        
        # Get activity's weather sensitivity
        weather_sensitivity = self.activity_types[activity_type]['weather_sensitivity']
        
        # Calculate overall weather risk
        weather_risk = (0.3 * temp_risk + 
                       0.3 * precip_risk + 
                       0.2 * wind_risk + 
                       0.2 * lightning_risk) * weather_sensitivity
        
        return weather_risk
    
    def calculate_weight_risk(self, weight_carried, activity_type):
        """
        Calculate risk related to weight carried
        
        Parameters:
        weight_carried (float): Weight carried in pounds
        activity_type (str): Type of outdoor activity
        
        Returns:
        float: Weight risk score (0-10)
        """
        # Base weight risk calculation
        if weight_carried <= self.weight_thresholds['light']:
            weight_base_risk = 1
        elif weight_carried <= self.weight_thresholds['moderate']:
            weight_base_risk = 3
        elif weight_carried <= self.weight_thresholds['heavy']:
            weight_base_risk = 6
        else:
            weight_base_risk = 9
        
        # Apply activity-specific weight sensitivity
        weight_sensitivity = self.activity_types[activity_type]['weight_sensitivity']
        weight_risk = weight_base_risk * weight_sensitivity
        
        # Normalize to 0-10 scale
        weight_risk = min(10, weight_risk)
        
        return weight_risk
    
    def calculate_human_risk(self, user_experience, group_size, activity_type, weight_carried, age, height_weight_ratio, gender):
        """
        Calculate risk related to human factors
        
        Parameters:
        user_experience (str): Experience level
        group_size (int): Number of people in group
        activity_type (str): Type of outdoor activity
        weight_carried (float): Weight carried in pounds
        age (int): User age
        height_weight_ratio (float): User height-weight ratio
        gender (str): User gender
        
        Returns:
        float: Human factor risk score (0-10)
        """
        # Base activity difficulty
        activity_difficulty = self.activity_types[activity_type]['base_difficulty']
        
        # Experience modifier
        experience_modifier = self.experience_levels[user_experience]
        
        # Group size factor
        if group_size == 1:
            # Solo activities are riskier
            group_factor = 1.5
        elif 2 <= group_size <= 4:
            # Optimal group size
            group_factor = 1.0
        elif 5 <= group_size <= 8:
            # Larger groups can be safer but may move slower
            group_factor = 1.2
        else:
            # Very large groups add complexity
            group_factor = 1.4
        
        # Weight factor calculation
        weight_risk = self.calculate_weight_risk(weight_carried, activity_type)
        weight_factor = 0.5 + (weight_risk / 20)  # Scale to 0.5-1.0 range
        
        # Physical attributes risk modifiers
        age_modifier = self.get_age_modifier(age)
        height_weight_modifier = self.get_height_weight_modifier(height_weight_ratio)
        gender_modifier = self.get_gender_modifier(gender)
        
        # Calculate human risk factor with weight consideration
        human_risk = (activity_difficulty * experience_modifier * group_factor * weight_factor * age_modifier * height_weight_modifier * gender_modifier)
        
        # Normalize to 0-10 scale
        human_risk = min(10, human_risk * 1.2)
        
        return human_risk, weight_risk
    
    def get_age_modifier(self, age):
        """
        Get age modifier
        
        Parameters:
        age (int): User age
        
        Returns:
        float: Age modifier
        """
        for category, thresholds in self.physical_attributes['age'].items():
            if thresholds['min'] <= age <= thresholds['max']:
                return thresholds['modifier']
        
        # If outside all ranges, use the highest modifier
        return self.physical_attributes['age']['senior']['modifier']
    
    def get_height_weight_modifier(self, height_weight_ratio):
        """
        Get height-weight ratio modifier
        
        Parameters:
        height_weight_ratio (float): User height-weight ratio
        
        Returns:
        float: Height-weight ratio modifier
        """
        if height_weight_ratio < 18.5:
            return self.physical_attributes['height_weight_ratio']['underweight']['modifier']
        elif height_weight_ratio < 25:
            return self.physical_attributes['height_weight_ratio']['normal']['modifier']
        elif height_weight_ratio < 30:
            return self.physical_attributes['height_weight_ratio']['overweight']['modifier']
        else:
            return self.physical_attributes['height_weight_ratio']['obese']['modifier']
    
    def get_gender_modifier(self, gender):
        """
        Get gender modifier
        
        Parameters:
        gender (str): User gender
        
        Returns:
        float: Gender modifier
        """
        return self.physical_attributes['gender'][gender]['modifier']
    
    def assess_equipment_risk(self, equipment_quality_level, activity_type):
        """
        Assess risk based on equipment quality
        
        Parameters:
        equipment_quality_level (str): Quality of equipment
        activity_type (str): Type of outdoor activity
        
        Returns:
        float: Equipment risk score (0-10)
        """
        # Get base equipment importance for activity
        equipment_importance = self.activity_types[activity_type]['equipment_importance']
        
        # Get equipment quality modifier
        quality_modifier = self.equipment_quality[equipment_quality_level]
        
        # Calculate equipment risk
        equipment_risk = 5 * equipment_importance * quality_modifier
        
        # Normalize to 0-10 scale
        equipment_risk = min(10, equipment_risk)
        
        return equipment_risk
    
    def categorize_risk(self, risk_score):
        """
        Categorize numerical risk score into a risk level
        
        Parameters:
        risk_score (float): Numerical risk score
        
        Returns:
        tuple: (risk_category, risk_score)
        """
        for category, thresholds in self.risk_categories.items():
            if thresholds['min'] <= risk_score < thresholds['max']:
                return category, risk_score
        
        # If outside all ranges, it's extreme
        return 'extreme', risk_score
    
    def calculate_risk_score(self, location, activity_type, user_experience, 
                            group_size, weather_data, equipment_quality_level, 
                            terrain_data, weight_carried, age, height_weight_ratio, gender):
        """
        Calculate overall risk score for outdoor activity
        
        Parameters:
        location (tuple): (latitude, longitude)
        activity_type (str): Type of outdoor activity
        user_experience (str): Experience level
        group_size (int): Number of people in group
        weather_data (dict): Weather forecast data
        equipment_quality_level (str): Quality of equipment
        terrain_data (dict): Terrain difficulty metrics
        weight_carried (float): Weight carried in pounds
        age (int): User age
        height_weight_ratio (float): User height-weight ratio
        gender (str): User gender
        
        Returns:
        tuple: (risk_category, risk_score, component_scores)
        """
        # Calculate component risk scores
        terrain_risk = self.assess_terrain_difficulty(location, terrain_data)
        weather_risk = self.calculate_weather_risk(weather_data, activity_type)
        human_risk, weight_risk = self.calculate_human_risk(user_experience, group_size, activity_type, weight_carried, age, height_weight_ratio, gender)
        equipment_risk = self.assess_equipment_risk(equipment_quality_level, activity_type)
        
        # Calculate weighted total risk
        total_risk = (terrain_risk * 0.35 + 
                     weather_risk * 0.25 + 
                     human_risk * 0.20 + 
                     equipment_risk * 0.10 +
                     weight_risk * 0.10)
        
        # Apply location-specific risk factors
        if location in self.location_specific_risks:
            total_risk *= self.location_specific_risks[location]['risk_modifier']
        
        # Store component scores for detailed report
        component_scores = {
            'terrain_risk': terrain_risk,
            'weather_risk': weather_risk,
            'human_risk': human_risk,
            'equipment_risk': equipment_risk,
            'weight_risk': weight_risk,
            'total_risk': total_risk
        }
        
        # Categorize risk level
        risk_category, risk_score = self.categorize_risk(total_risk)
        
        return risk_category, risk_score, component_scores
    
    def generate_risk_report(self, risk_category, risk_score, component_scores, 
                           location, activity_type, weather_data, weight_carried, equipment_quality_level, age, height_weight_ratio, gender):
        """
        Generate a detailed risk assessment report
        
        Parameters:
        risk_category (str): Risk category
        risk_score (float): Numerical risk score
        component_scores (dict): Individual component risk scores
        location (tuple): (latitude, longitude)
        activity_type (str): Type of outdoor activity
        weather_data (dict): Weather forecast data
        weight_carried (float): Weight carried in pounds
        equipment_quality_level (str): Quality level of equipment
        age (int): User age
        height_weight_ratio (float): User height-weight ratio
        gender (str): User gender
        
        Returns:
        dict: Detailed risk assessment report
        """
        # Format location
        lat, lon = location
        location_str = f"{lat:.4f}°N, {lon:.4f}°W"
        
        # Format date and time
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M")
        
        # Generate recommendations based on risk level
        if risk_category == 'low':
            recommendations = [
                "Standard precautions recommended",
                "Always inform someone of your plans",
                "Carry basic safety equipment"
            ]
        elif risk_category == 'moderate':
            recommendations = [
                "Enhanced preparedness recommended",
                "Check conditions before departing",
                "Carry appropriate safety gear",
                "Have backup plans in place"
            ]
        elif risk_category == 'high':
            recommendations = [
                "Consider postponing or choosing an alternative activity",
                "Only attempt if properly experienced and equipped",
                "Detailed trip planning required",
                "Emergency communication devices strongly recommended"
            ]
        else:  # extreme
            recommendations = [
                "Activity not recommended under current conditions",
                "Significant hazards present",
                "Consider fully rescheduling"
            ]
        
        # Add weight-specific recommendations
        if weight_carried > self.weight_thresholds['moderate']:
            recommendations.append("Consider reducing pack weight for this activity")
        if weight_carried > self.weight_thresholds['heavy']:
            recommendations.append("Heavy pack weight significantly increases risk of injury and fatigue")
        
        # Format report
        report = {
            "summary": {
                "activity": activity_type.replace('_', ' ').title(),
                "location": location_str,
                "assessment_time": current_time,
                "risk_category": risk_category.upper(),
                "risk_score": f"{risk_score:.1f}/10"
            },
            "component_risks": {
                "terrain": f"{component_scores['terrain_risk']:.1f}/10",
                "weather": f"{component_scores['weather_risk']:.1f}/10",
                "human_factors": f"{component_scores['human_risk']:.1f}/10",
                "equipment": f"{component_scores['equipment_risk']:.1f}/10",
                "weight_carried": f"{component_scores['weight_risk']:.1f}/10"
            },
            "weather_conditions": {
                "temperature": f"{weather_data.get('temperature', 'N/A')}°F",
                "precipitation": f"{weather_data.get('precipitation', 'N/A')} in",
                "wind_speed": f"{weather_data.get('wind_speed', 'N/A')} mph",
                "thunderstorm_risk": f"{weather_data.get('thunderstorm_risk', 'N/A') * 100}%"
            },
            "equipment_details": {
                "quality": equipment_quality_level.title(),
                "weight_carried": f"{weight_carried} lbs"
            },
            "user_details": {
                "age": age,
                "height_weight_ratio": height_weight_ratio,
                "gender": gender
            },
            "recommendations": recommendations
        }
        
        return report


def celsius_to_fahrenheit(celsius):
    """Convert Celsius to Fahrenheit"""
    return (celsius * 9/5) + 32

def mm_to_inches(mm):
    """Convert millimeters to inches"""
    return mm / 25.4

def kmh_to_mph(kmh):
    """Convert kilometers per hour to miles per hour"""
    return kmh / 1.60934

def meters_to_feet(meters):
    """Convert meters to feet"""
    return meters * 3.28084

def kg_to_pounds(kg):
    """Convert kilograms to pounds"""
    return kg * 2.20462

def fetch_weather_data(api_key, location):
    """
    Fetch weather data from OpenWeather API
    
    Parameters:
    api_key (str): OpenWeather API key
    location (tuple): (latitude, longitude)
    
    Returns:
    dict: Weather data formatted for risk assessment
    """
    lat, lon = location
    url = f"https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&exclude=minutely,hourly&units=metric&appid={api_key}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if response.status_code != 200:
            print(f"Error fetching weather data: {data.get('message', 'Unknown error')}")
            # Return default weather data
            return {
                'temperature': 68,     # Fahrenheit
                'precipitation': 0,    # inches
                'wind_speed': 6,       # mph
                'thunderstorm_risk': 0 # probability 0-1
            }
        
        # Extract relevant weather data
        current = data.get('current', {})
        daily = data.get('daily', [{}])[0]  # Get today's forecast
        
        # Format data for our risk model and convert to imperial
        weather_data = {
            'temperature': celsius_to_fahrenheit(current.get('temp', 20)),
            'precipitation': mm_to_inches(daily.get('rain', 0) if 'rain' in daily else 0),
            'wind_speed': kmh_to_mph(current.get('wind_speed', 0) * 3.6),  # Convert m/s to mph
            'thunderstorm_risk': 0
        }
        
        # Calculate thunderstorm risk from weather ID
        weather_id = current.get('weather', [{}])[0].get('id', 800)
        if 200 <= weather_id < 300:  # Thunderstorm codes
            weather_data['thunderstorm_risk'] = 0.8
        elif 300 <= weather_id < 400:  # Drizzle codes
            weather_data['thunderstorm_risk'] = 0.1
        elif 500 <= weather_id < 600:  # Rain codes
            weather_data['thunderstorm_risk'] = 0.3
        
        return weather_data
    
    except Exception as e:
        print(f"Exception when fetching weather data: {str(e)}")
        # Return default weather data
        return {
            'temperature': 68,     # Fahrenheit
            'precipitation': 0,    # inches
            'wind_speed': 6,       # mph
            'thunderstorm_risk': 0 # probability 0-1
        }


class GISTerrainAnalyzer:
    def __init__(self, dem_cache_dir="dem_cache"):
        """
        Initialize GIS terrain analyzer
        
        Parameters:
        dem_cache_dir (str): Directory to cache DEM files
        """
        self.dem_cache_dir = dem_cache_dir
        
        # Create cache directory if it doesn't exist
        if not os.path.exists(dem_cache_dir):
            os.makedirs(dem_cache_dir)
    
    def get_elevation_data(self, location, radius=1000):
        """
        Get elevation data for a location within a specified radius
        
        Parameters:
        location (tuple): (latitude, longitude)
        radius (int): Radius in meters to analyze around the point
        
        Returns:
        dict: DEM data including file path and metadata
        """
        lat, lon = location
        
        # Generate a filename for the cached DEM
        cache_filename = f"{self.dem_cache_dir}/dem_{lat:.4f}_{lon:.4f}_{radius}.tif"
        
        # Check if we have a cached version
        if os.path.exists(cache_filename):
            print(f"Using cached DEM data for location {lat:.4f}, {lon:.4f}")
            return {"filepath": cache_filename}
        
        # If not cached, download from Open-Elevation API or similar
        # Note: For production use, you should use a more robust elevation API
        # Options include: USGS 3DEP, SRTM, ASTER GDEM, or commercial APIs like Mapbox
        print(f"Fetching DEM data for location {lat:.4f}, {lon:.4f}")
        
        # Calculate bounding box
        # Approximate conversion from degrees to meters at equator: 111,320 m per degree
        # This is a simplification; for more precise calculations use a proper geospatial library
        m_per_deg = 111320
        deg_offset = radius / m_per_deg
        
        # Create bounding box
        xmin = lon - deg_offset
        xmax = lon + deg_offset
        ymin = lat - deg_offset
        ymax = lat + deg_offset
        
        # For this example, we'll use Open-Elevation API
        # In a production environment, replace with a more robust source
        url = f"https://api.open-elevation.com/api/v1/bounds?bounds={xmin},{ymin},{xmax},{ymax}&resolution=30"
        
        try:
            # Make the request but don't store the response since we're not using it
            requests.get(url)
            
            # Process the response to create a GeoTIFF
            # This is a simplified example and would need to be expanded
            # for a production implementation
            
            # For now, we'll create a dummy DEM file for demonstration
            # In a real implementation, you would process the actual API response
            self._create_dummy_dem(cache_filename, lat, lon, radius)
            
            return {"filepath": cache_filename}
            
        except Exception as e:
            print(f"Error fetching elevation data: {str(e)}")
            return None
    
    def _create_dummy_dem(self, filename, lat, lon, radius):
        """
        Create a dummy DEM file for demonstration purposes
        In a real implementation, you would use actual elevation data
        
        Parameters:
        filename (str): Output file path
        lat, lon (float): Center coordinates
        radius (int): Radius in meters
        """
        # Create a simple elevation model with a peak at the center
        # This is just for demonstration
        size = 100  # grid size
        dem = np.zeros((size, size), dtype=np.float32)
        
        # Create a simple mountain peak at the center
        x, y = np.mgrid[0:size, 0:size]
        center = size // 2
        dem = 1000 * np.exp(-0.01 * ((x - center)**2 + (y - center)**2))
        
        # Add some random variation
        dem += np.random.normal(0, 50, dem.shape)
        
        # Calculate the transform
        m_per_deg = 111320
        deg_offset = radius / m_per_deg
        
        transform = rasterio.transform.from_bounds(
            lon - deg_offset, lat - deg_offset, 
            lon + deg_offset, lat + deg_offset, 
            size, size
        )
        
        # Write to GeoTIFF
        with rasterio.open(
            filename,
            'w',
            driver='GTiff',
            height=dem.shape[0],
            width=dem.shape[1],
            count=1,
            dtype=dem.dtype,
            crs=CRS.from_epsg(4326),  # WGS84
            transform=transform,
        ) as dst:
            dst.write(dem, 1)
    
    def analyze_terrain(self, location, radius=1000):
        """
        Analyze terrain for an outdoor activity location
        
        Parameters:
        location (tuple): (latitude, longitude)
        radius (int): Radius in meters to analyze around the point
        
        Returns:
        dict: Terrain analysis results
        """
        # Get elevation data
        dem_data = self.get_elevation_data(location, radius)
        
        if not dem_data:
            print("Error: Could not get elevation data")
            return {
                'elevation': 3280,  # Default elevation in feet
                'slope': 10,        # Default slope
                'ruggedness': 0.5   # Default ruggedness
            }
        
        # Open the DEM file
        with rasterio.open(dem_data["filepath"]) as dem_src:
            dem = dem_src.read(1)
            
            # Extract elevation statistics and convert to feet
            elevation_min = float(meters_to_feet(np.min(dem)))
            elevation_max = float(meters_to_feet(np.max(dem)))
            elevation_mean = float(meters_to_feet(np.mean(dem)))
            
            # Calculate slope
            dx = sobel(dem, axis=1)
            dy = sobel(dem, axis=0)
            slope = np.degrees(np.arctan(np.sqrt(dx**2 + dy**2)))
            slope_mean = float(np.mean(slope))
            slope_max = float(np.max(slope))
            
            # Calculate terrain ruggedness index (TRI)
            # Simple implementation: standard deviation of elevation
            ruggedness = float(np.std(dem) / (elevation_max - elevation_min) if elevation_max > elevation_min else 0.5)
            # Normalize to 0-1 scale
            ruggedness = min(1.0, ruggedness)
        
        # Return terrain analysis results
        return {
            'elevation': elevation_mean,
            'elevation_min': elevation_min,
            'elevation_max': elevation_max,
            'slope': slope_mean,
            'slope_max': slope_max,
            'ruggedness': ruggedness
        }
    
    def get_land_cover(self, location, radius=1000):
        """
        Get land cover information for a location
        
        Parameters:
        location (tuple): (latitude, longitude)
        radius (int): Radius in meters to analyze around the point
        
        Returns:
        dict: Land cover information
        """
        # This would normally use a land cover dataset like NLCD (National Land Cover Database)
        # or Corine Land Cover for Europe
        # For this example, we'll return dummy data
        
        land_cover_types = [
            'forest', 'grassland', 'barren', 'developed', 'water', 'wetland', 'shrubland', 'snow'
        ]
        
        # Mock different land cover distributions based on location
        # In a real implementation, you would query a land cover dataset
        lat, lon = location
        
        # Use the coordinates to seed a random generator for consistency
        np.random.seed(int((lat + 180) * 1000) + int((lon + 360) * 1000))
        
        # Generate random proportions and normalize
        proportions = np.random.rand(len(land_cover_types))
        proportions = proportions / proportions.sum()
        
        land_cover = {land_type: float(prop) for land_type, prop in zip(land_cover_types, proportions)}
        
        # Determine dominant land cover
        dominant_type = max(land_cover.items(), key=lambda x: x[1])[0]
        
        return {
            'land_cover': land_cover,
            'dominant_type': dominant_type
        }
    
    def get_protected_areas(self, location, radius=1000):
        """
        Check if location is within a protected area
        
        Parameters:
        location (tuple): (latitude, longitude)
        radius (int): Radius in meters to analyze around the point
        
        Returns:
        dict: Protected area information
        """
        # This would normally use a database of protected areas like the World Database on Protected Areas (WDPA)
        # For this example, we'll return dummy data
        
        # Mock different protected area types
        protected_area_types = [
            'national_park', 'wilderness', 'conservation_area', 'wildlife_refuge', 
            'state_park', 'national_forest', 'none'
        ]
        
        # Use the coordinates to seed a random generator for consistency
        lat, lon = location
        np.random.seed(int((lat + 180) * 1000) + int((lon + 360) * 1000))
        
        # Generate a random index (weighted to often return 'none')
        idx = np.random.choice(len(protected_area_types), p=[0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.4])
        
        protected_type = protected_area_types[idx]
        
        if protected_type == 'none':
            return {
                'is_protected': False,
                'type': None,
                'name': None
            }
        else:
            # Protected area names specific to Colorado Springs
            area_names = {
                'national_park': [
                    'Rocky Mountain National Park', 'Great Sand Dunes National Park', 
                    'Black Canyon of the Gunnison National Park', 'Mesa Verde National Park'
                ],
                'wilderness': [
                    'Sangre de Cristo Wilderness', 'Lost Creek Wilderness', 
                    'Mount Evans Wilderness', 'Holy Cross Wilderness'
                ],
                'conservation_area': [
                    'Browns Canyon National Monument', 'McInnis Canyons Conservation Area',
                    'Garden of the Gods', 'Red Rock Canyon Open Space'
                ],
                'wildlife_refuge': [
                    'Rocky Mountain Arsenal National Wildlife Refuge', 'Arapaho National Wildlife Refuge',
                    'Two Ponds National Wildlife Refuge', 'Monte Vista National Wildlife Refuge'
                ],
                'state_park': [
                    'Cheyenne Mountain State Park', 'Mueller State Park',
                    'Eleven Mile State Park', 'Castlewood Canyon State Park'
                ],
                'national_forest': [
                    'Pike National Forest', 'San Isabel National Forest',
                    'Arapaho National Forest', 'White River National Forest'
                ]
            }
            
            # Choose a random name for the protected area
            name_idx = np.random.randint(0, len(area_names[protected_type]))
            area_name = area_names[protected_type][name_idx]
            
            return {
                'is_protected': True,
                'type': protected_type,
                'name': area_name
            }
    
    def get_trails(self, location, radius=1000):
        """
        Get nearby trails information
        
        Parameters:
        location (tuple): (latitude, longitude)
        radius (int): Radius in meters to analyze around the point
        
        Returns:
        dict: Trail information
        """
        # This would normally use a trail database like OpenStreetMap or a specialized API
        # For this example, we'll return dummy data
        
        # Mock different trail difficulties
        trail_difficulties = ['easy', 'moderate', 'difficult', 'very_difficult']
        
        # Use the coordinates to seed a random generator for consistency
        lat, lon = location
        np.random.seed(int((lat + 180) * 1000) + int((lon + 360) * 1000))
        
        # Generate a random number of trails (0-5)
        num_trails = np.random.randint(0, 6)
        
        trails = []
        for i in range(num_trails):
           # Generate random trail properties
            length = float(np.random.uniform(1, 20))  # miles
            difficulty = np.random.choice(trail_difficulties)
            
            trails.append({
                'id': f"trail_{i+1}",
                'length_mi': length,
                'difficulty': difficulty,
                'name': f"Trail {i+1}"
            })
        
        return {
            'num_trails': num_trails,
            'trails': trails
        }
    
    def get_terrain_context(self, location, radius=1000):
        """
        Get comprehensive terrain context for a location
        
        Parameters:
        location (tuple): (latitude, longitude)
        radius (int): Radius in meters to analyze around the point
        
        Returns:
        dict: Comprehensive terrain information
        """
        # Get basic terrain analysis
        terrain_analysis = self.analyze_terrain(location, radius)
        
        # Get land cover information
        land_cover = self.get_land_cover(location, radius)
        
        # Get protected area information
        protected_area = self.get_protected_areas(location, radius)
        
        # Get trails information
        trails = self.get_trails(location, radius)
        
        # Combine all information
        terrain_context = {
            **terrain_analysis,
            'land_cover': land_cover,
            'protected_area': protected_area,
            'trails': trails
        }
        
        return terrain_context


def example_usage():
    """
    Example usage of the OutdoorRiskAssessment class
    """
    # Initialize the risk assessment system
    risk_system = OutdoorRiskAssessment()
    
    # Example location (Garden of the Gods)
    location = (38.8783, -104.8719)
    
    # Example activity
    activity_type = 'hiking'
    
    # Example user profile
    user_experience = 'intermediate'
    group_size = 3
    equipment_quality = 'good'
    weight_carried = 15  # pounds
    age = 30
    height_weight_ratio = 25
    gender = 'male'
    
    # Example terrain data (would come from GIS)
    terrain_data = {
        'elevation': 6500,  # feet
        'slope': 15,        # degrees
        'ruggedness': 0.6   # index 0-1
    }
    
    # Example weather data (would come from API)
    weather_data = {
        'temperature': 65,       # Fahrenheit
        'precipitation': 0.08,   # inches
        'wind_speed': 12,        # mph
        'thunderstorm_risk': 0.3 # probability 0-1
    }
    
    # Calculate risk score
    risk_category, risk_score, component_scores = risk_system.calculate_risk_score(
        location, activity_type, user_experience, group_size, 
        weather_data, equipment_quality, terrain_data, weight_carried, age, height_weight_ratio, gender
    )
    # Generate risk report
    report = risk_system.generate_risk_report(
        risk_category, risk_score, component_scores, 
        location, activity_type, weather_data, weight_carried, equipment_quality, age, height_weight_ratio, gender
    )
    
    # Print report
    print("OUTDOOR ACTIVITY RISK ASSESSMENT")
    print("===============================")
    print(f"Activity: {report['summary']['activity']}")
    print(f"Location: {report['summary']['location']}")
    print(f"Time: {report['summary']['assessment_time']}")
    print(f"Risk Level: {report['summary']['risk_category']} ({report['summary']['risk_score']})")
    print("\nComponent Risks:")
    print(f"  - Terrain: {report['component_risks']['terrain']}")
    print(f"  - Weather: {report['component_risks']['weather']}")
    print(f"  - Human Factors: {report['component_risks']['human_factors']}")
    print(f"  - Equipment: {report['component_risks']['equipment']}")
    print(f"  - Weight Carried: {report['component_risks']['weight_carried']}")
    print("\nWeather Conditions:")
    print(f"  - Temperature: {report['weather_conditions']['temperature']}")
    print(f"  - Precipitation: {report['weather_conditions']['precipitation']}")
    print(f"  - Wind Speed: {report['weather_conditions']['wind_speed']}")
    print(f"  - Thunderstorm Risk: {report['weather_conditions']['thunderstorm_risk']}")
    print("\nEquipment Details:")
    print(f"  - Quality: {report['equipment_details']['quality']}")
    print(f"  - Weight Carried: {report['equipment_details']['weight_carried']}")
    print("\nUser Details:")
    print(f"  - Age: {report['user_details']['age']}")
    print(f"  - Height-Weight Ratio: {report['user_details']['height_weight_ratio']}")
    print(f"  - Gender: {report['user_details']['gender']}")
    print("\nRecommendations:")
    for i, rec in enumerate(report['recommendations'], 1):
        print(f"  {i}. {rec}")


def real_time_assessment(api_key):
    """
    Run a risk assessment with real-time weather data
    """
    # Initialize the risk assessment system
    risk_system = OutdoorRiskAssessment()
    
    # Example locations near Colorado Springs
    locations = {
        'Garden of the Gods': (38.8783, -104.8719),
        'Pikes Peak': (38.8409, -105.0423),
        'Cheyenne Mountain': (38.7447, -104.8506),
        'Palmer Park': (38.8937, -104.7836)
    }
    
    print("Available locations:")
    for i, (name, _) in enumerate(locations.items(), 1):
        print(f"{i}. {name}")
    
    # Get user input for location
    location_idx = int(input("\nSelect a location (1-4): ")) - 1
    location_name = list(locations.keys())[location_idx]
    location = locations[location_name]
    
    # Get user input for activity
    print("\nAvailable activities:")
    activities = list(risk_system.activity_types.keys())
    for i, activity in enumerate(activities, 1):
        print(f"{i}. {activity.replace('_', ' ').title()}")
    
    activity_idx = int(input("\nSelect an activity (1-6): ")) - 1
    activity_type = activities[activity_idx]
    
    # Get user profile
    print("\nExperience level:")
    experience_levels = list(risk_system.experience_levels.keys())
    for i, level in enumerate(experience_levels, 1):
        print(f"{i}. {level.title()}")
    
    exp_idx = int(input("\nSelect experience level (1-4): ")) - 1
    user_experience = experience_levels[exp_idx]
    
    # Get group size
    group_size = int(input("\nEnter group size: "))
    
    # Get weight carried
    weight_carried = float(input("\nEnter weight carried (in pounds): "))
    
    # Get equipment quality
    print("\nEquipment quality:")
    equipment_qualities = list(risk_system.equipment_quality.keys())
    for i, quality in enumerate(equipment_qualities, 1):
        print(f"{i}. {quality.title()}")
    
    equip_idx = int(input("\nSelect equipment quality (1-4): ")) - 1
    equipment_quality = equipment_qualities[equip_idx]
    
    # Get user physical attributes
    age = int(input("\nEnter your age: "))
    height_weight_ratio = float(input("\nEnter your height-weight ratio: "))
    print("\nGender:")
    genders = ['male', 'female', 'other']
    for i, gender in enumerate(genders, 1):
        print(f"{i}. {gender.title()}")
    gender_idx = int(input("\nSelect your gender (1-3): ")) - 1
    gender = genders[gender_idx]
    
    # Example terrain data in feet (would come from GIS)
    # In a full implementation, this would come from a GIS database
    terrain_data = {
        'Garden of the Gods': {'elevation': 6400, 'slope': 15, 'ruggedness': 0.7},
        'Pikes Peak': {'elevation': 14115, 'slope': 30, 'ruggedness': 0.9},
        'Cheyenne Mountain': {'elevation': 9200, 'slope': 25, 'ruggedness': 0.8},
        'Palmer Park': {'elevation': 6250, 'slope': 10, 'ruggedness': 0.5}
    }
    
    # Fetch real-time weather data
    print("\nFetching real-time weather data...")
    weather_data = fetch_weather_data(api_key, location)
    
    if not weather_data:
        print("Failed to fetch weather data. Using default values.")
        weather_data = {
            'temperature': 68,     # Fahrenheit
            'precipitation': 0,    # inches
            'wind_speed': 6,       # mph
            'thunderstorm_risk': 0 # probability 0-1
        }
    
    # Calculate risk score
    risk_category, risk_score, component_scores = risk_system.calculate_risk_score(
        location, activity_type, user_experience, group_size, 
        weather_data, equipment_quality, terrain_data[location_name], weight_carried, age, height_weight_ratio, gender
    )
    
    # Generate risk report
    report = risk_system.generate_risk_report(
        risk_category, risk_score, component_scores, 
        location, activity_type, weather_data, weight_carried, equipment_quality, age, height_weight_ratio, gender
    )
    
    # Print report
    print("\n" + "="*50)
    print("OUTDOOR ACTIVITY RISK ASSESSMENT")
    print("="*50)
    print(f"Activity: {report['summary']['activity']} at {location_name}")
    print(f"Location: {report['summary']['location']}")
    print(f"Time: {report['summary']['assessment_time']}")
    print(f"Risk Level: {report['summary']['risk_category']} ({report['summary']['risk_score']})")
    print("\nComponent Risks:")
    print(f"  - Terrain: {report['component_risks']['terrain']}")
    print(f"  - Weather: {report['component_risks']['weather']}")
    print(f"  - Human Factors: {report['component_risks']['human_factors']}")
    print(f"  - Equipment: {report['component_risks']['equipment']}")
    print(f"  - Weight Carried: {report['component_risks']['weight_carried']}")
    print("\nCurrent Weather:")
    print(f"  - Temperature: {report['weather_conditions']['temperature']}")
    print(f"  - Precipitation: {report['weather_conditions']['precipitation']}")
    print(f"  - Wind Speed: {report['weather_conditions']['wind_speed']}")
    print(f"  - Thunderstorm Risk: {report['weather_conditions']['thunderstorm_risk']}")
    print("\nEquipment Details:")
    print(f"  - Quality: {report['equipment_details']['quality']}")
    print(f"  - Weight Carried: {report['equipment_details']['weight_carried']}")
    print("\nUser Details:")
    print(f"  - Age: {report['user_details']['age']}")
    print(f"  - Height-Weight Ratio: {report['user_details']['height_weight_ratio']}")
    print(f"  - Gender: {report['user_details']['gender']}")
    print("\nRecommendations:")
    for i, rec in enumerate(report['recommendations'], 1):
        print(f"  {i}. {rec}")


def integrate_gis_terrain_analyzer():
    """
    Extend the OutdoorRiskAssessment class to use GISTerrainAnalyzer
    """
    # Initialize the risk assessment system
    risk_system = OutdoorRiskAssessment()
    
    # Initialize the GIS terrain analyzer
    terrain_analyzer = GISTerrainAnalyzer()
    
    # Example locations near Colorado Springs
    locations = {
        'Garden of the Gods': (38.8783, -104.8719),
        'Pikes Peak': (38.8409, -105.0423),
        'Cheyenne Mountain': (38.7447, -104.8506),
        'Palmer Park': (38.8937, -104.7836)
    }
    
    print("Available locations:")
    for i, (name, _) in enumerate(locations.items(), 1):
        print(f"{i}. {name}")
    
    # Get user input for location
    location_idx = int(input("\nSelect a location (1-4): ")) - 1
    location_name = list(locations.keys())[location_idx]
    location = locations[location_name]
    
    # Get user input for activity
    print("\nAvailable activities:")
    activities = list(risk_system.activity_types.keys())
    for i, activity in enumerate(activities, 1):
        print(f"{i}. {activity.replace('_', ' ').title()}")
    
    activity_idx = int(input("\nSelect an activity (1-6): ")) - 1
    activity_type = activities[activity_idx]
    
    # Get user profile
    print("\nExperience level:")
    experience_levels = list(risk_system.experience_levels.keys())
    for i, level in enumerate(experience_levels, 1):
        print(f"{i}. {level.title()}")
    
    exp_idx = int(input("\nSelect experience level (1-4): ")) - 1
    user_experience = experience_levels[exp_idx]
    
    # Get group size
    group_size = int(input("\nEnter group size: "))
    
    # Get weight carried
    weight_carried = float(input("\nEnter weight carried (in pounds): "))
    
    # Get equipment quality
    print("\nEquipment quality:")
    equipment_qualities = list(risk_system.equipment_quality.keys())
    for i, quality in enumerate(equipment_qualities, 1):
        print(f"{i}. {quality.title()}")
    
    equip_idx = int(input("\nSelect equipment quality (1-4): ")) - 1
    equipment_quality = equipment_qualities[equip_idx]
    
    # Get user physical attributes
    age = int(input("\nEnter your age: "))
    height_weight_ratio = float(input("\nEnter your height-weight ratio: "))
    print("\nGender:")
    genders = ['male', 'female', 'other']
    for i, gender in enumerate(genders, 1):
        print(f"{i}. {gender.title()}")
    gender_idx = int(input("\nSelect your gender (1-3): ")) - 1
    gender = genders[gender_idx]
    
    # Get terrain data from GIS
    print("\nFetching GIS terrain data...")
    terrain_data = terrain_analyzer.get_terrain_context(location)
    
    # Extract key terrain metrics for risk assessment
    terrain_metrics = {
        'elevation': terrain_data['elevation'],  # already in feet
        'slope': terrain_data['slope'],
        'ruggedness': terrain_data['ruggedness']
    }
    
    # Fetch real-time weather data
    print("\nFetching real-time weather data...")
    # Use the provided OpenWeatherMap API key
    API_KEY = "4a83bd4fc2b689e8056e4bb5fe026641"
    weather_data = fetch_weather_data(API_KEY, location)
    
    # Calculate risk score
    risk_category, risk_score, component_scores = risk_system.calculate_risk_score(
        location, activity_type, user_experience, group_size, 
        weather_data, equipment_quality, terrain_metrics, weight_carried, age, height_weight_ratio, gender
    )
    
    # Generate risk report
    report = risk_system.generate_risk_report(
        risk_category, risk_score, component_scores, 
        location, activity_type, weather_data, weight_carried, equipment_quality, age, height_weight_ratio, gender
    )
    
    # Enhance report with GIS context
    report['gis_context'] = {
        'land_cover': {
            'dominant_type': terrain_data['land_cover']['dominant_type']
        },
        'protected_area': terrain_data['protected_area'],
        'nearby_trails': len(terrain_data['trails']['trails'])
    }
    
    # Print enhanced report
    print("\n" + "="*50)
    print("OUTDOOR ACTIVITY RISK ASSESSMENT")
    print("="*50)
    print(f"Activity: {report['summary']['activity']} at {location_name}")
    print(f"Location: {report['summary']['location']}")
    print(f"Time: {report['summary']['assessment_time']}")
    print(f"Risk Level: {report['summary']['risk_category']} ({report['summary']['risk_score']})")
    
    print("\nComponent Risks:")
    print(f"  - Terrain: {report['component_risks']['terrain']}")
    print(f"  - Weather: {report['component_risks']['weather']}")
    print(f"  - Human Factors: {report['component_risks']['human_factors']}")
    print(f"  - Equipment: {report['component_risks']['equipment']}")
    print(f"  - Weight Carried: {report['component_risks']['weight_carried']}")
    
    print("\nCurrent Weather:")
    print(f"  - Temperature: {report['weather_conditions']['temperature']}")
    print(f"  - Precipitation: {report['weather_conditions']['precipitation']}")
    print(f"  - Wind Speed: {report['weather_conditions']['wind_speed']}")
    print(f"  - Thunderstorm Risk: {report['weather_conditions']['thunderstorm_risk']}")
    
    print("\nEquipment Details:")
    print(f"  - Quality: {report['equipment_details']['quality']}")
    print(f"  - Weight Carried: {report['equipment_details']['weight_carried']}")
    
    print("\nUser Details:")
    print(f"  - Age: {report['user_details']['age']}")
    print(f"  - Height-Weight Ratio: {report['user_details']['height_weight_ratio']}")
    print(f"  - Gender: {report['user_details']['gender']}")
    
    print("\nTerrain Context:")
    print(f"  - Elevation: {terrain_metrics['elevation']:.1f} feet")
    print(f"  - Average Slope: {terrain_metrics['slope']:.1f} degrees")
    print(f"  - Terrain Ruggedness: {terrain_metrics['ruggedness']:.2f}")
    print(f"  - Dominant Land Cover: {report['gis_context']['land_cover']['dominant_type'].title()}")
    
    if report['gis_context']['protected_area']['is_protected']:
        print(f"  - Protected Area: {report['gis_context']['protected_area']['name']} ({report['gis_context']['protected_area']['type'].replace('_', ' ').title()})")
    else:
        print("  - Protected Area: None")
    
    print(f"  - Nearby Trails: {report['gis_context']['nearby_trails']}")
    
    print("\nRecommendations:")
    for i, rec in enumerate(report['recommendations'], 1):
        print(f"  {i}. {rec}")


# Main entry point
if __name__ == "__main__":
    # Choose which function to run
    print("Choose an option:")
    print("1. Basic example")
    print("2. Real-time weather assessment")
    print("3. Full GIS-integrated assessment")
    
    choice = int(input("\nEnter your choice (1-3): "))
    
    if choice == 1:
        example_usage()
    elif choice == 2:
        # Use the provided OpenWeatherMap API key
        API_KEY = "4a83bd4fc2b689e8056e4bb5fe026641"
        real_time_assessment(API_KEY)
    elif choice == 3:
        integrate_gis_terrain_analyzer()
    else:
        print("Invalid choice")