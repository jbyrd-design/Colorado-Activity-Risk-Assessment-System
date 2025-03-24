# Outdoor Activity Risk Assessment System

## Overview
The Outdoor Activity Risk Assessment System (ARAS) is a comprehensive tool designed to evaluate and quantify potential risks associated with various outdoor activities in Colorado. Leveraging geographical, meteorological, and user-specific data, the system provides personalized risk assessments and recommendations to enhance safety during outdoor adventures.

## Features

### Activity Types
- **Hiking**: Basic trail exploration with moderate elevation changes
- **Rock Climbing**: Technical vertical ascents on natural rock formations
- **Mountain Biking**: Off-road cycling on trails of varying difficulty
- **Backcountry Skiing**: Cross-country skiing in unmarked terrain
- **Kayaking**: River navigation in small watercraft
- **Trail Running**: Faster-paced trail activity with running-specific risks

### Risk Assessment Factors
The system evaluates risk based on multiple factors:

#### 1. User Attributes
- **Age**: Affects physical capability and recovery time
- **Gender**: Slight physiological differences in risk factors
- **Physical Measurements**: Height, weight, and BMI calculations
- **Equipment Weight**: Additional weight carried during the activity

#### 2. Location Details
- **Specific Locations**: Includes Garden of the Gods, Pikes Peak, Cheyenne Mountain, Palmer Park, and Manitou Incline
- **Search Radius**: Area around the location to assess for potential hazards
- **Terrain Analysis**: Elevation, slope, and surface characteristics

#### 3. Activity Parameters
- **Experience Level**: From beginner to expert
- **Group Size**: Solo activities vs. group expeditions
- **Equipment Quality**: Impact of gear condition on safety

#### 4. Weather Conditions
- **Temperature**: Effects of heat and cold on performance
- **Precipitation**: Rain, snow, and associated hazards
- **Wind Speed**: Impact on stability and comfort
- **Thunderstorm Risk**: Lightning danger assessment

### Output
- **Overall Risk Score**: Numerical rating from 0-10
- **Risk Category**: Low, Moderate, High, or Extreme risk classification
- **Detailed Risk Breakdown**: Individual scores for terrain, weather, human factors, and equipment
- **Personalized Recommendations**: Activity-specific safety suggestions
- **GIS Context**: Geographic information about the selected location
- **Weather Forecast**: Five-day outlook (simulated in the demo)

## Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python with NumPy for calculations
- **GIS Components**: Simulated GIS data analysis (would integrate with proper GIS tools in production)
- **Weather Data**: Simulated weather forecasting (would integrate with weather APIs in production)

## Installation and Setup

### Prerequisites
- Python 3.8+
- Web browser with JavaScript enabled
- Recommended: Git for version control

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/yourusername/outdoor-risk-assessment.git
cd outdoor-risk-assessment
```

2. Install required Python packages:
```bash
pip install -r requirements.txt
```

3. Start a local web server:
```bash
python -m http.server 8000
```

4. Navigate to the application:
```
http://localhost:8000/Website/
```

## Usage Instructions

1. Fill out the assessment form with your personal details, activity preferences, and location.
2. For real-time weather data, check the "Use Real-time Weather Data" option (simulated in demo).
3. Click "Calculate Risk" to generate your personalized risk assessment.
4. Review the detailed breakdown and recommendations provided.
5. Use the "Back" button to make adjustments and reassess as needed.

## Project Structure
```
outdoor-risk-assessment/
├── outdoor_risk_assessment.py  # Main Python module with risk calculation logic
├── requirements.txt            # Python dependencies
├── README.md                   # This documentation
└── Website/                    # Web interface
    ├── index.html              # Main HTML structure
    ├── styles.css              # CSS styling
    └── script.js               # Frontend JavaScript functionality
```

## Future Enhancements
- Integration with real weather APIs
- Actual GIS data processing
- Mobile application development
- User accounts for tracking activity history
- Machine learning models to refine risk predictions
- Social features for sharing safety information

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- University of Colorado, Colorado Springs - GES 4700 GIS and Machine Learning
- Colorado Springs Parks and Recreation for location data
- All contributors and testers who helped refine the risk models
