import { EntitySchema } from "typeorm";

export const RoleTypesSchema = new EntitySchema({
    name: "role_type",  // Nombre de la entidad
    tableName: "roles_types",  // Nombre de la tabla en la base de datos
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
