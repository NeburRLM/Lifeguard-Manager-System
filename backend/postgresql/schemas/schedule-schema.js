import { EntitySchema } from 'typeorm';

export const ShiftSchema = new EntitySchema({
    name: "Shift",
    tableName: "shifts",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid"
        },
        date: {
            type: "date"
        },
        startTime: {
            type: "time"
        },
        endTime: {
            type: "time"
        },
        checkIn: {
            type: "timestamp",
            nullable: true
        },
        checkOut: {
            type: "timestamp",
            nullable: true
        }
    },
    relations: {
        employee: {
            type: 'many-to-one',
            target: 'Employee',
            joinColumn: true,
            onDelete: 'CASCADE'
        },
        beach: {
            type: 'many-to-one',
            target: 'Beach',
            joinColumn: true,
            onDelete: 'CASCADE'
        }
    }
});