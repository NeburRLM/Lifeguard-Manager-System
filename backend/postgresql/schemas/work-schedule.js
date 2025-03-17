import { EntitySchema } from 'typeorm';

export const WorkScheduleSchema = new EntitySchema({
    name: "work_schedule", // Nombre de la entidad (tabla) en la base de datos.
    tableName: "work_schedules", // Nombre de la tabla en la base de datos.
    columns: {
        id: {
            type: "uuid", // Tipo de datos para el campo 'id' (UUID).
            primary: true, // Marca este campo como clave primaria.
            generated: "uuid" // El valor de 'id' se genera automáticamente como un UUID.
        },
        month: {
            type: "int",  // El campo 'month' es un número entero (mes de trabajo). Los valores son de 1 a 12.
        },
        year: {
            type: "int"  // El campo 'year' es un número entero (año de trabajo).
        }
    },
    relations: {
        employee: {
            type: 'many-to-one', // Relación de "muchos a uno", un cuadrante de trabajo pertenece a un solo empleado.
            target: 'employee', // La relación se hace con la entidad 'employee'.
            joinColumn: true, // La columna de unión es la columna por defecto ('employee_id' en este caso).
            onDelete: 'CASCADE' // Si un empleado se elimina, también se eliminan los cuadrantes de trabajo asociados a él.
        },
        schedules: {
            type: 'one-to-many', // Relación de "uno a muchos", un cuadrante de trabajo puede tener múltiples horarios asociados.
            target: 'schedule', // La relación se hace con la entidad 'schedule'.
            inverseSide: 'work_schedule', // Indica que la relación inversa está en la entidad 'schedule', en el campo 'work_schedule'.
            cascade: true // Si se elimina un cuadrante de trabajo, también se eliminarán sus horarios asociados.
        }
    }
});
