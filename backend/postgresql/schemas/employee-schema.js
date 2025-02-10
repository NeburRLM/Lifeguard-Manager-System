import { EntitySchema } from 'typeorm';

export const EmployeeSchema = new EntitySchema({
    name: "employee",
    tableName: "employees",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid"
        },
        name: {
            type: "varchar",
            length: 100
        },
        role: {
            type: "varchar",
            length: 50
        },
        email: {
            type: "varchar",
            unique: true,
            length: 100
        },
        password: {
            type: "varchar",
            length: 255
        }

    },
    relations: {
        facility: {
            type: 'many-to-one',
            target: 'facility',
            joinColumn: true,
            onDelete: 'SET NULL',
            nullable: true
        },
        schedule: {
            type: 'one-to-many',
            target: 'schedule',
            inverseSide: 'employee',
            cascade: true
        }
    }
});