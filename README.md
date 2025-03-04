# Crime Data Analysis and Visualization for Los Angeles (2020 - Present)

### Team Members

Jitesh Makan

Svetlana Kachina

Bryan Carney

### Dashboard Link

[Click here](https://jiteshmakan.github.io/Crime---P3/)

# Project Overview:

The goal of this project is to analyze and visualize crime data in Los Angeles from 2020 to the present. By leveraging a data-driven approach, we aim to identify crime trends, rates, and patterns over time and across different locations in the city. The project will provide a comprehensive set of interactive visualizations, allowing users to explore various crime statistics in detail.

### Key features include:

• Crime rate analysis by type and location.

• Crime trend analysis over time to observe fluctuations and changes.

• Crime density heat maps showing crime hotspots within the city.

• Interactive filters allowing users to adjust visualizations by crime type, time period, and location

![image](https://github.com/user-attachments/assets/d88ea653-c192-48df-9643-a17e8e821a3c)

### Data Source:

The project will utilize publicly available crime data from the U.S. Government’s open data portal, specifically the dataset Crime Data from 2020 to Present. This dataset includes detailed records on various types of crime, their status (solved vs unsolved), and timestamps.

### Dataset URL:

[Crime Data from 2020 to Present](https://catalog.data.gov/dataset/crime-data-from-2020-to-present)

### Technical Stack:

To ensure a robust, scalable, and interactive platform, we will employ the following technologies:

**Backend:**

• PostgreSQL: Crime data will be stored in a PostgreSQL database to facilitate fast queries, filtering, and analysis.

• Python: Used for data processing, analysis, and visualization generation.

• Flask: A lightweight web framework to serve the application and connect the frontend and backend seamlessly.

**Frontend:**

• JavaScript: For building interactive features like dropdowns, maps, and filtering elements.

• Plotly/Chart.js: These libraries will be used for creating dynamic visualizations like heat maps, bar charts, and line graphs.

### Features & Interactive Elements:

Dropdowns and Filters: Users will be able to filter crime data based on crime type, location (city/neighborhood), and time period (year/month). This will allow for targeted analysis and visualization of specific crime types or regions.

### Three Key Views:

**Crime Rate by Type:**

A bar chart that displays the crime rate distribution for different crime types across Los Angeles. Users can filter this by specific crime types to narrow down their view.

![image](https://github.com/user-attachments/assets/4c23673f-d967-47a5-9b48-74194771ece3)

**Crime Trends Over Time:**

A time-series chart (line graph) that visualizes how crime rates have evolved over time. This will give insights into patterns or shifts in crime behavior (e.g., increase or decrease in crime after specific events, seasonal changes).

![image](https://github.com/user-attachments/assets/74a4c215-af58-4eb5-aff9-a95408af3e8e)

**Crime Density Heat Map:**

An interactive map that shows crime hotspots within the city or region. Users can zoom in on specific areas of Los Angeles and view crime concentrations for various crime types, with the ability to filter by year and crime category.

![image](https://github.com/user-attachments/assets/7454dd7b-0b31-4b95-be27-5f6fc3ed9f53)

### Technical Workflow:

• Data Storage: The crime data will be cleaned and imported into a PostgreSQL database, ensuring efficient querying and analysis.

**Backend (AWS + Python):**

• AWS S3 & D3 will handle HTTP requests and serve data to the frontend.

• Python (with libraries like Pandas and NumPy) will be used for data processing, including calculating crime trends, aggregating data, and preparing it for visualization.

**Frontend (JavaScript + Plotly/Matplotlib):**

• JavaScript will provide dynamic user interactivity (dropdowns, maps, time range selectors).

• Plotly/Chart.js will be used to generate the interactive charts and heat maps, ensuring smooth rendering of visualizations.

• Interactive UI: The frontend will offer an intuitive interface where users can:

**Select specific filters for crime trends.**

• Filter data by year.

• Filter data by crime type (e.g., assault, theft, burglary).

• Filter data by weapons type 

• Filter data by Solved vs Unsolved

![image](https://github.com/user-attachments/assets/bc04c33e-5b9d-445a-9fd4-631bceffae0e)

# Conclusion:

This Crime Data Analysis and Visualization project for Los Angeles will provide a powerful tool for understanding crime trends, patterns, and geographic concentrations in the city. The interactive platform will allow users to explore the data in depth and make informed decisions based on the visualized trends. By leveraging modern technologies like Flask, PostgreSQL, and JavaScript, the project will deliver an engaging and user-friendly experience for individuals, policy-makers, and law enforcement agencies.
We aim to provide actionable insights that can help the community and authorities in making informed decisions related to crime prevention, resource allocation, and policy formulation.
