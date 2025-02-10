import { EntitySchema } from 'typeorm';

export const WorkScheduleSchema = new EntitySchema({
    name: "work_schedule",
    tableName: "work_schedules",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid"
        },
        month: {
            type: "int"  // 1-12
        },
        year: {
            type: "int"
        }
    },
    relations: {
        employee: {
            type: 'many-to-one',
            target: 'employee',
            joinColumn: true,
            onDelete: 'CASCADE'
        },
        schedules: {
            type: 'one-to-many',
            target: 'schedule',
            inverseSide: 'work_schedule',
            cascade: true
        }
    }
});
