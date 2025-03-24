document.addEventListener('DOMContentLoaded', function() {
    // Define location coordinates from Python code
    const locations = {
        'Garden of the Gods': [38.8783, -104.8719],
        'Pikes Peak': [38.8409, -105.0423],
        'Cheyenne Mountain': [38.7447, -104.8506],
        'Palmer Park': [38.8937, -104.7836],
        'Manitou Incline': [38.8574, -104.9324]
    };
    
    // Define location-specific risks
    const locationRisks = {
        'Manitou Incline': {
            altitudeGain: 2000, // feet
            inclination: 40, // average degrees
            riskModifier: 1.8 // higher risk modifier
        }
    };
    
    // Update current date
    const dateElement = document.getElementById('current-date');
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
    
    // Handle real-time weather checkbox
    const useRealtimeWeather = document.getElementById('use-realtime-weather');
    const manualWeatherInputs = document.getElementById('manual-weather-inputs');
    
    useRealtimeWeather.addEventListener('change', function() {
        manualWeatherInputs.style.display = this.checked ? 'none' : 'block';
    });
    
    // Convert inches to centimeters
    function inchesToCm(inches) {
        return inches * 2.54;
    }
    
    // Convert pounds to kilograms
    function lbsToKg(pounds) {
        return pounds * 0.453592;
    }
    
    // Convert miles to meters
    function milesToMeters(miles) {
        return miles * 1609.34;
    }
    
    // Convert Fahrenheit to Celsius
    function fahrenheitToCelsius(fahrenheit) {
        return (fahrenheit - 32) * 5/9;
    }
    
    // Convert inches to millimeters
    function inchesToMm(inches) {
        return inches * 25.4;
    }
    
    // Convert kg to pounds
    function kgToLbs(kg) {
        return kg * 2.20462;
    }
    
    // Convert cm to inches
    function cmToInches(cm) {
        return cm / 2.54;
    }
    
    // Convert meters to feet
    function metersToFeet(meters) {
        return meters * 3.28084;
    }
    
    // Convert Celsius to Fahrenheit
    function celsiusToFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }
    
    // Convert meters to miles
    function metersToMiles(meters) {
        return meters / 1609.34;
    }
    
    // Calculate BMI from height in inches and weight in pounds
    function calculateBMI(heightInches, weightLbs) {
        const heightCm = inchesToCm(heightInches);
        const weightKg = lbsToKg(weightLbs);
        const heightM = heightCm / 100;
        return weightKg / (heightM * heightM);
    }
    
    // Handle form submission
    const assessmentForm = document.getElementById('assessment-form');
    const resultsContainer = document.getElementById('results');
    
    assessmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(assessmentForm);
        const locationName = formData.get('location');
        const locationCoords = locations[locationName];
        
        // Get user attributes and convert to metric for calculations
        const heightInches = parseFloat(formData.get('height'));
        const weightLbs = parseFloat(formData.get('weight'));
        const heightCm = inchesToCm(heightInches);
        const weightKg = lbsToKg(weightLbs);
        const bmi = calculateBMI(heightInches, weightLbs);
        
        // Get additional weight carried in pounds
        const additionalWeightLbs = parseFloat(formData.get('weight-carried'));
        
        // Convert search radius from miles to meters
        const radiusMiles = parseFloat(formData.get('radius'));
        const radiusMeters = milesToMeters(radiusMiles);
        
        // Convert temperature from Fahrenheit to Celsius if manually entered
        let temperatureC = 20; // default
        if (!formData.get('use-realtime-weather') === 'on' && formData.get('temperature')) {
            const temperatureF = parseFloat(formData.get('temperature'));
            temperatureC = fahrenheitToCelsius(temperatureF);
        }
        
        // Convert precipitation from inches to mm if manually entered
        let precipitationMm = 0; // default
        if (!formData.get('use-realtime-weather') === 'on' && formData.get('precipitation')) {
            const precipitationInches = parseFloat(formData.get('precipitation'));
            precipitationMm = inchesToMm(precipitationInches);
        }
        
        const data = {
            activityType: formData.get('activity-type'),
            experience: formData.get('experience'),
            groupSize: parseInt(formData.get('group-size')),
            equipmentQuality: formData.get('equipment-quality'),
            weightCarried: additionalWeightLbs,
            location: {
                name: locationName,
                latitude: locationCoords[0],
                longitude: locationCoords[1],
                radius: radiusMeters
            },
            userAttributes: {
                age: parseInt(formData.get('age')),
                height: heightCm,
                weight: weightKg,
                bmi: bmi,
                gender: formData.get('gender')
            },
            useRealtimeWeather: formData.get('use-realtime-weather') === 'on',
            weather: {
                temperature: temperatureC,
                precipitation: precipitationMm,
                windSpeed: parseFloat(formData.get('wind-speed')) || 0,
                thunderstormRisk: parseFloat(formData.get('thunderstorm-risk')) || 0
            }
        };
        
        // Update activity display
        document.getElementById('activity-display').textContent = formatActivityType(data.activityType);
        
        // Calculate risk (simulating the Python code functionality)
        const riskReport = calculateRisk(data);
        
        // Display results
        displayResults(riskReport);
        
        // Hide form, show results
        assessmentForm.style.display = 'none';
        resultsContainer.style.display = 'block';
    });
    
    // Back button functionality
    document.getElementById('back-btn').addEventListener('click', function() {
        assessmentForm.style.display = 'block';
        resultsContainer.style.display = 'none';
    });
    
    // Helper function to format activity type
    function formatActivityType(type) {
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Simulated risk calculation (based on the Python code)
    function calculateRisk(data) {
        // Activity base difficulty values (matching Python code)
        const activityTypes = {
            'hiking': {baseDifficulty: 2, weatherSensitivity: 0.7, equipmentImportance: 0.5, weightSensitivity: 0.8},
            'rock_climbing': {baseDifficulty: 4, weatherSensitivity: 0.9, equipmentImportance: 0.9, weightSensitivity: 0.7},
            'mountain_biking': {baseDifficulty: 3, weatherSensitivity: 0.6, equipmentImportance: 0.8, weightSensitivity: 0.4},
            'backcountry_skiing': {baseDifficulty: 4, weatherSensitivity: 0.95, equipmentImportance: 0.9, weightSensitivity: 0.6},
            'kayaking': {baseDifficulty: 3, weatherSensitivity: 0.8, equipmentImportance: 0.7, weightSensitivity: 0.3},
            'trail_running': {baseDifficulty: 2.5, weatherSensitivity: 0.75, equipmentImportance: 0.6, weightSensitivity: 0.85}
        };
        
        // Experience level modifiers
        const experienceLevels = {
            'beginner': 1.5,
            'intermediate': 1.0,
            'advanced': 0.7,
            'expert': 0.5
        };
        
        // Equipment quality modifiers
        const equipmentQuality = {
            'poor': 2.0,
            'basic': 1.5,
            'good': 1.0,
            'excellent': 0.8
        };
        
        // Physical attributes modifiers
        const ageModifiers = {
            'young': {min: 18, max: 35, modifier: 0.9},
            'middle': {min: 36, max: 50, modifier: 1.0},
            'older': {min: 51, max: 65, modifier: 1.2},
            'senior': {min: 66, max: 120, modifier: 1.5}
        };
        
        const bmiModifiers = {
            'underweight': {min: 0, max: 18.5, modifier: 1.2},
            'normal': {min: 18.5, max: 25, modifier: 1.0},
            'overweight': {min: 25, max: 30, modifier: 1.2},
            'obese': {min: 30, max: 100, modifier: 1.5}
        };
        
        // Simulate terrain risk (would normally come from GIS analysis)
        const terrainRisk = simulateTerrainRisk(data.location);
        document.getElementById('terrain-display').textContent = terrainRiskDescription(terrainRisk);
        
        // Simulate weather risk
        const weatherRisk = simulateWeatherRisk(data.weather, data.activityType);
        document.getElementById('weather-display').textContent = weatherRiskDescription(weatherRisk);
        
        // Calculate human risk factor
        const activityDifficulty = activityTypes[data.activityType].baseDifficulty;
        const experienceModifier = experienceLevels[data.experience];
        const weightSensitivity = activityTypes[data.activityType].weightSensitivity;
        
        // Group size factor
        let groupFactor = 1.0;
        if (data.groupSize === 1) {
            groupFactor = 1.5; // Solo activities are riskier
        } else if (data.groupSize >= 2 && data.groupSize <= 4) {
            groupFactor = 1.0; // Optimal group size
        } else if (data.groupSize >= 5 && data.groupSize <= 8) {
            groupFactor = 1.2; // Larger groups can be safer but may move slower
        } else {
            groupFactor = 1.4; // Very large groups add complexity
        }
        
        // Calculate weight risk
        // Weight threshold categories (in pounds)
        const weightThresholds = {
            'light': 10,      // 0-10 lbs
            'moderate': 25,    // 11-25 lbs
            'heavy': 40,       // 26-40 lbs
            'very_heavy': 60   // 41+ lbs
        };
        
        let weightCategory;
        if (data.weightCarried <= weightThresholds.light) {
            weightCategory = 'light';
        } else if (data.weightCarried <= weightThresholds.moderate) {
            weightCategory = 'moderate';
        } else if (data.weightCarried <= weightThresholds.heavy) {
            weightCategory = 'heavy';
        } else {
            weightCategory = 'very_heavy';
        }
        
        // Weight risk increases with weight category and activity weight sensitivity
        const weightCategoryFactor = {
            'light': 1.0,
            'moderate': 1.5,
            'heavy': 2.5,
            'very_heavy': 4.0
        };
        
        const weightRisk = Math.min(10, 2 * weightCategoryFactor[weightCategory] * weightSensitivity);
        
        // Age modifier
        let ageModifier = 1.0;
        const age = data.userAttributes.age;
        for (const [category, thresholds] of Object.entries(ageModifiers)) {
            if (age >= thresholds.min && age <= thresholds.max) {
                ageModifier = thresholds.modifier;
                break;
            }
        }
        
        // BMI modifier
        let bmiModifier = 1.0;
        const bmi = data.userAttributes.bmi;
        for (const [category, thresholds] of Object.entries(bmiModifiers)) {
            if (bmi >= thresholds.min && bmi < thresholds.max) {
                bmiModifier = thresholds.modifier;
                break;
            }
        }
        
        // Gender modifier (all equal for fairness)
        const genderModifier = 1.0;
        
        // Calculate human risk factor with all modifiers
        const humanRisk = Math.min(10, activityDifficulty * experienceModifier * groupFactor * ageModifier * bmiModifier * genderModifier * 1.2);
        
        // Calculate equipment risk
        const equipmentImportance = activityTypes[data.activityType].equipmentImportance;
        const qualityModifier = equipmentQuality[data.equipmentQuality];
        const equipmentRisk = 5 * equipmentImportance * qualityModifier;
        
        // Calculate overall risk
        let overallRisk = (0.20 * terrainRisk + 
                          0.25 * weatherRisk + 
                          0.25 * humanRisk + 
                          0.15 * equipmentRisk + 
                          0.15 * weightRisk);
        
        // Apply location-specific risk factors
        if (data.location.name in locationRisks) {
            const locationRisk = locationRisks[data.location.name];
            overallRisk *= locationRisk.riskModifier;
        }
        
        // Determine risk category
        let riskCategory;
        if (overallRisk < 3) {
            riskCategory = 'low';
        } else if (overallRisk < 6) {
            riskCategory = 'moderate';
        } else if (overallRisk < 8) {
            riskCategory = 'high';
        } else {
            riskCategory = 'extreme';
        }
        
        // Generate recommendations based on risks
        const recommendations = generateRecommendations(data, riskCategory, terrainRisk, weatherRisk, humanRisk, equipmentRisk, weightRisk);
        
        // Generate GIS context (simulated)
        const gisContext = simulateGISContext(data.location, data.activityType);
        
        // Generate weather forecast (simulated)
        const forecast = generateWeatherForecast(data.location);
        
        return {
            overallRisk: overallRisk,
            riskCategory: riskCategory,
            riskFactors: {
                terrain: terrainRisk,
                weather: weatherRisk,
                human: humanRisk,
                equipment: equipmentRisk,
                weight: weightRisk
            },
            userAttributes: {
                age: data.userAttributes.age,
                heightCm: data.userAttributes.height,
                weightKg: data.userAttributes.weight,
                bmi: data.userAttributes.bmi,
                gender: data.userAttributes.gender
            },
            recommendations: recommendations,
            gisContext: gisContext,
            forecast: forecast,
            locationName: data.location.name,
            weightCarried: data.weightCarried
        };
    }
    
    function simulateTerrainRisk(location) {
        // Specific terrain risk factors for predefined locations
        const terrainRiskByLocation = {
            'Garden of the Gods': 6.2,
            'Pikes Peak': 8.7,
            'Cheyenne Mountain': 7.3,
            'Palmer Park': 4.5,
            'Manitou Incline': 9.5 // High risk due to steep incline and altitude gain
        };
        
        // Return predefined risk if location is known
        if (terrainRiskByLocation[location.name]) {
            return terrainRiskByLocation[location.name];
        }
        
        // Fallback to calculation based on coordinates
        const latFactor = Math.abs(location.latitude) / 90;
        const longFactor = Math.abs(location.longitude) / 180;
        return Math.min(9.5, Math.max(2, 5 * latFactor + 3 * longFactor + Math.random() * 2));
    }
    
    function terrainRiskDescription(risk) {
        if (risk < 3) return "Easy";
        if (risk < 5) return "Moderate";
        if (risk < 7) return "Difficult";
        return "Extreme";
    }
    
    function simulateWeatherRisk(weather, activityType) {
        // This simulates what the Python weather risk calculation would do
        const activityWeatherSensitivity = {
            'hiking': 0.7,
            'rock_climbing': 0.9,
            'mountain_biking': 0.6,
            'backcountry_skiing': 0.95,
            'kayaking': 0.8,
            'trail_running': 0.75
        };
        
        // If using real-time weather, we'd make an API call here
        // For simulation, we'll use the provided values or generate random ones
        const tempRisk = Math.abs(weather.temperature - 20) / 5;
        const precipRisk = weather.precipitation * 0.5;
        const windRisk = weather.windSpeed * 0.1;
        const thunderRisk = weather.thunderstormRisk * 10;
        
        return Math.min(9.5, (tempRisk + precipRisk + windRisk + thunderRisk) * 
                        activityWeatherSensitivity[activityType]);
    }
    
    function weatherRiskDescription(risk) {
        if (risk < 2) return "Favorable";
        if (risk < 4) return "Fair";
        if (risk < 6) return "Concerning";
        return "Dangerous";
    }
    
    function generateWeatherForecast(location) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rain', 'Thunderstorm', 'Snow'];
        const icons = ['sun', 'cloud-sun', 'cloud', 'cloud-rain', 'bolt', 'snowflake'];
        
        const forecast = [];
        const today = new Date();
        
        for (let i = 0; i < 5; i++) {
            const dayDate = new Date();
            dayDate.setDate(today.getDate() + i);
            
            // Base temperature on location elevation (higher elevation = colder)
            let baseTemp = 75; // Default base in Fahrenheit
            if (location.name === 'Pikes Peak') {
                baseTemp = 55; // Colder at higher elevation
            } else if (location.name === 'Cheyenne Mountain') {
                baseTemp = 65;
            }
            
            // Add some random variation
            const tempHigh = Math.round(baseTemp - (i * 2) + (Math.random() * 10 - 5));
            const tempLow = Math.round(tempHigh - 15 - (Math.random() * 5));
            
            // Randomly select condition but weight by season
            const conditionIndex = Math.floor(Math.random() * conditions.length);
            
            // Random precipitation chance based on condition
            let precipChance = 0;
            if (conditions[conditionIndex] === 'Partly Cloudy') {
                precipChance = Math.floor(Math.random() * 20);
            } else if (conditions[conditionIndex] === 'Cloudy') {
                precipChance = 20 + Math.floor(Math.random() * 30);
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
                icon: icons[conditionIndex],
                precipChance: precipChance
            });
        }
        
        return forecast;
    }
    
    function generateRecommendations(data, riskCategory, terrainRisk, weatherRisk, humanRisk, equipmentRisk, weightRisk) {
        const recommendations = [];
        
        // Basic recommendations based on activity
        switch(data.activityType) {
            case 'hiking':
                recommendations.push("Carry adequate water and navigation tools.");
                break;
            case 'rock_climbing':
                recommendations.push("Double-check all safety equipment before climbing.");
                recommendations.push("Ensure proper anchoring and belay techniques.");
                break;
            case 'mountain_biking':
                recommendations.push("Wear appropriate protective gear including helmet.");
                recommendations.push("Check bike mechanics before riding.");
                break;
            case 'backcountry_skiing':
                recommendations.push("Check avalanche conditions before departure.");
                recommendations.push("Carry avalanche safety equipment.");
                break;
            case 'kayaking':
                recommendations.push("Always wear a personal flotation device.");
                recommendations.push("Check water conditions and forecasts.");
                break;
            case 'trail_running':
                recommendations.push("Carry adequate water and snacks.");
                recommendations.push("Be aware of potential hazards such as wildlife and inclement weather.");
                break;
        }
        
        // Risk-specific recommendations
        if (terrainRisk > 6) {
            recommendations.push("This terrain is particularly challenging. Consider an alternative route if inexperienced.");
        }
        
        if (weatherRisk > 5) {
            recommendations.push("Weather conditions may deteriorate. Prepare for changing conditions and consider postponing if severe.");
        }
        
        if (humanRisk > 6) {
            if (data.experience === 'beginner' || data.experience === 'intermediate') {
                recommendations.push("Consider going with a more experienced guide or taking a training course first.");
            }
        }
        
        if (equipmentRisk > 5) {
            recommendations.push("Upgrade your equipment or perform thorough maintenance before undertaking this activity.");
        }
        
        if (weightRisk > 5) {
            recommendations.push("Consider reducing the weight you are carrying to minimize risk.");
        }
        
        if (data.groupSize === 1) {
            recommendations.push("Solo activities increase risk. Share your itinerary with someone and consider a satellite communication device.");
        }
        
        if (riskCategory === 'high' || riskCategory === 'extreme') {
            recommendations.push("This activity presents significant risks. Carefully reconsider or ensure advanced preparation and experience.");
        }
        
        // Location-specific recommendations
        switch(data.location.name) {
            case 'Garden of the Gods':
                recommendations.push("Be aware of rockfall hazards and stay on designated trails.");
                break;
            case 'Pikes Peak':
                recommendations.push("Altitude sickness is common. Acclimate properly and stay hydrated.");
                recommendations.push("Weather can change rapidly at high elevations.");
                break;
            case 'Cheyenne Mountain':
                recommendations.push("Wildlife encounters are possible. Maintain safe distances and proper food storage.");
                break;
            case 'Palmer Park':
                recommendations.push("Trail intersections can be confusing. Bring a park map.");
                break;
            case 'Manitou Incline':
                recommendations.push("Be prepared for steep incline and potential altitude sickness.");
                recommendations.push("Bring plenty of water and consider acclimating to the elevation before attempting.");
                break;
        }
        
        return recommendations;
    }
    
    function simulateGISContext(location, activityType) {
        // Mock GIS data for known locations
        const mockGISData = {
            'Garden of the Gods': {
                elevation: 1950,
                landCover: {
                    dominantType: 'rock',
                    coverage: {
                        'rock': 0.5,
                        'forest': 0.3,
                        'grassland': 0.2
                    }
                },
                protectedArea: {
                    isProtected: true,
                    name: "Garden of the Gods Park",
                    type: "city_park"
                },
                nearbyTrails: "15 trails within 0.6 miles"
            },
            'Pikes Peak': {
                elevation: 4302,
                landCover: {
                    dominantType: 'alpine',
                    coverage: {
                        'rock': 0.4,
                        'snow': 0.3,
                        'alpine': 0.3
                    }
                },
                protectedArea: {
                    isProtected: true,
                    name: "Pike National Forest",
                    type: "national_forest"
                },
                nearbyTrails: "8 trails within 0.5 miles"
            },
            'Cheyenne Mountain': {
                elevation: 2800,
                landCover: {
                    dominantType: 'forest',
                    coverage: {
                        'forest': 0.7,
                        'rock': 0.2,
                        'grassland': 0.1
                    }
                },
                protectedArea: {
                    isProtected: true,
                    name: "Cheyenne Mountain State Park",
                    type: "state_park"
                },
                nearbyTrails: "12 trails within 0.8 miles"
            },
            'Palmer Park': {
                elevation: 1850,
                landCover: {
                    dominantType: 'mixed',
                    coverage: {
                        'forest': 0.4,
                        'grassland': 0.4,
                        'shrubland': 0.2
                    }
                },
                protectedArea: {
                    isProtected: true,
                    name: "Palmer Park",
                    type: "city_park"
                },
                nearbyTrails: "20 trails within 0.6 miles"
            },
            'Manitou Incline': {
                elevation: 2400,
                landCover: {
                    dominantType: 'forest',
                    coverage: {
                        'forest': 0.6,
                        'rock': 0.3,
                        'grassland': 0.1
                    }
                },
                protectedArea: {
                    isProtected: true,
                    name: "Manitou Incline Park",
                    type: "city_park"
                },
                nearbyTrails: "10 trails within 0.6 miles"
            }
        };
        
        return mockGISData[location.name] || {
            elevation: 1800,
            landCover: {
                dominantType: 'unknown',
                coverage: {
                    'unknown': 1.0
                }
            },
            protectedArea: {
                isProtected: false,
                name: "",
                type: ""
            },
            nearbyTrails: "Unknown"
        };
    }
    
    function displayResults(report) {
        // Set risk indicator position
        const riskIndicator = document.getElementById('risk-indicator');
        const percentage = (report.overallRisk / 10) * 100;
        riskIndicator.style.left = percentage + '%';
        
        // Update risk level badge
        const riskLevelBadge = document.querySelector('.risk-level-text');
        riskLevelBadge.textContent = report.riskCategory.toUpperCase();
        riskLevelBadge.className = 'risk-level-text ' + report.riskCategory;
        
        // Display risk factors
        const riskFactorsList = document.getElementById('risk-factors');
        riskFactorsList.innerHTML = '';
        
        const factors = [
            { name: 'Terrain', value: report.riskFactors.terrain.toFixed(1) },
            { name: 'Weather', value: report.riskFactors.weather.toFixed(1) },
            { name: 'Human Factors', value: report.riskFactors.human.toFixed(1) },
            { name: 'Equipment', value: report.riskFactors.equipment.toFixed(1) },
            { name: 'Weight', value: report.riskFactors.weight.toFixed(1) },
            { name: 'Overall Risk', value: report.overallRisk.toFixed(1) + ' (' + report.riskCategory.toUpperCase() + ')' }
        ];
        
        factors.forEach(factor => {
            const li = document.createElement('li');
            li.textContent = factor.name + ': ' + factor.value;
            riskFactorsList.appendChild(li);
        });
        
        // Display weather forecast
        const forecastContainer = document.getElementById('forecast-container');
        forecastContainer.innerHTML = '';
        
        report.forecast.forEach(day => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            
            forecastItem.innerHTML = `
                <div class="day">${day.day}</div>
                <div class="date">${day.date}</div>
                <div class="weather-icon"><i class="fas fa-${day.icon}"></i></div>
                <div class="temp">${day.tempHigh}°F / ${day.tempLow}°F</div>
                <div class="condition">${day.condition}</div>
                <div class="precip">${day.precipChance}% precip</div>
            `;
            
            forecastContainer.appendChild(forecastItem);
        });
        
        // Display recommendations
        const recommendationsList = document.getElementById('recommendations');
        recommendationsList.innerHTML = '';
        
        report.recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            recommendationsList.appendChild(li);
        });
        
        // Display GIS context
        const gisContextList = document.getElementById('gis-context');
        gisContextList.innerHTML = '';
        
        const gisItems = [
            { name: 'Location', value: report.locationName },
            { name: 'Elevation', value: metersToFeet(report.gisContext.elevation).toFixed(0) + ' ft' },
            { name: 'Dominant Land Cover', value: report.gisContext.landCover.dominantType.replace(/\b\w/g, l => l.toUpperCase()) }
        ];
        
        if (report.gisContext.protectedArea.isProtected) {
            gisItems.push({ 
                name: 'Protected Area', 
                value: report.gisContext.protectedArea.name
            });
        } else {
            gisItems.push({ name: 'Protected Area', value: 'None' });
        }
        
        gisItems.push({ name: 'Nearby Trails', value: report.gisContext.nearbyTrails });
        
        // Add user attributes to GIS context
        gisItems.push({ name: 'User Age', value: report.userAttributes.age });
        gisItems.push({ name: 'User Height', value: cmToInches(report.userAttributes.heightCm).toFixed(1) + ' inches' });
        gisItems.push({ name: 'User Weight', value: kgToLbs(report.userAttributes.weightKg).toFixed(1) + ' lbs' });
        gisItems.push({ name: 'User BMI', value: report.userAttributes.bmi.toFixed(1) });
        gisItems.push({ name: 'Additional Weight Carried', value: report.weightCarried + ' lbs' });
        
        gisItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.name + ': ' + item.value;
            gisContextList.appendChild(li);
        });
    }
});
