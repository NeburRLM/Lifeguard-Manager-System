import { EntitySchema } from 'typeorm';

export const EmployeeSchema = new EntitySchema({
    name: "employee",
    tableName: "employees",
    columns: {
        id: {
            type: "varchar",
            primary: true,
            length: 9,
        },
        name: {
            type: "varchar",
            length: 100
        },
        role: {
            type: "enum",
            enum: ["Boss", "Lifeguard", "Coordinator"],
        },
        email: {
            type: "varchar",
            unique: true,
            length: 100
        },
        password: {
            type: "varchar",
            length: 255
        },
        birthdate: {
            type: "date",  // Fecha de nacimiento
            nullable: true
        },
        phone_number: {
            type: "varchar", // Número de teléfono
            length: 15,
            nullable: true
        },
        hourlyRate: {
            type: "decimal",
            precision: 10,
            scale: 2
        }
    },
    relations: {
        // Relación con el cuadrante mensual (Work Schedule)
        work_schedule: {
            type: 'one-to-many',
            target: 'work_schedule',
            inverseSide: 'employee',
            cascade: true
        }
    }
});
