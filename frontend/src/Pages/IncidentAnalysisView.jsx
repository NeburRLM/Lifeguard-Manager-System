import React, { useEffect, useState, useCallback } from "react";
import { Select, Button } from 'antd';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import './IncidentAnalysisView.css';

const { Option } = Select;

function IncidentAnalysisView() {
    const [incidents, setIncidents] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [incidentTypes, setIncidentTypes] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState("all");
    const [selectedIncidentType, setSelectedIncidentType] = useState("all");
    const [selectedYear, setSelectedYear] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedDay, setSelectedDay] = useState("all");
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [view, setView] = useState('site'); // 'site' or 'type'
    const [sortOrder, setSortOrder] = useState('default'); // 'default', 'asc', 'desc'

    useEffect(() => {
        fetch("http://localhost:4000/incidents")
            .then((response) => response.json())
            .then((data) => {
                setIncidents(data);
                setFilteredIncidents(data);
            })
            .catch((error) => console.log("Error fetching incidents:", error));

        fetch("http://localhost:4000/facility")
            .then((response) => response.json())
            .then((data) => setFacilities(data))
            .catch((error) => console.log("Error fetching facilities:", error));

        fetch("http://localhost:4000/incident-types")
            .then((response) => response.json())
            .then((data) => setIncidentTypes(data))
            .catch((error) => console.log("Error fetching incident types:", error));
    }, []);

    const filterIncidents = useCallback(() => {
        let filtered = incidents;

        if (selectedFacility !== "all") {
            filtered = filtered.filter(incident => incident.facility.id === selectedFacility);
        }

        if (selectedIncidentType !== "all") {
            filtered = filtered.filter(incident => incident.type === selectedIncidentType);
        }

        filtered = filtered.filter(incident => {
            const incidentDate = new Date(incident.date);
            return (selectedYear === "all" || incidentDate.getFullYear() === parseInt(selectedYear)) &&
                   (selectedMonth === "all" || incidentDate.getMonth() + 1 === parseInt(selectedMonth)) &&
                   (selectedDay === "all" || incidentDate.getDate() === parseInt(selectedDay));
        });

        setFilteredIncidents(filtered);
    }, [incidents, selectedFacility, selectedIncidentType, selectedYear, selectedMonth, selectedDay]);

    useEffect(() => {
        filterIncidents();
    }, [filterIncidents]);

    const getSortedData = (data, key) => {
        if (sortOrder === 'asc') {
            return [...data].sort((a, b) => a[key] - b[key]);
        } else if (sortOrder === 'desc') {
            return [...data].sort((a, b) => b[key] - a[key]);
        }
        return data;
    };

    const getSiteChartData = () => {
        const groupedData = facilities.reduce((acc, facility) => {
            const facilityName = facility.name;
            const count = filteredIncidents.filter(incident => incident.facility.id === facility.id).length;
            acc[facilityName] = count;
            return acc;
        }, {});

        const data = Object.entries(groupedData).map(([name, count]) => ({ name, count }));
        return getSortedData(data, 'count');
    };

    const getTypeChartData = () => {
        const groupedData = incidentTypes.reduce((acc, incidentType) => {
            const type = incidentType.type;
            const count = filteredIncidents.filter(incident => incident.type === type).length;
            acc[type] = count;
            return acc;
        }, {});

        const data = Object.entries(groupedData).map(([type, count]) => ({ type, count }));
        return getSortedData(data, 'count');
    };

    return (
        <main className="content">
            <header className="header">
                <h4>Incident Analysis</h4>
            </header>

            <div className="filter-container">
                <Button type="primary" onClick={() => setView('site')}>View by Site</Button>
                <Button type="primary" onClick={() => setView('type')}>View by Type</Button>
                <Select defaultValue="all" onChange={value => setSelectedYear(value)} className="year-select">
                    <Option value="all">All Years</Option>
                    {[...Array(10).keys()].map(i => {
                        const year = new Date().getFullYear() - i;
                        return <Option key={year} value={year}>{year}</Option>;
                    })}
                </Select>
                <Select defaultValue="all" onChange={value => setSelectedMonth(value)} className="month-select">
                    <Option value="all">All Months</Option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <Option key={month} value={month}>{month}</Option>
                    ))}
                </Select>
                <Select defaultValue="all" onChange={value => setSelectedDay(value)} className="day-select">
                    <Option value="all">All Days</Option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <Option key={day} value={day}>{day}</Option>
                    ))}
                </Select>
                <Select defaultValue="default" onChange={value => setSortOrder(value)} className="sort-select">
                    <Option value="default">Default Order</Option>
                    <Option value="asc">Ascending Order</Option>
                    <Option value="desc">Descending Order</Option>
                </Select>
            </div>

            <div className="chart-container">
                <div style={{ overflowX: 'auto', overflowY: 'auto', width: '100%' }}>
                    {view === 'site' ? (
                        <BarChart width={Math.max(1200, facilities.length * 50)} height={650} data={getSiteChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={250} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#8884d8" name="Incident Count" />
                        </BarChart>
                    ) : (
                        <BarChart width={Math.max(1200, incidentTypes.length * 50)} height={650} data={getTypeChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" angle={-45} textAnchor="end" interval={0} height={250} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#82ca9d" name="Incident Count" />
                        </BarChart>
                    )}
                </div>
            </div>
        </main>
    );
}

export default IncidentAnalysisView;