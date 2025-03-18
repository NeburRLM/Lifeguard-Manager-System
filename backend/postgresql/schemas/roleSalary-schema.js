import { EntitySchema } from "typeorm";

export const RoleSalarySchema = new EntitySchema({
    name: "role_salary",
    tableName: "role_salaries",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        role: { type: "varchar", unique: true }, // Rol del empleado (ej: "Lifeguard")
        base_salary: { type: "decimal", precision: 10, scale: 2 }, // Sueldo base
        earnings: { type: "json", nullable: false }, // 🔹 Guardar earnings como JSON
        deductions: { type: "json", nullable: false } // 🔹 Guardar deductions como JSON
    }
});
