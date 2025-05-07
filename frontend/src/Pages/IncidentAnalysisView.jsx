import React, { useEffect, useState, useCallback } from "react";
import { Tabs, Select, Button, Modal } from 'antd';
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Brush, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import './IncidentAnalysisView.css';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';

const { Option } = Select;
const { TabPane } = Tabs;

function HeatmapLayer({ points, maxIntensity }) {
    const map = useMap();

useEffect(() => {
    // Capa para la acumulación de incidentes (todos con intensidad 1)
    const accumulationLayer = L.heatLayer(
        points.map(incident => [incident[0], incident[1], 1]), // Acumulación con intensidad 1
        {
            radius: 25,
            blur: 15,
            max: maxIntensity,
            gradient: { 0.1: 'blue', 0.5: 'yellow', 1: 'blue' }
        }
    ).addTo(map);

    // Capa para los incidentes graves (por ejemplo, ahogamientos con intensidad 3)
    const severityLayer = L.heatLayer(
        points.filter(incident => incident[2] === 3).map(incident => [incident[0], incident[1], 3]), // Filtrar solo incidentes graves
        {
            radius: 25,
            blur: 15,
            max: maxIntensity,
            gradient: { 0.1: 'red', 0.5: 'red', 1: 'red' } // Un gradiente diferente o más enfocado a incidentes graves
        }
    ).addTo(map);

    // Cleanup function para remover las capas cuando el mapa se actualice
    return () => {
        map.removeLayer(accumulationLayer);
        map.removeLayer(severityLayer);
    };
}, [map, points, maxIntensity]);


    return null;
}

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

    const [comparisonFilteredIncidents, setComparisonFilteredIncidents] = useState([]);
    const [colors, setColors] = useState({});
    const [selectedHourIncidents, setSelectedHourIncidents] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("1");
    const [heatmapSelectedIncidentType, setHeatmapSelectedIncidentType] = useState("all");
    const [selectedIncidentForAge, setSelectedIncidentForAge] = useState(null);

    const { t, i18n } = useTranslation();

    const generateColors = useCallback((incidentTypes) => {
        const newColors = {};
        const usedColors = new Set();

        // Paleta de colores predefinida para asegurar diferentes tonalidades fuertes y distintas
        const predefinedColors = [
            "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b",
            "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#393b79", "#637939",
            "#8c6d31", "#843c39", "#7b4173", "#a55194", "#6b6ecf", "#b5cf6b",
        ];

        incidentTypes.forEach((incidentType, index) => {
            let color;

            // Si hay colores predefinidos, úsalos primero
            if (index < predefinedColors.length) {
                color = predefinedColors[index];
            } else {
                // Generar un color aleatorio si se agotan los predefinidos
                do {
                    color = generateRandomColor();
                } while (usedColors.has(color) || isColorLight(color) || isColorSimilar(color, usedColors));

            }

            usedColors.add(color);
            newColors[incidentType.type] = color;
        });

        setColors(newColors);
    }, []);

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

    const isColorSimilar = (color, usedColors) => {
        const threshold = 100; // Ajusta este valor para mayor o menor sensibilidad a la similitud de colores
        const [r1, g1, b1] = [parseInt(color.substring(1, 3), 16), parseInt(color.substring(3, 5), 16), parseInt(color.substring(5, 7), 16)];

        for (const usedColor of usedColors) {
            const [r2, g2, b2] = [parseInt(usedColor.substring(1, 3), 16), parseInt(usedColor.substring(3, 5), 16), parseInt(usedColor.substring(5, 7), 16)];
            const distance = Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));

            if (distance < threshold) {
                return true;
            }
        }

        return false;
    };

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


    // Establecer un efecto para restablecer selectedIncidentForAge cuando activeTab cambie
        useEffect(() => {
            setSelectedIncidentForAge(null); // Restablecer la selección cuando se cambia de pestaña
        }, [activeTab]); // Se activa cada vez que el activeTab cambia

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
                    key = new Date(incident.date).toLocaleString(i18n.language, { month: 'long', year: 'numeric' });
                } else if (year === "all" && month !== "all" && day === "all") {
                    const incidentDate = new Date(incident.date);
                    key = `${incidentDate.getDate()} ${incidentDate.getFullYear()}`;
                } else if (year !== "all" && month === "all" && day === "all") {
                    key = new Date(incident.date).toLocaleString(i18n.language, { month: 'long' }); // Mes (Enero, Febrero, etc.)
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
                range.push(current.toLocaleString(i18n.language, { month: 'long', year: 'numeric' }));
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
        ...(selectedYear !== "all" && selectedMonth === "all" ? Array.from({ length: 12 }, (_, i) => new Date(2000, i).toLocaleString(i18n.language, { month: 'long' })) : []),
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
            const months = [...Array(12).keys()].map(i =>
                            new Date(2000, i).toLocaleString(i18n.language, { month: 'long' }).toLowerCase()
                        );

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
            const months = [...Array(12).keys()].map(i =>
                            new Date(2000, i).toLocaleString(i18n.language, { month: 'long' }).toLowerCase()
                        );
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
                ...new Map(
                    [
                        ...filteredIncidents.filter(incident => {
                            const incidentDate = new Date(incident.date);
                            return incidentDate.getHours().toString() === hour;
                        }),
                        ...comparisonFilteredIncidents.filter(incident => {
                            const incidentDate = new Date(incident.date);
                            return incidentDate.getHours().toString() === hour;
                        })
                    ].map(incident => [incident.id, incident]) // Usa un identificador único (id) para evitar duplicados
                ).values()
            ];

            setSelectedHourIncidents(incidentsAtSelectedHour); // Almacenamos los incidentes filtrados
            setIsModalVisible(true); // Abrir el modal cuando se hace clic en la hora
        }
    };

     const handleCancel = () => {
            setIsModalVisible(false);
        };



    const [zoomLevel, setZoomLevel] = useState(1);

        const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 2));
        const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));



const getHeatmapData = () => {
    return filteredIncidents
        .filter(incident => heatmapSelectedIncidentType === "all" || incident.type === heatmapSelectedIncidentType)
        .map(incident => {
            let intensity = 2; // Intensidad por defecto para la acumulación de incidentes

            // Aumentar la intensidad para los incidentes graves
            if (incident.type === "Ahogamiento en la playa") {
                intensity = 3;  // Mayor intensidad para incidentes graves
            }

            return [incident.latitude, incident.longitude, intensity];
        });
};



const maxIntensity = Math.max(...filteredIncidents.map(incident => {
    if (incident.type === "Ahogamiento en la playa") {
        return 3; // Alta intensidad para ahogamientos
    }
    return 1; // Intensidad baja para otros incidentes
}));


// Definir franjas de edad
const ageRanges = [
    { label: "0-10", min: 0, max: 10 },
    { label: "11-20", min: 11, max: 20 },
    { label: "21-30", min: 21, max: 30 },
    { label: "31-40", min: 31, max: 40 },
    { label: "41-50", min: 41, max: 50 },
    { label: "51-60", min: 51, max: 60 },
    { label: "61-70", min: 61, max: 70 },
    { label: "71-80", min: 71, max: 80 },
    { label: "81-90", min: 81, max: 90 },
    { label: "91+", min: 91, max: Infinity }
];

// Generar datos para el gráfico de pastel
const getPieChartData = () => {
    return incidentTypes.map(({ type }) => {
        const count = filteredIncidents.filter(incident => incident.type === type).length;
        return { name: type, value: count };
    });
};

// Generar datos para el gráfico de edades
const getAgePieChartData = () => {
    if (!selectedIncidentForAge) return [];

    const ageCounts = ageRanges.map(({ label, min, max }) => ({
        name: label,
        value: filteredIncidents.filter(
            incident => incident.type === selectedIncidentForAge && incident.age >= min && incident.age <= max
        ).length
    }));

    return ageCounts.filter(ageGroup => ageGroup.value > 0); // Eliminar grupos sin datos
 };

    return (
        <main className="content">
            <header className="header">
                <h4>{t("incidentAnalysis-view.title")}</h4>
            </header>

            <div className="filter-container">
                <Select defaultValue="all" onChange={value => { setSelectedYear(value); filterIncidents(); }} className="year-select">
                    <Option value="all">{t("incidentAnalysis-view.all-years")}</Option>
                    {[...Array(10).keys()].map(i => {
                        const year = new Date().getFullYear() - i;
                        return <Option key={year} value={year}>{year}</Option>;
                    })}
                </Select>
                <Select defaultValue="all" onChange={value => { setSelectedMonth(value); filterIncidents(); }} className="month-select">
                    <Option value="all">{t("incidentAnalysis-view.all-months")}</Option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <Option key={month} value={month}>{month}</Option>
                    ))}
                </Select>
                <Select defaultValue="all" onChange={value => { setSelectedDay(value); filterIncidents(); }} className="day-select">
                    <Option value="all">{t("incidentAnalysis-view.all-days")}</Option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <Option key={day} value={day}>{day}</Option>
                    ))}
                </Select>
                <Select defaultValue="default" onChange={value => { setSortOrder(value); filterIncidents(); }} className="sort-select">
                    <Option value="default">{t("incidentAnalysis-view.order.default")}</Option>
                    <Option value="asc">{t("incidentAnalysis-view.order.asc")}</Option>
                    <Option value="desc">{t("incidentAnalysis-view.order.desc")}</Option>
                </Select>
                {activeTab !== "4" && activeTab !== "5" && (
                        <Button onClick={() => setIsComparisonMode(!isComparisonMode)} className="comparison-button">
                            {isComparisonMode ? t("incidentAnalysis-view.compare.disable") : t("incidentAnalysis-view.compare.enable")}
                        </Button>
                    )}
            </div>

            {isComparisonMode && (
                <div className="comparison-filter-container">
                    <Select defaultValue="all" onChange={value => { setComparisonYear(value); filterComparisonIncidents(); }} className="year-select">
                        <Option value="all">{t("incidentAnalysis-view.all-years")}</Option>
                        {[...Array(10).keys()].map(i => {
                            const year = new Date().getFullYear() - i;
                            return <Option key={year} value={year}>{year}</Option>;
                        })}
                    </Select>
                </div>
            )}

            <Tabs defaultActiveKey="1" onChange={key => setActiveTab(key)}>
                <TabPane tab={t("incidentAnalysis-view.distribution-title")} key="1">
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

                <TabPane tab={t("incidentAnalysis-view.frequency-title")} key="2">
                    <div className="chart-container">
                        <BarChart width={Math.max(1200, incidentTypes.length * 50)} height={650} data={getTypeChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" angle={-45} textAnchor="end" interval={0} height={250} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" name={t("incidentAnalysis-view.incident-count")} />
                            {isComparisonMode && (
                                <Bar dataKey="count_comparison" fill="#8884d8" name={t("incidentAnalysis-view.comparison-count")} />
                            )}
                        </BarChart>
                    </div>
                </TabPane>

                <TabPane tab={t("incidentAnalysis-view.temporal-title")} key="3">
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
                            <XAxis dataKey="key" label={{ value: t("incidentAnalysis-view.time"), position: "insideBottom", offset: -10 }} />
                             <YAxis
                                                            label={{ value: t("incidentAnalysis-view.quantity"), angle: -90, position: "insideLeft" }}
                                                            domain={[0, "dataMax + 10"]}
                                                        />
                            <Tooltip />

                            <Legend formatter={(value) =>
                                                            value === t("incidentAnalysis-view.count")
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



                <TabPane tab={t("incidentAnalysis-view.heat-map-title")} key="4">
                    <div className="chart-container">
                        <MapContainer center={[41.066797, 1.070257]} zoom={13} style={{ height: "600px", width: "100%" }}>
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            <HeatmapLayer
                                points={getHeatmapData()}
                                maxIntensity={maxIntensity}
                            />
                        </MapContainer>
                        {/* Botón flotante para seleccionar el tipo de incidente */}
                        <div style={{ position: "absolute", top: "10px", right: "10px", background: "#007BFF", padding: "10px", borderRadius: "5px", boxShadow: "0px 0px 10px rgba(0,0,0,0.2)", zIndex: 1000 }}>
                            <Select defaultValue="all" style={{ width: 200 }} onChange={setHeatmapSelectedIncidentType}>
                                <Option value="all">{t("incidentAnalysis-view.all-incidents")}</Option>
                                {incidentTypes.map(type => (
                                    <Option key={type.type} value={type.type}>{type.type}</Option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </TabPane>



                <TabPane tab={t("incidentAnalysis-view.distribution-age")} key="5">
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                                <Pie
                                    data={getPieChartData()}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={150}
                                    fill="#8884d8"
                                    label
                                    onClick={(data) => setSelectedIncidentForAge(data.name)}
                                >
                                    {getPieChartData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[entry.name]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Gráfico de edades al hacer clic en una porción */}
                    {selectedIncidentForAge && (
                        <div style={{ marginTop: "-200px" }}> {/* Ajusté el margen superior para mover el gráfico hacia arriba */}
                            <h3>{t("incidentAnalysis-view.age-dist")} "{selectedIncidentForAge}"</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={getAgePieChartData()}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        label
                                        stroke="white" // Líneas blancas entre las franjas
                                        strokeWidth={2}
                                    >
                                        {getAgePieChartData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={colors[entry.name] || generateRandomColor()} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </TabPane>




            </Tabs>
            {/* Modal que se abre cuando se hace clic en una hora */}
                        <Modal
                            title={`${t("incidentAnalysis-view.incidents-time")} ${selectedHourIncidents[0] && new Date(selectedHourIncidents[0].date).getHours()}:00`}
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