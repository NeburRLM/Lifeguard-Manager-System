import { EntitySchema } from "typeorm";

export const FacilitySchema = new EntitySchema({
    name: "facility",   // Nombre del modelo en la base de datos
    tableName: "facilities",    // Nombre de la tabla en la base de datos
    columns: {  // Definición de las columnas de la tabla
        id: {   // Columna para el id de la instalación
            type: "uuid",   // Tipo de datos UUID
            primary: true,  // Es clave primaria
            generated: "uuid"   // Generación automática
        },
        name: { // Columna para el nombre de la instalación
            type: "varchar",    // Tipo de datos varchar
            length: 100 // Longitud máxima de la cadena
        },
        location: { // Columna para la ubicación de la instalación
            type: "varchar",    // Tipo de datos varchar
            length: 255 // Longitud máxima
        },
        facility_type: {    // Columna para el tipo de instalación
            type: "enum",   // Tipo de datos enum
            enum: ["Pool", "Beach"] // Tipos posibles
        },
        latitude: { // Columna para la latitud
            type: "float"   // Tipo de datos float
        },
        longitude: {    // Columna para la longitud
            type: "float"   // Tipo de datos float
        }
    },

    uniqueConstraints: [    // Restricciones únicas
            {
                name: "facility_name_location_unique",  // Nombre de la restricción única
                columns: ["name", "location"]   // Columnas que deben ser únicas
            },
            {
                name: "facility_latitude_longitude_unique", // Nombre de la restricción única
                columns: ["latitude", "longitude"]  // Columnas que deben ser únicas
            }
        ],

    relations: {
        incidents: {    // Relación con la entidad Incident
            type: 'one-to-many',    // Una instalación tiene muchos incidentes
            target: 'incident',     // Relaciona con la entidad Incident
            inverseSide: 'facility',    // La otra parte de la relación
            cascade: true   // Si se elimina una instalación, sus incidentes también se eliminan
        }
    }
});
