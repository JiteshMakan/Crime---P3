
// Load data using D3.js
d3.csv('cleaned_data.csv').then(data => {
    console.log(data);  // Log data to check it is loaded correctly
    populateYearFilter(data);  // Populate the year dropdown
    renderCrimeTable(data);     // Render crime table
    renderBarGraph(data);       // Render bar graph
    renderHeatMap(data);        // Render heatmap
}).catch(error => {
    console.error('Error loading the CSV file:', error);
});

// Populate year dropdown
function populateYearFilter(data) {
    const years = [...new Set(data.map(item => item.year))];  // Get unique years
    const yearSelect = document.getElementById('year-filter');
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

// Filter data based on selected year
function filterData() {
    const selectedYear = document.getElementById('year-filter').value;
    const filteredData = data.filter(d => d.year === selectedYear);
    renderCrimeTable(filteredData);  // Update crime table
    renderBarGraph(filteredData);    // Update bar graph
    renderHeatMap(filteredData);     // Update heatmap
}

// Render the Crime Table
function renderCrimeTable(data) {
    const tableBody = document.querySelector("#crime-summary");
    tableBody.innerHTML = ''; // Clear any existing rows
    // Example data to show in summary
    tableBody.innerHTML = `
        <p>Total Crimes: ${data.length}</p>
        <p>Crime Categories: ${new Set(data.map(d => d.crime_category)).size}</p>
    `;
}

// Render Bar Graph using Chart.js
function renderBarGraph(data) {
    const crimeCategoryCounts = {};

    data.forEach(crime => {
        const category = crime.crime_category;
        crimeCategoryCounts[category] = (crimeCategoryCounts[category] || 0) + 1;
    });

    const categories = Object.keys(crimeCategoryCounts);
    const counts = categories.map(cat => crimeCategoryCounts[cat]);

    const ctx = document.getElementById('bar-graph').getContext('2d');
    new Chart(ctx, {
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

// Render Heatmap using Leaflet
function renderHeatMap(data) {
    const map = L.map('heatmap').setView([34.0522, -118.2437], 12);  // Los Angeles coordinates
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Prepare heatmap data
    const heatData = data.map(crime => [+crime.lat, +crime.lon, crime.status === 'SOLVED' ? 1 : 0]);
    L.heatLayer(heatData, { radius: 25 }).addTo(map);
}