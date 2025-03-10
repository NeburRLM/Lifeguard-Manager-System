import { EntitySchema } from 'typeorm';

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
            type: "int"  // 1-12
        },
        year: {
            type: "int"
        },
        total_hours: {
            type: "decimal",
            precision: 5,
            scale: 2,
            default: 0
        },
        amount: {
            type: "decimal",
            precision: 10,
            scale: 2
        },
        employee_id: {
            type: "varchar",  // Asegúrate de que sea del mismo tipo que el campo `id` de Employee
            nullable: false
        }
    },
    relations: {
        employee: {
            type: "many-to-one",
            target: "employee",
            joinColumn: {
                name: "employee_id"
            },
            onDelete: "CASCADE"
        }
    },
    uniqueConstraints: [
        {
            name: "unique_payroll_employee_month_year",
            columns: ["employee_id", "month", "year"]
        }
    ],
    indices: [
        {
            name: "idx_payroll_employee",
            columns: ["employee_id"]
        }
    ]
});
