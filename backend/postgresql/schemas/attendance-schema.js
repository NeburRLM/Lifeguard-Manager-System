import { EntitySchema } from "typeorm";

export const AttendanceSchema = new EntitySchema({
    name: "attendance",
    tableName: "attendances",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid"
        },
        date: {
            type: "date",
            nullable: false
        },
        check_in: {
            type: "timestamp",
            nullable: false
        },
        check_out: {
            type: "timestamp",
            nullable: true // Puede ser nulo si el turno sigue activo
        },
        employee_id: {
            type: "varchar", // Asegúrate de que el tipo de datos coincide con el tipo de `id` en la entidad `Employee`
            nullable: false
        },
        facility_id: {
            type: "varchar", // Asegúrate de que el tipo de datos coincide con el tipo de `id` en la entidad `Facility`
            nullable: false
        }
    },
    relations: {
        employee: {
            type: "many-to-one",
            target: "employee",
            joinColumn: {
                name: "employee_id"
            },
            onDelete: "CASCADE"
        },
        facility: {
            type: "many-to-one",
            target: "facility",
            joinColumn: {
                name: "facility_id"
            },
            onDelete: "CASCADE"
        }
    },
    indices: [
        {
            name: "idx_attendance_employee",
            columns: ["employee_id"] // La columna employee_id debe estar en el índice
        },
        {
            name: "idx_attendance_facility",
            columns: ["facility_id"]
        }
    ]
});
