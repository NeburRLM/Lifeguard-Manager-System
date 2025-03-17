import { EntitySchema } from "typeorm";

export const IncidentSchema = new EntitySchema({
    name: "incident",   // Nombre del modelo en la base de datos
    tableName: "incidents", // Nombre de la tabla en la base de datos
    columns: {  // Definición de las columnas de la tabla
        id: {   // Columna id, identificador único del incidente
            type: "uuid",   // UUID
            primary: true,  // Clave primaria
            generated: "uuid"   // Generación automática
        },
        type: {     // Columna que almacena el tipo de incidente
            type: "enum",   // Tipo de datos enum
            enum: [     // Lista de valores posibles para el tipo de incidente
                "Heridas en la piel y cortes",
                "Picaduras de medusa",
                "Picaduras de pez araña",
                "Picadura desconocida",
                "Quemaduras solares",
                "Golpes de calor",
                "Ahogamiento en la playa",
                "Atragantamiento",
                "Insolación"
            ],
            nullable: false  // No se pueden insertar valores nulos, es obligatorio
        },
        description: {  // Columna que almacena la descripción del incidente
            type: "text"    // Tipo de datos texto, para describir el incidente
        },
        date: {     // Columna para la fecha y hora del incidente
            type: "timestamp",  // Tipo de datos timestamp (fecha y hora)
            default: () => "CURRENT_TIMESTAMP"  // Valor predeterminado es la fecha y hora actual
        }
    },
    relations: {    // Definición de las relaciones con otras entidades
        facility: { // Relación con la entidad Facility (instalación)
            type: 'many-to-one',    // Muchos incidentes pueden pertenecer a una sola instalación
            target: 'facility', // Relaciona con la entidad Facility
            joinColumn: true,   // Indica que esta relación usa una columna para unir las tablas
            onDelete: 'CASCADE' // Si se elimina una instalación, se eliminan también sus incidentes
        },
        reported_by: {  // Relación con la entidad Employee (empleado que reportó el incidente)
            type: 'many-to-one',    // Muchos incidentes pueden ser reportados por un solo empleado
            target: 'employee', // Relaciona con la entidad Employee
            joinColumn: true, // Indica que esta relación usa una columna para unir las tablas
            onDelete: 'SET NULL'    // Si se elimina un empleado, se establece el campo "reported_by" a NULL
        }
    }
});
