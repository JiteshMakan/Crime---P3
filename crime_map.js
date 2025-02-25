let originalData = [];  // This will store the original dataset
let map, heatLayer;  // Store map and heatLayer to remove old heatmap and update it later

// Load the CSV data
d3.csv('cleaned_data.csv').then(data => {
    originalData = data;
    console.log("Data loaded:", originalData);  // Log the data to check

    // Populate filters and render initial graphs after data is loaded
    populateFilters(originalData);
    renderBarGraph(originalData);  // Render the initial bar graph
    renderHeatMap(originalData);  // Render the initial heatmap
    renderCrimeSummary(originalData); // Populate summary table immediately

}).catch(error => {
    console.error('Error loading the CSV file:', error);
});

// Function to extract the year from the 'date occ' column
function extractYear(dateString) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date.getFullYear();  // Return the year part of the date
    } else {
        return null;  // If the date is invalid, return null
    }
}

// Function to populate filters (year, crime category, weapon category)
function populateFilters(data) {
    console.log("Populating filters with data:", data);

    // Extract years between 2020 and 2025 from the 'date occ' column
    const years = [...new Set(data.map(item => extractYear(item['date occ'])))];
    const validYears = years.filter(year => year >= 2020 && year <= 2025);
    console.log("Valid Years: ", validYears);  // Log to check extracted valid years

    // Extract unique crime categories and weapon categories
    const crimeTypes = [...new Set(data.map(item => item.crime_category))];
    const weaponTypes = [...new Set(data.map(item => item.weapon_category))];
    console.log("Crime Categories: ", crimeTypes);  // Log to check crime categories
    console.log("Weapon Categories: ", weaponTypes);  // Log to check weapon categories

    // Populate Year Filter Dropdown
    const yearSelect = document.getElementById('year-filter');
    yearSelect.innerHTML = '<option value="">Select Year</option>';  // Clear any existing options
    validYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    // Populate Crime Category Filter Dropdown
    const crimeSelect = document.getElementById('crime-category-filter');
    crimeSelect.innerHTML = '<option value="">Select Crime Category</option>';
    crimeTypes.forEach(crime => {
        const option = document.createElement('option');
        option.value = crime;
        option.textContent = crime;
        crimeSelect.appendChild(option);
    });

    // Populate Weapon Category Filter Dropdown
    const weaponSelect = document.getElementById('weapon-filter');
    weaponSelect.innerHTML = '<option value="">Select Weapon Type</option>';
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

// Function to filter data based on selected filters
function filterData() {
    let filteredData = originalData;

    const selectedYear = document.getElementById('year-filter').value;
    const selectedCrime = document.getElementById('crime-category-filter').value;
    const selectedWeapon = document.getElementById('weapon-filter').value;

    // Filter based on selected year
    if (selectedYear) {
        filteredData = filteredData.filter(item => extractYear(item['date occ']) === parseInt(selectedYear));
    }

    // Filter based on selected crime category
    if (selectedCrime) {
        filteredData = filteredData.filter(item => item.crime_category === selectedCrime);
    }

    // Filter based on selected weapon category
    if (selectedWeapon) {
        filteredData = filteredData.filter(item => item.weapon_category === selectedWeapon);
    }

    // Re-render the graphs and heatmap with the filtered data
    renderBarGraph(filteredData);
    renderHeatMap(filteredData);
    renderCrimeSummary(filteredData);
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
        return 'UNKNOWN'; // For cases where status is not recognized (if any)
    }
}
// Function to render Bar Graph using Chart.js
let barChart = null;  // Store the chart instance

// Function to render Bar Graph using Chart.js
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

    const categories = [...new Set(data.map(item => item.crime_category))]; // All unique crime categories
    const solvedCounts = categories.map(cat => crimeCategoryCounts['SOLVED'][cat] || 0);
    const unsolvedCounts = categories.map(cat => crimeCategoryCounts['UNSOLVED'][cat] || 0);

    const ctx = document.getElementById('bar-graph').getContext('2d');  // Get the canvas context

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
        map = L.map('heatmap').setView([34.0522, -118.2437], 10);  // Los Angeles coordinates

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
        const status = getCrimeStatus(crime['status desc']);  // Check if the crime is solved or unsolved

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

        // Create the circle with black border
        L.circleMarker([lat, lon], {
            radius: radius,
            color: 'black',        // Black border color
            weight: 2,             // Thickness of the border
            fillColor: color,      // Color based on solved/unsolved status
            fillOpacity: 0.6       // Fill opacity
        }).addTo(map);
    });
}

// Function to render the Crime Data Summary
function renderCrimeSummary(data) {
    const summaryElement = document.getElementById('crime-summary');
    summaryElement.innerHTML = '';  // Clear any existing summary

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
        map = L.map('heatmap').setView([34.0522, -118.2437], 9.2);  // Los Angeles coordinates
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }
}

initializeMap();  // Call to initialize the map