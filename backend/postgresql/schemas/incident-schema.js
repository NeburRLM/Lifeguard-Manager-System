import { EntitySchema } from "typeorm";

export const IncidentSchema = new EntitySchema({
    name: "incident",
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
        facility: {
            type: 'many-to-one',
            target: 'facility',
            joinColumn: true,
            onDelete: 'CASCADE'
        },
        reported_by: {
            type: 'many-to-one',
            target: 'employee',
            joinColumn: true,
            onDelete: 'SET NULL'
        }
    }
});