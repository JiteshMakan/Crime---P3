// Store data variables
let originalData = [];  
let map, heatLayer;  

// Load the CSV data - to be replaced when data is hosted on a server
d3.csv('https://crimedata2025.s3.us-east-2.amazonaws.com/cleaned_data.csv').then(data => {
    originalData = data;
    console.log("Data loaded:", originalData);

    // Populate filters and render initial graphs after data is loaded
    populateFilters(originalData);
    renderBarGraph(originalData);  
    renderHeatMap(originalData);  
    renderCrimeSummary(originalData);
    renderLineGraphWithCategoryAndWeapon(originalData); 

}).catch(error => {
    console.error('Error loading the CSV file:', error);
});

// Function to extract the year from the 'date occ' column
function extractYear(dateString) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date.getFullYear(); 
    } else {
        return null;  
    }
}

// Function to populate filters (year, crime category, weapon category)
function populateFilters(data) {
    console.log("Populating filters with data:", data);

    // Extract years between 2020 and 2025 from the 'date occ' column
    const years = [...new Set(data.map(item => extractYear(item['date occ'])))];
    const validYears = years.filter(year => year >= 2020 && year <= 2025);
    console.log("Valid Years: ", validYears);  

    // Extract unique crime categories and weapon categories
    const crimeTypes = [...new Set(data.map(item => item.crime_category))];
    const weaponTypes = [...new Set(data.map(item => item.weapon_category || "NO WEAPON INVOLVED"))];
    console.log("Crime Categories: ", crimeTypes);  
    console.log("Weapon Categories: ", weaponTypes);  

    // Populate Year Filter Dropdown
    const yearSelect = document.getElementById('year-filter');
    yearSelect.innerHTML = '<option value="">Select All</option>';  
    validYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    // Populate Crime Category Filter Dropdown
    const crimeSelect = document.getElementById('crime-category-filter');
    crimeSelect.innerHTML = '<option value="">Select All</option>';
    crimeTypes.forEach(crime => {
        const option = document.createElement('option');
        option.value = crime;
        option.textContent = crime;
        crimeSelect.appendChild(option);
    });

    // Populate Weapon Category Filter Dropdown with updated default text
    const weaponSelect = document.getElementById('weapon-filter');
    weaponSelect.innerHTML = '<option value="">Select All</option>'; 
    weaponTypes.forEach(weapon => {
        const option = document.createElement('option');
        option.value = weapon;
        option.textContent = weapon;
        weaponSelect.appendChild(option);
    });

    // Add event listeners to update the map and graphs on filter change
    yearSelect.addEventListener('change', filterData);
    crimeSelect.addEventListener('change', filterData);
    weaponSelect.addEventListener('change', filterData);
}

// Function to filter data based on selected filters (but including year and solved/unsolved for all visuals)
function filterData() {
    let filteredData = originalData;

    const selectedYear = document.getElementById('year-filter').value;
    const selectedCrime = document.getElementById('crime-category-filter').value;
    const selectedWeapon = document.getElementById('weapon-filter').value;
    const selectedSolvedStatus = document.getElementById('solved-unsolved-filter').value;

    // Apply Year and Solved Status filters for all visuals (map, bar graph, crime summary)
    if (selectedYear) {
        filteredData = filteredData.filter(item => extractYear(item['date occ']) === parseInt(selectedYear));
    }

    if (selectedCrime) {
        filteredData = filteredData.filter(item => item.crime_category === selectedCrime);
    }

    if (selectedWeapon) {
        filteredData = filteredData.filter(item => item.weapon_category === selectedWeapon);
    }

    if (selectedSolvedStatus) {
        filteredData = filteredData.filter(item => getCrimeStatus(item['status desc']) === selectedSolvedStatus);
    }

    // Re-render the bar graph, heatmap, and crime summary with the filtered data
    renderBarGraph(filteredData);
    renderHeatMap(filteredData);
    renderCrimeSummary(filteredData);

    // Re-render the line graph, but without applying Year and Solved Status filters
    renderLineGraphWithCategoryAndWeapon(filteredData);
}

// Function to determine if a crime is solved or unsolved
function getCrimeStatus(status) {
    const solvedStatuses = ['Adult Arrest', 'Adult Other', 'Juv Arrest', 'Juv Other'];
    const unsolvedStatuses = ['Invest Cont', 'UNK'];

    if (solvedStatuses.includes(status)) {
        return 'SOLVED';
    } else if (unsolvedStatuses.includes(status)) {
        return 'UNSOLVED';
    } else {
        return 'UNKNOWN'; 
    }
}

// Function to render Bar Graph using Chart.js
let barChart = null;  

function renderBarGraph(data) {
    const crimeCategoryCounts = {
        SOLVED: {},
        UNSOLVED: {}
    };

    // Count solved and unsolved crimes per category
    data.forEach(crime => {
        const category = crime.crime_category;
        const status = getCrimeStatus(crime['status desc']);

        if (!crimeCategoryCounts[status][category]) {
            crimeCategoryCounts[status][category] = 0;
        }
        crimeCategoryCounts[status][category] += 1;
    });

    const categories = [...new Set(data.map(item => item.crime_category))]; 
    const solvedCounts = categories.map(cat => crimeCategoryCounts['SOLVED'][cat] || 0);
    const unsolvedCounts = categories.map(cat => crimeCategoryCounts['UNSOLVED'][cat] || 0);

    const ctx = document.getElementById('bar-graph').getContext('2d');  

    // If there's an existing chart, destroy it before creating a new one
    if (barChart) {
        barChart.destroy();
    }

    // Create a new chart instance
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Solved Crimes',
                    data: solvedCounts,
                    backgroundColor: 'green',
                    borderColor: 'green',
                    borderWidth: 1
                },
                {
                    label: 'Unsolved Crimes',
                    data: unsolvedCounts,
                    backgroundColor: 'red',
                    borderColor: 'red',
                    borderWidth: 1
                }
            ]
        }
    });
}

// Function to render Heatmap using Leaflet
function renderHeatMap(data) {
    if (!map) {
        // Initialize the map if it's not already initialized
        map = L.map('heatmap').setView([34.0522, -118.2437], 10);  

        // Set up the OpenStreetMap layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } else {
        // Clear previous markers if they exist
        map.eachLayer(layer => {
            if (layer instanceof L.CircleMarker) {
                map.removeLayer(layer);
            }
        });
    }

    // Group crimes by their location (latitude, longitude)
    const crimeLocations = {};

    data.forEach(crime => {
        const lat = parseFloat(crime.lat);
        const lon = parseFloat(crime.lon);
        const locationKey = `${lat},${lon}`;
        const status = getCrimeStatus(crime['status desc']);  

        if (!crimeLocations[locationKey]) {
            crimeLocations[locationKey] = { solved: 0, unsolved: 0 };
        }
        if (status === 'SOLVED') {
            crimeLocations[locationKey].solved += 1;
        } else if (status === 'UNSOLVED') {
            crimeLocations[locationKey].unsolved += 1;
        }
    });

    // Create circles for each unique crime location
    Object.keys(crimeLocations).forEach(locationKey => {
        const [lat, lon] = locationKey.split(',').map(Number);
        const solvedCount = crimeLocations[locationKey].solved;
        const unsolvedCount = crimeLocations[locationKey].unsolved;

        // Create the circle with color based on status
        const radius = Math.min(Math.sqrt(solvedCount + unsolvedCount) * 4, 15);
        const color = solvedCount > unsolvedCount ? 'green' : 'red';

        // Create the circle
        L.circleMarker([lat, lon], {
            radius: radius,
            color: 'black',        
            weight: 2,              
            fillColor: color,      
            fillOpacity: 0.6       
        }).addTo(map);
    });
}

let lineChart = null;

// Function to render Line Graph
function renderLineGraphWithCategoryAndWeapon(data) {
    // First, filter data based on only Crime Category and Weapon
    const selectedCrime = document.getElementById('crime-category-filter').value;
    const selectedWeapon = document.getElementById('weapon-filter').value;

    // Filter data by Crime Category and Weapon Category
    let filteredDataForLineGraph = data;
    if (selectedCrime) {
        filteredDataForLineGraph = filteredDataForLineGraph.filter(item => item.crime_category === selectedCrime);
    }

    if (selectedWeapon) {
        filteredDataForLineGraph = filteredDataForLineGraph.filter(item => item.weapon_category === selectedWeapon);
    }

    // Calculate the crime counts by year for the filtered data
    const yearCrimeCounts = {
        SOLVED: { 2020: 0, 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0 },
        UNSOLVED: { 2020: 0, 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0 }
    };

    filteredDataForLineGraph.forEach(crime => {
        const year = extractYear(crime['date occ']);
        const status = getCrimeStatus(crime['status desc']);
        
        if (year >= 2020 && year <= 2025) {
            if (status === 'SOLVED') {
                yearCrimeCounts['SOLVED'][year] += 1;
            } else if (status === 'UNSOLVED') {
                yearCrimeCounts['UNSOLVED'][year] += 1;
            }
        }
    });

    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    const solvedCounts = years.map(year => yearCrimeCounts['SOLVED'][year]);
    const unsolvedCounts = years.map(year => yearCrimeCounts['UNSOLVED'][year]);

    const ctx = document.getElementById('line-graph').getContext('2d');

    // If there's an existing chart, destroy it before creating a new one
    if (lineChart) {
        lineChart.destroy();
    }

    // Create a new chart instance
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years, 
            datasets: [
                {
                    label: 'Solved Crimes',
                    data: solvedCounts,
                    borderColor: 'green',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Unsolved Crimes',
                    data: unsolvedCounts,
                    borderColor: 'red',
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    },
                    min: 2020, 
                    max: 2025 
                },
                y: {
                    title: {
                        display: true,
                        text: 'Crime Count'
                    }
                }
            }
        }
    });
}

// Function to render the Crime Data Summary
function renderCrimeSummary(data) {
    const summaryElement = document.getElementById('crime-summary');
    summaryElement.innerHTML = '';  

    const totalCrimes = data.length;
    const totalSolved = data.filter(item => getCrimeStatus(item['status desc']) === 'SOLVED').length;
    const totalUnsolved = totalCrimes - totalSolved;

    // Calculate the solved rate (percentage of solved crimes)
    const solvedRate = totalCrimes > 0 ? (totalSolved / totalCrimes) * 100 : 0;

    const summaryHTML = `
        <p>Total Crimes: ${totalCrimes}</p>
        <p>Solved Crimes: ${totalSolved}</p>
        <p>Unsolved Crimes: ${totalUnsolved}</p>
        <p>Solved Rate: ${solvedRate.toFixed(2)}%</p>
    `;

    summaryElement.innerHTML = summaryHTML;
}

// Initialize the map once (if not initialized already)
function initializeMap() {
    if (!map) {
        map = L.map('heatmap').setView([34.0522, -118.2437], 9.2);  
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }
}

initializeMap(); 