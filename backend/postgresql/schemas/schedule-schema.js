import { EntitySchema } from "typeorm";

export const ScheduleSchema = new EntitySchema({
    name: "schedule",
    tableName: "schedules",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid"
        },
        date: {
            type: "date"
        },
        start_time: {
            type: "time",
            default: "10:00:00"
        },
        end_time: {
            type: "time",
            default: "19:00:00"
        },
        check_in: {
            type: "timestamp",
            nullable: true
        },
        check_out: {
            type: "timestamp",
            nullable: true
        }
    },
    relations: {
        work_schedule: {
            type: 'many-to-one',
            target: 'work_schedule',
            joinColumn: true,
            onDelete: 'CASCADE'
        },
        facility: {
            type: 'many-to-one',
            target: 'facility',
            joinColumn: true,
            onDelete: 'CASCADE'
        }
    }
});