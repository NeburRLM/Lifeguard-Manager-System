import { EntitySchema } from "typeorm";

export const FacilityTypesSchema = new EntitySchema({
    name: "facility_type",  // Nombre de la entidad
    tableName: "facilities_types",  // Nombre de la tabla en la base de datos
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
