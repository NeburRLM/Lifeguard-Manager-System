import { EntitySchema } from 'typeorm';

export const EmployeeSchema = new EntitySchema({
    name: "employee",   // Nombre del modelo en la base de datos
    tableName: "employees",     // Nombre de la tabla en la base de datos
    columns: {      // Definición de las columnas de la tabla
        id: {    // Columna para el id del empleado
            type: "varchar",    // Tipo de datos varchar
            primary: true,  // Clave primaria
            unique: true,   // Valor único
            length: 9,  // Longitud de la cadena (DNI)
        },
        name: {     // Columna para el nombre del empleado
            type: "varchar",    // Tipo de datos varchar
            length: 100 // Longitud máxima de la cadena
        },
        role: { // Columna para el rol del empleado
            type: "enum",   // Enum
            enum: ["Boss", "Lifeguard", "Coordinator"], // Roles posibles
        },
        email: {    // Columna para el correo electrónico
            type: "varchar",    // Tipo de datos varchar
            unique: true,   // Único
            length: 100     // Longitud máxima de la cadena
        },
        password: { // Columna para la contraseña del empleado
            type: "varchar",    // Tipo de datos varchar
            length: 255 // Longitud máxima de la cadena
        },
        birthdate: {    // Columna para la fecha de nacimiento
            type: "date",  // Tipo de datos fecha
            nullable: true  // Puede ser nula
        },
        phone_number: { // Columna para el número de teléfono
            type: "varchar", // Tipo de datos varchar
            length: 15, // Longitud máxima
            unique: true,   // Es único
            nullable: true  // Puede ser nulo
        },
        hourlyRate: {   // Columna para la tarifa por hora del empleado
            type: "decimal",    // Tipo de datos decimal
            precision: 10,   // Precisión total
            scale: 2    // Número de decimales
        },
        image: {    // Columna para la imagen del empleado
            type: String,   // Tipo de datos cadena de texto
            nullable: true, // Puede ser nula
            unique: true,   // Es única
        },
         resetToken: {
            type: "varchar",
            length: 255,
            nullable: true,
         }
    },
    relations: {    // Relación con el cuadrante mensual de trabajo
        work_schedule: {
            type: 'one-to-many',    // Un empleado puede tener muchos cuadrantes de trabajo
            target: 'work_schedule',    // Relaciona con la entidad WorkSchedule
            inverseSide: 'employee',    // La otra parte de la relación
            cascade: true   // Si se elimina un empleado, sus cuadrantes de trabajo también se eliminan
        }
    }
});
