import { EntitySchema } from 'typeorm';

export const IncidentSchema = new EntitySchema({
    name: "Incident",
    tableName: "incidents",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid"
        },
        type: {
            type: "varchar",
            length: 100
        },
        description: {
            type: "text"
        },
        date: {
            type: "timestamp",
            default: () => "CURRENT_TIMESTAMP"
        }
    },
    relations: {
        beach: {
            type: 'many-to-one',
            target: 'Beach',
            joinColumn: true,
            onDelete: 'CASCADE'
        },
        reportedBy: {
            type: 'many-to-one',
            target: 'Employee',
            joinColumn: true,
            onDelete: 'SET NULL'
        }
    }
});