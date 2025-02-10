import { EntitySchema } from "typeorm";

export const PayrollSchema = new EntitySchema({
    name: "payroll",
    tableName: "payrolls",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid"
        },
        month: {
            type: "varchar",
            length: 10
        },
        year: {
            type: "int"
        },
        total_hours: {
            type: "int"
        },
        amount: {
            type: "decimal",
            precision: 10,
            scale: 2
        }
    },
    relations: {
        employee: {
            type: 'many-to-one',
            target: 'employee',
            joinColumn: true,
            onDelete: 'CASCADE'
        }
    }
});
