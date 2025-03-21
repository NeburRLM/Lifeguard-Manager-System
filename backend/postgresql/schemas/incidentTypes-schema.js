import { EntitySchema } from "typeorm";

export const IncidentTypesSchema = new EntitySchema({
    name: "incident_type",  // Nombre de la entidad
    tableName: "incident_types",  // Nombre de la tabla en la base de datos
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid"  // Generamos un UUID para el ID
        },
        type: {
            type: "varchar",
            unique: true  // Aseguramos que el tipo sea único
        }
    }
});
