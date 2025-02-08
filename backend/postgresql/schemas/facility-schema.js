import { EntitySchema } from 'typeorm';

export const BeachSchema = new EntitySchema({
    name: "Beach",
    tableName: "beaches",
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
        location: {
            type: "varchar",
            length: 255
        },
        facility: {
            type: "enum",
            enum: ["Instalación Deportiva", "Playa"]
        }
    },
    relations: {
        employees: {
            type: 'one-to-many',
            target: 'Employee',
            inverseSide: 'beach',
            cascade: true
        },
        incidents: {
            type: 'one-to-many',
            target: 'Incident',
            inverseSide: 'beach',
            cascade: true
        }
    }
});