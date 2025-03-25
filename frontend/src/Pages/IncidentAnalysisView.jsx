import React, { useEffect, useState, useCallback } from "react";
import { Tabs, Select, Button, Modal } from 'antd';
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, Brush } from 'recharts';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import './IncidentAnalysisView.css';

const { Option } = Select;
const { TabPane } = Tabs;

function IncidentAnalysisView() {
    const [incidents, setIncidents] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [incidentTypes, setIncidentTypes] = useState([]);
    const [selectedFacility] = useState("all");
    const [selectedIncidentType] = useState("all");
    const [selectedYear, setSelectedYear] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [selectedDay, setSelectedDay] = useState("all");
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [sortOrder, setSortOrder] = useState('default'); // 'default', 'asc', 'desc'
    const [isComparisonMode, setIsComparisonMode] = useState(false);
    const [comparisonYear, setComparisonYear] = useState("all");
     const [comparisonMonth, setComparisonMonth] = useState("all");  // Agregado
        const [comparisonDay, setComparisonDay] = useState("all");      // Agregado
        const [comparisonFilteredIncidents, setComparisonFilteredIncidents] = useState([]);
        const [colors, setColors] = useState({});
        const [selectedHourIncidents, setSelectedHourIncidents] = useState([]);
        const [isModalVisible, setIsModalVisible] = useState(false);

    const generateColors = useCallback((incidentTypes) => {
        const newColors = {};
        const usedColors = new Set();

        incidentTypes.forEach(incidentType => {
            let color;
            do {
                color = generateRandomColor();
            } while (usedColors.has(color) || isColorLight(color));

            usedColors.add(color);
            newColors[incidentType.type] = color;
        });
        setColors(newColors);
    }, []);

    useEffect(() => {
        fetch("http://localhost:4000/incidents")
            .then((response) => response.json())
            .then((data) => {
                setIncidents(data);
                setFilteredIncidents(data);
                setComparisonFilteredIncidents(data);
            })
            .catch((error) => console.log("Error fetching incidents:", error));

        fetch("http://localhost:4000/facility")
            .then((response) => response.json())
            .then((data) => setFacilities(data))
            .catch((error) => console.log("Error fetching facilities:", error));

        fetch("http://localhost:4000/incident-types")
            .then((response) => response.json())
            .then((data) => {
                setIncidentTypes(data);
                generateColors(data);
            })
            .catch((error) => console.log("Error fetching incident types:", error));
    }, [generateColors]);

    const generateRandomColor = () => {
        return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    };

    const isColorLight = (color) => {
        const r = parseInt(color.substring(1, 3), 16);
        const g = parseInt(color.substring(3, 5), 16);
        const b = parseInt(color.substring(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 200;
    };

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

    const filterComparisonIncidents = useCallback(() => {
        let filtered = incidents;

        if (selectedFacility !== "all") {
            filtered = filtered.filter(incident => incident.facility.id === selectedFacility);
        }

        if (selectedIncidentType !== "all") {
            filtered = filtered.filter(incident => incident.type === selectedIncidentType);
        }

        filtered = filtered.filter(incident => {
            const incidentDate = new Date(incident.date);
            return (comparisonYear === "all" || incidentDate.getFullYear() === parseInt(comparisonYear)) &&
                   (selectedMonth === "all" || incidentDate.getMonth() + 1 === parseInt(selectedMonth)) &&
                   (selectedDay === "all" || incidentDate.getDate() === parseInt(selectedDay));
        });

        setComparisonFilteredIncidents(filtered);
    }, [incidents, selectedFacility, selectedIncidentType, comparisonYear, selectedMonth, selectedDay]);

    useEffect(() => {
        filterComparisonIncidents();
    }, [filterComparisonIncidents]);

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
            const facilityIncidents = filteredIncidents.filter(incident => incident.facility.id === facility.id);
            const incidentCounts = incidentTypes.reduce((typeAcc, incidentType) => {
                const typeCount = facilityIncidents.filter(incident => incident.type === incidentType.type).length;
                typeAcc[incidentType.type] = typeCount;
                return typeAcc;
            }, {});
            acc.push({ name: facilityName, total: facilityIncidents.length, ...incidentCounts });
            return acc;
        }, []);

        if (isComparisonMode) {
            facilities.forEach(facility => {
                const facilityName = facility.name;
                const facilityIncidents = comparisonFilteredIncidents.filter(incident => incident.facility.id === facility.id);
                const incidentCounts = incidentTypes.reduce((typeAcc, incidentType) => {
                    const typeCount = facilityIncidents.filter(incident => incident.type === incidentType.type).length;
                    typeAcc[`${incidentType.type}_comparison`] = typeCount;
                    return typeAcc;
                }, {});
                const index = groupedData.findIndex(item => item.name === facilityName);
                if (index !== -1) {
                    groupedData[index] = { ...groupedData[index], ...incidentCounts };
                }
            });
        }

        return getSortedData(groupedData, 'total');
    };

    const getTypeChartData = () => {
        const groupedData = incidentTypes.reduce((acc, incidentType) => {
            const type = incidentType.type;

            // Cuenta de incidentes seleccionados
            const selectedCount = filteredIncidents.filter(incident => incident.type === type).length;
            acc[type] = { count: selectedCount };

            // Cuenta de incidentes de comparación (si está habilitado el modo de comparación)
            if (isComparisonMode) {
                const comparisonCount = comparisonFilteredIncidents.filter(incident => incident.type === type).length;
                acc[type].count_comparison = comparisonCount;
            }

            return acc;
        }, {});

        const data = Object.entries(groupedData).map(([type, counts]) => ({
            type,
            count: counts.count,
            count_comparison: counts.count_comparison || 0  // Si no hay comparación, se asigna 0
        }));

        return getSortedData(data, 'count');
    };

const getTrendChartData = () => {
    const filterIncidentsByDate = (incident, year, month, day) => {
        const incidentDate = new Date(incident.date);
        return (year === "all" || incidentDate.getFullYear() === parseInt(year)) &&
               (month === "all" || incidentDate.getMonth() + 1 === parseInt(month)) &&
               (day === "all" || incidentDate.getDate() === parseInt(day));
    };

    const groupByTimeUnit = (incidents, year, month, day) => {
        return incidents.reduce((acc, incident) => {
            if (filterIncidentsByDate(incident, year, month, day)) {
                let key;

                if (year === "all" && month === "all" && day === "all") {
                    key = new Date(incident.date).toLocaleString('default', { month: 'long', year: 'numeric' });
                } else if (year === "all" && month !== "all" && day === "all") {
                    const incidentDate = new Date(incident.date);
                    key = `${incidentDate.getDate()} ${incidentDate.getFullYear()}`;
                } else if (year !== "all" && month === "all" && day === "all") {
                    key = new Date(incident.date).toLocaleString('default', { month: 'long' }); // Mes (Enero, Febrero, etc.)
                } else if (year !== "all" && month !== "all" && day === "all") {
                    key = new Date(incident.date).getDate().toString(); // Día del mes
                } else if (day !== "all") {
                    // Agrupar por hora cuando se selecciona un día específico
                    const hour = new Date(incident.date).getHours(); // Obtener la hora (0-23)
                    key = `${hour}:00`; // Formato de hora, por ejemplo: "14:00"
                } else {
                    key = incident.date; // Fecha exacta (YYYY-MM-DD)
                }

                acc[key] = (acc[key] || 0) + 1;
            }
            return acc;
        }, {});
    };

    const getFullRange = (startDate, endDate, unit) => {
        const range = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            if (unit === "month") {
                range.push(current.toLocaleString('default', { month: 'long', year: 'numeric' }));
                current.setMonth(current.getMonth() + 1);
            } else if (unit === "day") {
                range.push(`${current.getDate()} ${current.getFullYear()}`);
                current.setDate(current.getDate() + 1);
            }
        }
        return range;
    };

    const selectedData = groupByTimeUnit(filteredIncidents, selectedYear, selectedMonth, selectedDay);

    let comparisonData = {};
    if (isComparisonMode) {
        comparisonData = groupByTimeUnit(comparisonFilteredIncidents, comparisonYear, selectedMonth, selectedDay);
    }

    const allKeys = new Set([
        ...Object.keys(selectedData),
        ...Object.keys(comparisonData),
        ...(selectedYear === "all" && selectedMonth === "all" && selectedDay === "all" ? getFullRange(new Date(Math.min(...filteredIncidents.map(i => new Date(i.date)))), new Date(Math.max(...filteredIncidents.map(i => new Date(i.date)))), "month") : []),
        ...(selectedYear === "all" && selectedMonth !== "all" && selectedDay === "all" ? getFullRange(new Date(Math.min(...filteredIncidents.map(i => new Date(i.date)))), new Date(Math.max(...filteredIncidents.map(i => new Date(i.date)))), "day") : []),
        ...(selectedYear !== "all" && selectedMonth === "all" ? Array.from({ length: 12 }, (_, i) => new Date(2000, i).toLocaleString('default', { month: 'long' })) : []),
        ...(selectedYear !== "all" && selectedMonth !== "all" && selectedDay === "all" ? Array.from({ length: 31 }, (_, i) => (i + 1).toString()) : []),
        ...(selectedYear !== "all" && selectedMonth !== "all" && selectedDay !== "all" ? Array.from({ length: 24 }, (_, i) => `${i}:00`) : []),
    ]);

    const trendChartData = Array.from(allKeys).map(key => ({
        key,
        count: selectedData[key] || 0,
        comparisonCount: comparisonData[key] || 0
    }));

    trendChartData.sort((a, b) => {
        if (selectedYear === "all" && selectedMonth === "all" && selectedDay === "all") {
            const aParts = a.key.split(' ');
                    const bParts = b.key.split(' ');

                    const aMonth = aParts.slice(0, -1).join(' ').toLowerCase(); // Captura el mes incluso si tiene espacios
                    const bMonth = bParts.slice(0, -1).join(' ').toLowerCase();
                    const aYear = parseInt(aParts[aParts.length - 1]); // Asegura que sea número
                    const bYear = parseInt(bParts[bParts.length - 1]);
            const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

            if (aYear !== bYear) {
                        return aYear - bYear; // Primero ordena por año
                    }

                    return months.indexOf(aMonth) - months.indexOf(bMonth);

        } else if (selectedYear === "all" && selectedMonth !== "all" && selectedDay === "all") {
            const [aDay, aYear] = a.key.split(' ');
            const [bDay, bYear] = b.key.split(' ');
            if (aYear === bYear) {
                return parseInt(aDay) - parseInt(bDay);
            }
            return parseInt(aYear) - parseInt(bYear);
        } else if (selectedYear !== "all" && selectedMonth === "all" && selectedDay === "all") {
            const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
            return months.indexOf(a.key.toLowerCase()) - months.indexOf(b.key.toLowerCase());
        } else if (selectedYear !== "all" && selectedMonth !== "all" && selectedDay === "all") {
            return parseInt(a.key) - parseInt(b.key);
        } else if (selectedYear !== "all" && selectedMonth !== "all" && selectedDay !== "all") {
            const aHour = parseInt(a.key.split(':')[0]);
            const bHour = parseInt(b.key.split(':')[0]);
            return aHour - bHour;
        } else {
            return new Date(a.key) - new Date(b.key);
        }
    });

    return trendChartData;
};




const handleLineChartClick = (e) => {
        if (selectedDay === "all") {
                return; // Evita la acción si no se ha seleccionado un día
            }

        if (e && e.activePayload) {
            const selectedHour = e.activePayload[0].payload.key; // La hora o el día/hora del gráfico
            const hour = selectedHour.split(":")[0]; // Extraemos la hora en formato "HH"

            // Filtramos los incidentes que ocurrieron en esa hora
            const incidentsAtSelectedHour = [
                ...filteredIncidents.filter(incident => {
                    const incidentDate = new Date(incident.date);
                    return incidentDate.getHours().toString() === hour;
                }),
                ...comparisonFilteredIncidents.filter(incident => {
                    const incidentDate = new Date(incident.date);
                    return incidentDate.getHours().toString() === hour;
                })
            ];

            setSelectedHourIncidents(incidentsAtSelectedHour); // Almacenamos los incidentes filtrados
            setIsModalVisible(true); // Abrir el modal cuando se hace clic en la hora
        }
    };

     const handleCancel = () => {
            setIsModalVisible(false);
        };

    const getSeverityChartData = () => {
        const groupedData = filteredIncidents.reduce((acc, incident) => {
            acc[incident.severity] = (acc[incident.severity] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(groupedData).map(([severity, count]) => ({ severity, count }));
    };

    const [zoomLevel, setZoomLevel] = useState(1);

        const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 2));
        const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));

    const { trendData, comparisonData } = getTrendChartData();

    return (
        <main className="content">
            <header className="header">
                <h4>Incident Analysis</h4>
            </header>

            <div className="filter-container">
                <Select defaultValue="all" onChange={value => { setSelectedYear(value); filterIncidents(); }} className="year-select">
                    <Option value="all">All Years</Option>
                    {[...Array(10).keys()].map(i => {
                        const year = new Date().getFullYear() - i;
                        return <Option key={year} value={year}>{year}</Option>;
                    })}
                </Select>
                <Select defaultValue="all" onChange={value => { setSelectedMonth(value); filterIncidents(); }} className="month-select">
                    <Option value="all">All Months</Option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <Option key={month} value={month}>{month}</Option>
                    ))}
                </Select>
                <Select defaultValue="all" onChange={value => { setSelectedDay(value); filterIncidents(); }} className="day-select">
                    <Option value="all">All Days</Option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <Option key={day} value={day}>{day}</Option>
                    ))}
                </Select>
                <Select defaultValue="default" onChange={value => { setSortOrder(value); filterIncidents(); }} className="sort-select">
                    <Option value="default">Default Order</Option>
                    <Option value="asc">Ascending Order</Option>
                    <Option value="desc">Descending Order</Option>
                </Select>
                <Button onClick={() => setIsComparisonMode(!isComparisonMode)} className="comparison-button">
                    {isComparisonMode ? "Disable Comparison Mode" : "Enable Comparison Mode"}
                </Button>
            </div>

            {isComparisonMode && (
                <div className="comparison-filter-container">
                    <Select defaultValue="all" onChange={value => { setComparisonYear(value); filterComparisonIncidents(); }} className="year-select">
                        <Option value="all">All Years</Option>
                        {[...Array(10).keys()].map(i => {
                            const year = new Date().getFullYear() - i;
                            return <Option key={year} value={year}>{year}</Option>;
                        })}
                    </Select>
                </div>
            )}

            <Tabs defaultActiveKey="1">
                <TabPane tab="Distribución por Instalación" key="1">
                    <div className="chart-container">
                        <BarChart width={Math.max(1200, facilities.length * 50)} height={650} data={getSiteChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={250} />
                            <YAxis />
                            <Tooltip />
                            {incidentTypes.length > 0 && <Legend
                                                           payload={incidentTypes.map(incidentType => ({
                                                             value: incidentType.type,
                                                             type: "square",
                                                             color: colors[incidentType.type]
                                                           }))}
                                                         />}
                            {incidentTypes.map((incidentType) => (
                                <Bar key={incidentType.type} dataKey={incidentType.type} stackId="a" fill={colors[incidentType.type]} name={incidentType.type} />
                            ))}
                            {isComparisonMode && incidentTypes.map((incidentType) => (
                                <Bar key={`${incidentType.type}_comparison`} dataKey={`${incidentType.type}_comparison`} stackId="b" fill={colors[incidentType.type]} name={incidentType.type} />
                            ))}
                        </BarChart>
                    </div>
                </TabPane>

                <TabPane tab="Frecuencia por Tipo" key="2">
                    <div className="chart-container">
                        <BarChart width={Math.max(1200, incidentTypes.length * 50)} height={650} data={getTypeChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" angle={-45} textAnchor="end" interval={0} height={250} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" name="Incident Count" />
                            {isComparisonMode && (
                                <Bar dataKey="count_comparison" fill="#8884d8" name="Comparison Count" />
                            )}
                        </BarChart>
                    </div>
                </TabPane>

                <TabPane tab="Tendencias Temporales" key="3">
                    <div className="chart-container" style={{ overflowX: "auto", textAlign: "center" }}>
                        <div className="zoom-controls" style={{ marginBottom: 10 }}>
                            <ZoomInOutlined onClick={handleZoomIn} style={{ fontSize: 20, cursor: "pointer" }} />
                            <ZoomOutOutlined onClick={handleZoomOut} style={{ fontSize: 20, cursor: "pointer", marginLeft: 10 }} />
                        </div>

                        <LineChart
                            width={Math.min(1200 * zoomLevel, 2000)}
                            height={600 * zoomLevel}
                            data={getTrendChartData()}
                            margin={{ top: 20, right: 30, left: 40, bottom: 70 }}
                            onClick={handleLineChartClick}
                        >
                            <XAxis dataKey="key" label={{ value: "Tiempo", position: "insideBottom", offset: -10 }} />
                             <YAxis
                                                            label={{ value: "Cantidad", angle: -90, position: "insideLeft" }}
                                                            domain={[0, "dataMax + 10"]}
                                                        />
                            <Tooltip />

                            <Legend formatter={(value) =>
                                                            value === "count"
                                                                ? `${selectedDay}-${selectedMonth}-${selectedYear}`
                                                                : `${selectedDay}-${selectedMonth}-${comparisonYear}`
                                                        } />
                            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={3} />
                            {isComparisonMode && (
                                <Line type="monotone" dataKey="comparisonCount" stroke="#82ca9d" strokeDasharray="5 5" strokeWidth={3} />
                            )}
                            <Brush height={30} y={560 * zoomLevel} />
                        </LineChart>
                    </div>
                </TabPane>



                <TabPane tab="Mapa de calor" key="4">
                    <div className="chart-container">
                        <PieChart width={800} height={650}>
                            <Pie data={getSeverityChartData()} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={200} fill="#8884d8" label>
                                {getSeverityChartData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </div>
                </TabPane>
            </Tabs>
            {/* Modal que se abre cuando se hace clic en una hora */}
                        <Modal
                            title={`Incidentes a las ${selectedHourIncidents[0] && new Date(selectedHourIncidents[0].date).getHours()}:00`}
                            visible={isModalVisible}
                            onCancel={handleCancel}
                            footer={null}
                            width={800}
                            className="incident-modal"
                        >
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <ul>
                                    {selectedHourIncidents.map((incident, index) => (
                                        <li key={index}>
                                            <p>{incident.description} ({new Date(incident.date).toLocaleString()})</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Modal>
        </main>
    );
}

export default IncidentAnalysisView;