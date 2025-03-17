import { EntitySchema } from 'typeorm';

export const PayrollSchema = new EntitySchema({
    name: "payroll",  // Nombre del modelo en la base de datos
    tableName: "payrolls",  // Nombre de la tabla en la base de datos
    columns: {  // Definición de las columnas de la tabla
        id: {  // Columna id, identificador único de la nómina
            type: "uuid",  // Tipo de datos UUID
            primary: true,  // Es clave primaria
            generated: "uuid"  // Se genera automáticamente como UUID
        },
        month: {  // Columna que almacena el mes de la nómina (1-12)
            type: "int",  // Tipo de datos entero
        },
        year: {  // Columna que almacena el año de la nómina
            type: "int",  // Tipo de datos entero
        },
        total_hours: {  // Columna que almacena el total de horas trabajadas en el mes
            type: "decimal",  // Tipo de datos decimal
            precision: 5,  // Precisión total (cantidad total de dígitos)
            scale: 2,  // Escala (dígitos después del punto decimal)
            default: 0  // Valor predeterminado es 0
        },
        amount: {  // Columna que almacena el monto total de la nómina
            type: "decimal",  // Tipo de datos decimal
            precision: 10,  // Precisión total (10 dígitos en total)
            scale: 2,  // Escala (2 dígitos después del punto decimal)
        },
        employee_id: {  // Columna que almacena el id del empleado asociado a la nómina
            type: "varchar",  // Tipo de datos cadena de caracteres
            nullable: false  // No puede ser nulo, ya que cada nómina debe estar asociada a un empleado
        }
    },
    relations: {  // Definición de las relaciones con otras entidades
        employee: {  // Relación con la entidad Employee (empleado)
            type: "many-to-one",  // Muchos registros de nómina pueden estar asociados a un solo empleado
            target: "employee",  // Relaciona con la entidad Employee
            joinColumn: {  // Especifica la columna para realizar el JOIN
                name: "employee_id"  // La columna `employee_id` es la clave foránea
            },
            onDelete: "CASCADE"  // Si se elimina un empleado, también se eliminan sus registros de nómina
        }
    },
    uniqueConstraints: [  // Restricciones únicas para evitar duplicados
        {
            name: "unique_payroll_employee_month_year",  // Nombre de la restricción única
            columns: ["employee_id", "month", "year"]  // Asegura que un empleado solo tenga un registro de nómina por mes y año
        }
    ],
    indices: [  // Índices para mejorar el rendimiento en las consultas
        {
            name: "idx_payroll_employee",  // Nombre del índice
            columns: ["employee_id"]  // El índice se crea sobre la columna `employee_id`
        }
    ]
});
