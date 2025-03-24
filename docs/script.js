// Set up the current date
document.addEventListener('DOMContentLoaded', function() {
    const currentDateElement = document.getElementById('current-date');
    const today = new Date();
    currentDateElement.textContent = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Set up form event handlers
    setupFormHandlers();
    
    // Show/hide manual weather inputs
    const useRealtimeWeatherCheckbox = document.getElementById('use-realtime-weather');
    const manualWeatherInputs = document.getElementById('manual-weather-inputs');
    
    useRealtimeWeatherCheckbox.addEventListener('change', function() {
        manualWeatherInputs.style.display = this.checked ? 'none' : 'block';
    });
});

// Setup form submission and back button handler
function setupFormHandlers() {
    const calculateBtn = document.getElementById('calculate-risk');
    const backBtn = document.getElementById('back-btn');
    
    calculateBtn.addEventListener('click', function() {
        processFormData();
    });
    
    backBtn.addEventListener('click', function() {
        document.getElementById('assessment-container').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('results').style.display = 'none';
        document.getElementById('assessment-form').style.display = 'block';
    });
}

// Unit conversion functions
function metersToMiles(meters) {
    return meters * 0.000621371;
}

function kilometersToMiles(km) {
    return km * 0.621371;
}

function metersTofeet(meters) {
    return meters * 3.28084;
}

function kgToPounds(kg) {
    return kg * 2.20462;
}

function cmToInches(cm) {
    return cm * 0.393701;
}

function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

// Process form data and calculate risk
function processFormData() {
    // Get user inputs
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const heightInches = parseFloat(document.getElementById('height').value);
    const weightPounds = parseFloat(document.getElementById('weight').value);
    const weightCarriedPounds = parseFloat(document.getElementById('weight-carried').value);
    
    // Get location and activity details
    const location = document.getElementById('location').value.replace(/-/g, ' ');
    const searchRadius = parseFloat(document.getElementById('search-radius').value);
    const activityType = document.getElementById('activity-type').value.replace(/-/g, '_');
    const experience = document.getElementById('experience-level').value;
    const groupSize = parseInt(document.getElementById('group-size').value);
    const equipmentQuality = document.getElementById('equipment-quality').value;
    
    // Get weather data (simulated or user input)
    const useRealWeather = document.getElementById('use-real-weather').checked;
    let weatherData;
    
    if (useRealWeather) {
        // Simulate weather data from API
        weatherData = getSimulatedWeatherData(location);
    } else {
        // This would normally get data from form fields, but for simplicity we'll use simulated data
        weatherData = getSimulatedWeatherData(location);
    }
    
    // Get terrain data (simulated)
    const terrainData = getTerrainData(location);
    
    // Calculate risk factors
    const riskFactors = calculateRiskFactors(
        age, gender, heightInches, weightPounds, weightCarriedPounds,
        location, activityType, experience, groupSize,
        equipmentQuality, weatherData, terrainData
    );
    
    // Update the UI with the risk assessment
    updateRiskAssessment(riskFactors, location, activityType, weatherData, terrainData);
    
    // Display the results section and hide the form
    document.getElementById('assessment-form').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// Simulated weather data - would be replaced with API call to weather service
function getSimulatedWeatherData(location) {
    // Base temperature varies by location
    let temperature, precipitation, windSpeed, thunderstormRisk, uvIndex;
    
    // Adjust based on location elevation
    if (location === 'Pikes Peak') {
        temperature = 54; // Colder at high elevation
        precipitation = 0.1;
        windSpeed = 15;
        thunderstormRisk = 7;
        uvIndex = 9; // Higher UV at higher elevation
    } else if (location === 'Garden of the Gods') {
        temperature = 72;
        precipitation = 0;
        windSpeed = 8;
        thunderstormRisk = 2;
        uvIndex = 6;
    } else if (location === 'Manitou Incline') {
        temperature = 68;
        precipitation = 0.05;
        windSpeed = 10;
        thunderstormRisk = 4;
        uvIndex = 7;
    } else if (location === 'Cheyenne Mountain') {
        temperature = 65;
        precipitation = 0.2;
        windSpeed = 12;
        thunderstormRisk = 5;
        uvIndex = 7;
    } else {
        temperature = 70;
        precipitation = 0.1;
        windSpeed = 5;
        thunderstormRisk = 3;
        uvIndex = 6;
    }
    
    // Add some randomness
    temperature += Math.random() * 10 - 5;
    windSpeed += Math.random() * 5 - 2.5;
    
    return {
        temperature: Math.round(temperature),
        precipitation: precipitation,
        windSpeed: Math.round(windSpeed),
        thunderstormRisk: thunderstormRisk,
        uvIndex: uvIndex
    };
}

// Simulated terrain data - would be replaced with actual GIS data
function getTerrainData(location) {
    let elevation, slope, ruggedness, elevationChange;
    
    // Values based on location
    if (location === 'Pikes Peak') {
        elevation = 14115; // feet
        slope = 20;
        ruggedness = 0.8;
        elevationChange = 7400; // feet (from base to summit)
    } else if (location === 'Garden of the Gods') {
        elevation = 6400;
        slope = 10;
        ruggedness = 0.5;
        elevationChange = 300;
    } else if (location === 'Manitou Incline') {
        elevation = 8600;
        slope = 40;
        ruggedness = 0.7;
        elevationChange = 2000;
    } else if (location === 'Cheyenne Mountain') {
        elevation = 9560;
        slope = 25;
        ruggedness = 0.7;
        elevationChange = 3250;
    } else {
        elevation = 6800;
        slope = 15;
        ruggedness = 0.4;
        elevationChange = 500;
    }
    
    return {
        elevation: elevation,
        slope: slope,
        ruggedness: ruggedness,
        elevationChange: elevationChange
    };
}

// Calculate individual risk factors
function calculateRiskFactors(age, gender, heightInches, weightPounds, weightCarriedPounds,
                             location, activityType, experience, groupSize,
                             equipmentQuality, weatherData, terrainData) {
    
    // Base activity risk
    let activityRisk = 0;
    switch (activityType) {
        case 'hiking':
            activityRisk = 3;
            break;
        case 'rock_climbing':
            activityRisk = 7;
            break;
        case 'mountain_biking':
            activityRisk = 6;
            break;
        case 'backcountry_skiing':
            activityRisk = 8;
            break;
        case 'kayaking':
            activityRisk = 7;
            break;
        case 'trail_running':
            activityRisk = 5;
            break;
    }
    
    // Experience modifier (inverse relationship)
    const experienceModifier = {
        'beginner': 2.0,
        'intermediate': 1.5,
        'advanced': 1.0,
        'expert': 0.7
    };
    
    // Equipment quality modifier (inverse relationship)
    const equipmentModifier = {
        'poor': 2.0,
        'basic': 1.5,
        'good': 1.0,
        'excellent': 0.7
    };
    
    // Group size risk - solo is risky, 2-4 is optimal, more than 4 increases risk slightly
    let groupRisk = 0;
    if (groupSize === 1) {
        groupRisk = 3;
    } else if (groupSize >= 2 && groupSize <= 4) {
        groupRisk = 1;
    } else {
        groupRisk = 2;
    }
    
    // Calculate BMI (height in inches, weight in pounds)
    const bmi = (weightPounds / (heightInches * heightInches)) * 703;
    
    // Physical factors risk
    let physicalRisk = 0;
    
    // Age risk
    if (age < 25) {
        physicalRisk += 1;
    } else if (age >= 25 && age < 40) {
        physicalRisk += 0;
    } else if (age >= 40 && age < 60) {
        physicalRisk += 1;
    } else {
        physicalRisk += 2;
    }
    
    // BMI risk
    if (bmi < 18.5) {
        physicalRisk += 1; // Underweight
    } else if (bmi >= 18.5 && bmi < 25) {
        physicalRisk += 0; // Normal
    } else if (bmi >= 25 && bmi < 30) {
        physicalRisk += 1; // Overweight
    } else {
        physicalRisk += 2; // Obese
    }
    
    // Weight carried risk (as percentage of body weight)
    const weightCarriedRatio = weightCarriedPounds / weightPounds;
    let weightCarriedRisk = 0;
    if (weightCarriedRatio < 0.05) {
        weightCarriedRisk = 0;
    } else if (weightCarriedRatio < 0.15) {
        weightCarriedRisk = 1;
    } else if (weightCarriedRatio < 0.25) {
        weightCarriedRisk = 2;
    } else {
        weightCarriedRisk = 3;
    }
    
    // Add weight carried risk to physical risk
    physicalRisk += weightCarriedRisk;
    
    // Terrain risk
    let terrainRisk = 0;
    terrainRisk += terrainData.slope * 0.1;
    terrainRisk += terrainData.ruggedness * 3;
    
    // Elevation risk is based on elevation and elevation change
    const elevationRisk = (terrainData.elevation / 14000) * 5 + (terrainData.elevationChange / 7000) * 5;
    
    // Weather risk
    let weatherRisk = 0;
    
    // Temperature risk (extremes increase risk)
    const tempF = weatherData.temperature;
    if (tempF < 32) {
        weatherRisk += 3; // Freezing
    } else if (tempF < 45) {
        weatherRisk += 2; // Cold
    } else if (tempF > 90) {
        weatherRisk += 3; // Very hot
    } else if (tempF > 80) {
        weatherRisk += 2; // Hot
    }
    
    // Precipitation risk
    weatherRisk += weatherData.precipitation * 10;
    
    // Wind risk
    if (weatherData.windSpeed > 30) {
        weatherRisk += 3;
    } else if (weatherData.windSpeed > 20) {
        weatherRisk += 2;
    } else if (weatherData.windSpeed > 10) {
        weatherRisk += 1;
    }
    
    // Thunderstorm risk
    weatherRisk += weatherData.thunderstormRisk * 0.5;
    
    // UV Index risk
    if (weatherData.uvIndex >= 11) {
        weatherRisk += 3; // Extreme
    } else if (weatherData.uvIndex >= 8) {
        weatherRisk += 2; // Very High
    } else if (weatherData.uvIndex >= 6) {
        weatherRisk += 1; // High
    }
    
    // Calculate final risk scores (0-10 scale)
    const activityFactorRisk = Math.min(10, activityRisk * experienceModifier[experience]);
    const humanFactorsRisk = Math.min(10, physicalRisk + groupRisk);
    const terrainFactorsRisk = Math.min(10, terrainRisk + elevationRisk * 0.5);
    const weatherFactorsRisk = Math.min(10, weatherRisk);
    const equipmentFactorsRisk = Math.min(10, activityRisk * equipmentModifier[equipmentQuality]);
    
    // Calculate overall risk (weighted average)
    const overallRisk = Math.min(10, (
        activityFactorRisk * 0.2 +
        humanFactorsRisk * 0.2 +
        terrainFactorsRisk * 0.2 +
        weatherFactorsRisk * 0.3 +
        equipmentFactorsRisk * 0.1
    ));
    
    // Return all risk factors
    return {
        overallRisk: overallRisk,
        activityRisk: activityFactorRisk,
        humanFactors: humanFactorsRisk,
        terrainRisk: terrainFactorsRisk,
        weatherRisk: weatherFactorsRisk,
        equipmentRisk: equipmentFactorsRisk,
        bmi: bmi,
        weightCarriedRatio: weightCarriedRatio
    };
}

// Update the UI with risk assessment results
function updateRiskAssessment(riskFactors, location, activityType, weatherData, terrainData) {
    // Format the activity name for display
    const formattedActivityType = formatActivityName(activityType);
    
    // Display activity and location
    document.getElementById('activity-location').textContent = `${formattedActivityType} at ${location}`;
    
    // Calculate total risk
    const totalRisk = riskFactors.overallRisk;
    
    // Determine risk level based on total risk
    let riskLevel = 'LOW';
    let riskPercentage = 0;
    
    if (totalRisk <= 3) {
        riskLevel = 'LOW';
        riskPercentage = (totalRisk / 3) * 25;
    } else if (totalRisk <= 5) {
        riskLevel = 'MODERATE';
        riskPercentage = 25 + ((totalRisk - 3) / 2) * 25;
    } else if (totalRisk <= 8) {
        riskLevel = 'HIGH';
        riskPercentage = 50 + ((totalRisk - 5) / 3) * 25;
    } else {
        riskLevel = 'EXTREME';
        riskPercentage = 75 + ((totalRisk - 8) / 2) * 25;
    }
    
    // Update risk indicator position
    document.getElementById('risk-indicator').style.left = `${riskPercentage}%`;
    
    // Update risk level text
    document.getElementById('risk-level').textContent = riskLevel;
    document.getElementById('risk-level').className = `risk-level-text ${riskLevel.toLowerCase()}`;
    
    // Set the color of the risk level text based on the risk level
    switch(riskLevel) {
        case 'LOW':
            document.getElementById('risk-level').style.backgroundColor = 'var(--risk-low)';
            document.getElementById('risk-level').style.color = '#000';
            break;
        case 'MODERATE':
            document.getElementById('risk-level').style.backgroundColor = 'var(--risk-moderate)';
            document.getElementById('risk-level').style.color = '#000';
            break;
        case 'HIGH':
            document.getElementById('risk-level').style.backgroundColor = 'var(--risk-high)';
            break;
        case 'EXTREME':
            document.getElementById('risk-level').style.backgroundColor = 'var(--risk-extreme)';
            break;
    }
    
    // Display risk factors
    const riskFactorsElement = document.getElementById('risk-factors');
    riskFactorsElement.innerHTML = '';
    
    // Create list of risk factors
    const riskFactorsList = [
        {name: 'Activity Difficulty', value: riskFactors.activityRisk.toFixed(1)},
        {name: 'Human Factors (Based on User Entered Attributes)', value: riskFactors.humanFactors.toFixed(1)},
        {name: 'Terrain Difficulty', value: riskFactors.terrainRisk.toFixed(1)},
        {name: 'Weather Risk', value: riskFactors.weatherRisk.toFixed(1)},
        {name: 'Equipment Risk', value: riskFactors.equipmentRisk.toFixed(1)},
        {name: 'UV Index', value: weatherData.uvIndex.toFixed(1)},
        {name: 'Elevation Change (feet)', value: terrainData.elevationChange}
    ];
    
    // Add risk factors to the list
    riskFactorsList.forEach(factor => {
        const listItem = document.createElement('li');
        
        // Determine risk level class based on value
        let riskClass = '';
        if (factor.name !== 'Elevation Change (feet)') {
            const value = parseFloat(factor.value);
            if (value < 3) {
                riskClass = 'low-risk';
            } else if (value < 6) {
                riskClass = 'moderate-risk';
            } else if (value < 8) {
                riskClass = 'high-risk';
            } else {
                riskClass = 'extreme-risk';
            }
        }
        
        listItem.innerHTML = `${factor.name} <span class="value ${riskClass}">${factor.value}</span>`;
        riskFactorsElement.appendChild(listItem);
    });
    
    // Add overall risk at the end
    const overallRiskItem = document.createElement('li');
    
    // Determine overall risk level class
    let overallRiskClass = '';
    if (totalRisk < 3) {
        overallRiskClass = 'low-risk';
    } else if (totalRisk < 6) {
        overallRiskClass = 'moderate-risk';
    } else if (totalRisk < 8) {
        overallRiskClass = 'high-risk';
    } else {
        overallRiskClass = 'extreme-risk';
    }
    
    overallRiskItem.innerHTML = `<strong id="overall-risk" class="${overallRiskClass}">Overall Risk (${totalRisk.toFixed(1)})</strong>`;
    riskFactorsElement.appendChild(overallRiskItem);
    
    // Generate and display recommendations
    const recommendations = generateRecommendations(riskLevel, activityType, riskFactors, weatherData, terrainData);
    
    // Display GIS context
    displayGISContext(location, terrainData, riskFactors);
    
    // Display weather forecast
    displayForecast(generateWeatherForecast(location));
}

// Generate activity-specific recommendations
function generateRecommendations(riskLevel, activityType, riskFactors, weatherData, terrainData) {
    const recommendationsElement = document.getElementById('recommendations');
    recommendationsElement.innerHTML = '';
    
    // General recommendations based on risk level
    let generalRecommendations = [];
    if (riskLevel === 'LOW') {
        generalRecommendations.push('Conditions are generally favorable for this activity.');
        generalRecommendations.push('Always carry water and basic first aid supplies.');
    } else if (riskLevel === 'MODERATE') {
        generalRecommendations.push('Exercise caution and be prepared for changing conditions.');
        generalRecommendations.push('Carry extra supplies and inform someone of your plans.');
    } else if (riskLevel === 'HIGH') {
        generalRecommendations.push('Consider postponing or choosing a less challenging route.');
        generalRecommendations.push('Only proceed if you have proper training and equipment.');
        generalRecommendations.push('Check in regularly with your emergency contact.');
    } else {
        generalRecommendations.push('Strongly recommended to postpone this activity.');
        generalRecommendations.push('Current conditions present significant dangers.');
        generalRecommendations.push('Seek professional guidance before proceeding.');
    }
    
    // Activity-specific recommendations
    let activityRecommendations = [];
    
    switch (activityType) {
        case 'hiking':
            activityRecommendations.push('Bring appropriate footwear with good traction.');
            activityRecommendations.push('Carry a detailed trail map and compass.');
            if (weatherData.temperature > 80) {
                activityRecommendations.push('Bring extra water to prevent dehydration.');
            }
            if (weatherData.uvIndex > 7) {
                activityRecommendations.push('Apply sunscreen, wear a hat, and bring sunglasses.');
            }
            break;
            
        case 'rock_climbing':
            activityRecommendations.push('Double-check all equipment before climbing.');
            activityRecommendations.push('Use a helmet and proper safety gear.');
            if (weatherData.precipitation > 0) {
                activityRecommendations.push('Wet conditions make climbing extremely dangerous - postpone activity.');
            }
            break;
            
        case 'mountain_biking':
            activityRecommendations.push('Wear a helmet and appropriate protective gear.');
            activityRecommendations.push('Check bike components before riding.');
            if (terrainData.slope > 20) {
                activityRecommendations.push('Steep terrain requires advanced braking techniques.');
            }
            break;
            
        case 'backcountry_skiing':
            activityRecommendations.push('Carry avalanche safety equipment and know how to use it.');
            activityRecommendations.push('Check avalanche forecasts before heading out.');
            if (weatherData.temperature > 32) {
                activityRecommendations.push('Warmer temperatures increase avalanche risk.');
            }
            break;
            
        case 'kayaking':
            activityRecommendations.push('Always wear a personal flotation device.');
            activityRecommendations.push('Check water levels and flow rates before starting.');
            if (weatherData.thunderstormRisk > 3) {
                activityRecommendations.push('Water activities during thunderstorms are extremely dangerous.');
            }
            break;
            
        case 'trail_running':
            activityRecommendations.push('Wear proper trail running shoes with good traction.');
            activityRecommendations.push('Carry water and electrolyte replacement.');
            if (terrainData.elevation > 8000) {
                activityRecommendations.push('Altitude may affect performance - pace yourself accordingly.');
            }
            if (weatherData.uvIndex > 7) {
                activityRecommendations.push('Apply sunscreen and wear a hat to protect from UV exposure.');
            }
            break;
    }
    
    // Weather-specific recommendations
    let weatherRecommendations = [];
    
    if (weatherData.temperature < 40) {
        weatherRecommendations.push('Dress in warm, layered clothing to prevent hypothermia.');
    }
    
    if (weatherData.thunderstormRisk > 5) {
        weatherRecommendations.push('Be aware of lightning safety protocols. Seek shelter at first signs of thunder.');
    }
    
    if (weatherData.windSpeed > 20) {
        weatherRecommendations.push('High winds can affect balance and increase wind chill factor.');
    }
    
    if (weatherData.uvIndex > 8) {
        weatherRecommendations.push('Extreme UV levels - reapply sunscreen every 2 hours and cover exposed skin.');
    }
    
    // Add all recommendations to the list
    [...generalRecommendations, ...activityRecommendations, ...weatherRecommendations].forEach(recommendation => {
        const li = document.createElement('li');
        li.textContent = recommendation;
        recommendationsElement.appendChild(li);
    });
}

// Display GIS context information
function displayGISContext(location, terrainData, riskFactors) {
    const gisContextElement = document.getElementById('gis-context');
    gisContextElement.innerHTML = '';
    
    // Location details
    const locationInfo = document.createElement('li');
    locationInfo.textContent = `Location: ${location} at elevation ${terrainData.elevation} feet`;
    locationInfo.className = 'primary-item';
    gisContextElement.appendChild(locationInfo);
    
    // Terrain characteristics
    const terrainInfo = document.createElement('li');
    terrainInfo.textContent = `Average slope: ${terrainData.slope}° with ${terrainData.elevationChange} feet elevation change`;
    terrainInfo.className = 'primary-item';
    gisContextElement.appendChild(terrainInfo);
    
    // Nearby trails (simulated data)
    const nearbyTrails = getNearbyTrails(location);
    
    const trailsInfo = document.createElement('li');
    trailsInfo.innerHTML = `Nearby trails: ${nearbyTrails.length} within search radius`;
    trailsInfo.className = 'primary-item';
    gisContextElement.appendChild(trailsInfo);
    
    // List all nearby trails
    if (nearbyTrails.length > 0) {
        const trailsList = document.createElement('ul');
        trailsList.className = 'sub-list';
        
        nearbyTrails.forEach(trail => {
            const trailItem = document.createElement('li');
            trailItem.textContent = `${trail.name} (${trail.distance.toFixed(2)} miles, Difficulty: ${trail.difficulty})`;
            trailsList.appendChild(trailItem);
        });
        
        trailsInfo.appendChild(trailsList);
    }
}

// Get nearby trails (simulated data)
function getNearbyTrails(location) {
    // Simulate nearby trails based on location
    const trails = [];
    
    if (location === 'Garden of the Gods') {
        trails.push({ name: 'Palmer Trail', distance: 0.7, difficulty: 'Easy' });
        trails.push({ name: 'Siamese Twins Trail', distance: 1.0, difficulty: 'Easy' });
        trails.push({ name: 'Scotsman Trail', distance: 1.5, difficulty: 'Moderate' });
    } else if (location === 'Pikes Peak') {
        trails.push({ name: 'Barr Trail', distance: 0.1, difficulty: 'Difficult' });
        trails.push({ name: 'Crags Trail', distance: 2.2, difficulty: 'Moderate' });
        trails.push({ name: 'Devils Playground', distance: 3.1, difficulty: 'Difficult' });
    } else if (location === 'Manitou Incline') {
        trails.push({ name: 'Manitou Incline Trail', distance: 0.1, difficulty: 'Difficult' });
        trails.push({ name: 'Barr Trail', distance: 0.8, difficulty: 'Moderate' });
        trails.push({ name: 'Red Mountain Trail', distance: 1.9, difficulty: 'Moderate' });
    } else if (location === 'Cheyenne Mountain') {
        trails.push({ name: 'Dixon Trail', distance: 0.5, difficulty: 'Difficult' });
        trails.push({ name: 'Talon Trail', distance: 1.3, difficulty: 'Moderate' });
        trails.push({ name: 'North Talon Trail', distance: 2.0, difficulty: 'Moderate' });
    } else if (location === 'Palmer Park') {
        trails.push({ name: 'Templeton Trail', distance: 0.4, difficulty: 'Easy' });
        trails.push({ name: 'Yucca Trail', distance: 0.9, difficulty: 'Moderate' });
        trails.push({ name: 'Mesa Trail', distance: 1.6, difficulty: 'Easy' });
    }
    
    // Sort by distance
    return trails.sort((a, b) => a.distance - b.distance);
}

// Generate weather forecast (simulated)
function generateWeatherForecast(location) {
    const forecast = [];
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Possible weather conditions and corresponding icons
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rain', 'Thunderstorm', 'Snow'];
    const icons = {
        'Sunny': 'sun',
        'Partly Cloudy': 'cloud-sun',
        'Cloudy': 'cloud',
        'Rain': 'cloud-rain',
        'Thunderstorm': 'bolt',
        'Snow': 'snowflake'
    };
    
    // Start with weather appropriate for the location's climate
    let baseConditionIndex;
    let baseTempHigh;
    
    if (location.toLowerCase().includes('peak') || location.toLowerCase().includes('mountain')) {
        // Cooler and more variable weather for mountain locations
        baseTempHigh = 55 + Math.floor(Math.random() * 15);
        baseConditionIndex = Math.floor(Math.random() * conditions.length);
    } else {
        // Warmer and more stable weather for lower elevation locations
        baseTempHigh = 65 + Math.floor(Math.random() * 20);
        baseConditionIndex = Math.min(2, Math.floor(Math.random() * conditions.length));
    }
    
    // Generate 4-day forecast
    for (let i = 0; i < 4; i++) {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() + i);
        
        // Temperature variation day-to-day
        const tempVariation = Math.floor(Math.random() * 10) - 5;
        const tempHigh = baseTempHigh + tempVariation;
        const tempLow = tempHigh - 10 - Math.floor(Math.random() * 10);
        
        // Weather condition variation (weather tends to persist with gradual changes)
        let conditionIndex;
        if (i === 0) {
            conditionIndex = baseConditionIndex;
        } else {
            // 70% chance of same condition as previous day, 30% chance of change
            if (Math.random() < 0.7) {
                conditionIndex = forecast[i - 1].conditionIndex;
            } else {
                // More likely to shift by just one step
                const shift = Math.random() < 0.7 ? (Math.random() < 0.5 ? 1 : -1) : Math.floor(Math.random() * conditions.length - 1) + 1;
                conditionIndex = (forecast[i - 1].conditionIndex + shift + conditions.length) % conditions.length;
            }
        }
        
        // Precipitation chance based on condition
        let precipChance = 0;
        if (conditions[conditionIndex] === 'Partly Cloudy') {
            precipChance = Math.floor(Math.random() * 20);
        } else if (conditions[conditionIndex] === 'Cloudy') {
            precipChance = 20 + Math.floor(Math.random() * 40);
        } else if (conditions[conditionIndex] === 'Rain') {
            precipChance = 60 + Math.floor(Math.random() * 40);
        } else if (conditions[conditionIndex] === 'Thunderstorm') {
            precipChance = 70 + Math.floor(Math.random() * 30);
        } else if (conditions[conditionIndex] === 'Snow') {
            precipChance = 60 + Math.floor(Math.random() * 40);
        }
        
        forecast.push({
            day: days[(today.getDay() + i) % 7],
            date: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            tempHigh: tempHigh,
            tempLow: tempLow,
            condition: conditions[conditionIndex],
            icon: icons[conditions[conditionIndex]],
            precipChance: precipChance,
            conditionIndex: conditionIndex,
            isToday: i === 0
        });
    }
    
    return forecast;
}

// Display forecast
function displayForecast(forecast) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';
    
    forecast.forEach(day => {
        const forecastDay = document.createElement('div');
        forecastDay.className = day.isToday ? 'forecast-day today' : 'forecast-day';
        
        forecastDay.innerHTML = `
            <div class="forecast-date">${day.day}</div>
            <div class="weather-icon"><i class="fas fa-${day.icon}"></i></div>
            <div class="forecast-temp">${day.tempHigh}°F / ${day.tempLow}°F</div>
            <div class="forecast-details">
                <div>${day.condition}</div>
                <div>${day.precipChance}% precipitation</div>
            </div>
        `;
        forecastContainer.appendChild(forecastDay);
    });
}

// Format activity name for display
function formatActivityName(activityType) {
    switch (activityType) {
        case 'hiking':
            return 'Hiking';
        case 'rock_climbing':
            return 'Rock Climbing';
        case 'mountain_biking':
            return 'Mountain Biking';
        case 'backcountry_skiing':
            return 'Backcountry Skiing';
        case 'kayaking':
            return 'Kayaking';
        case 'trail_running':
            return 'Trail Running';
        default:
            return activityType;
    }
}
