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
            type: "enum",
            enum: [
                "Heridas en la piel y cortes",
                "Picaduras de medusa",
                "Picaduras de pez araña",
                "Picadura desconocida",
                "Quemaduras solares",
                "Golpes de calor",
                "Ahogamiento en la playa",
                "Atragantamiento",
                "Insolación"
            ],
            nullable: false  // Asegura que no se puedan insertar valores nulos
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
