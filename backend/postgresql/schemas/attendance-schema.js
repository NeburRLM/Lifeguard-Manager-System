import { EntitySchema } from "typeorm";

export const AttendanceSchema = new EntitySchema({
    name: "attendance", // Nombre del modelo en la base de datos
    tableName: "attendances",   // Nombre de la tabla en la base de datos
    columns: {  // Definición de las columnas de la tabla
        id: {   // Columna id, identificador único de la asistencia
            type: "uuid",   // Tipo de datos UUID
            primary: true,  // Clave primaria
            generated: "uuid"   // Generación automática
        },
        date: {     // Columna para la fecha de la asistencia
            type: "date",   // Tipo de datos fecha
            nullable: false     // No puede ser nula
        },
        check_in: {     // Columna para la hora de entrada
            type: "time",   // Tipo de datos hora
            nullable: false // No puede ser nula
        },
        check_out: {    // Columna para la hora de salida
            type: "time",   // Tipo de datos hora
            nullable: true // Puede ser nulo si el turno sigue activo
        },
        employee_id: {  // Columna que hace referencia al id del empleado (FK)
            type: "varchar", // Tipo de datos varchar (cadena de texto)
            nullable: false // No puede ser nula
        },
        facility_id: {  // Columna que hace referencia al id de la instalación (FK)
            type: "varchar",  // Tipo de datos varchar
            nullable: false     // No puede ser nula
        },
        note: {  // Columna que hace referencia a la nota que puede dejar el trabajador en referencia a su horario de entrada/salida
            type: "text"
        }
    },
    relations: {    // Definición de las relaciones de la entidad
        employee: {     // Relación con la entidad Employee
            type: "many-to-one",    // Muchos registros de asistencia pueden pertenecer a un solo empleado
            target: "employee", // Relaciona con la entidad Employee
            joinColumn: {   // Define la columna que se usará para la relación
                name: "employee_id" // Nombre de la columna en la tabla de asistencia
            },
            onDelete: "CASCADE" // Si se elimina un empleado, se eliminan sus asistencias también
        },
        facility: { // Relación con la entidad Facility
            type: "many-to-one",    // Muchos registros de asistencia pueden pertenecer a una sola instalación
            target: "facility", // Relaciona con la entidad Facility
            joinColumn: {   // Define la columna que se usará para la relación
                name: "facility_id" // Nombre de la columna en la tabla de asistencia
            },
            onDelete: "CASCADE" // Si se elimina una instalación, se eliminan sus asistencias también
        }
    },
    indices: [  // Definición de los índices para mejorar el rendimiento
        {
            name: "idx_attendance_employee",    // Nombre del índice
            columns: ["employee_id"]    // Índice sobre la columna employee_id
        },
        {
            name: "idx_attendance_facility",    // Nombre del índice
            columns: ["facility_id"]    // Índice sobre la columna facility_id
        }
    ]
});
