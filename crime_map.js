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

// Function to render Bar Graph using Chart.js
let barChart = null;  // Store the chart instance

// Function to render Bar Graph using Chart.js
function renderBarGraph(data) {
    const crimeCategoryCounts = {};

    // Count crimes per category
    data.forEach(crime => {
        const category = crime.crime_category;
        crimeCategoryCounts[category] = (crimeCategoryCounts[category] || 0) + 1;
    });

    const categories = Object.keys(crimeCategoryCounts);
    const counts = categories.map(cat => crimeCategoryCounts[cat]);

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
            datasets: [{
                label: 'Crime Category Counts',
                data: counts,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        }
    });
}

// Function to render Heatmap using Leaflet
function renderHeatMap(data) {
    if (!map) {
        // Initialize the map if it's not already initialized
        map = L.map('heatmap').setView([34.0522, -118.2437], 12);  // Los Angeles coordinates

        // Set up the OpenStreetMap layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } else {
        // Clear previous heat layer if it exists
        if (heatLayer) {
            heatLayer.clearLayers();
        }
    }

    // Create the heatmap data based on crime locations (latitude and longitude)
    const heatData = data.map(crime => [+crime.lat, +crime.lon, crime.status === 'SOLVED' ? 1 : 0]);
    
    // Create or update the heat layer
    heatLayer = L.heatLayer(heatData, { radius: 25 }).addTo(map);
}

// Function to render the Crime Data Summary
function renderCrimeSummary(data) {
    const summaryElement = document.getElementById('crime-summary');
    summaryElement.innerHTML = '';  // Clear any existing summary

    const totalCrimes = data.length;
    const totalSolved = data.filter(item => item.status === 'SOLVED').length;
    const totalUnsolved = totalCrimes - totalSolved;

    const summaryHTML = `
        <p>Total Crimes: ${totalCrimes}</p>
        <p>Solved Crimes: ${totalSolved}</p>
        <p>Unsolved Crimes: ${totalUnsolved}</p>
    `;

    summaryElement.innerHTML = summaryHTML;
}

// Initialize the map once (if not initialized already)
function initializeMap() {
    if (!map) {
        map = L.map('heatmap').setView([34.0522, -118.2437], 12);  // Los Angeles coordinates
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }
}

initializeMap();  // Call to initialize the map