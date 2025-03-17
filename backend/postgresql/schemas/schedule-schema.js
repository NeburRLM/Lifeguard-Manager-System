import { EntitySchema } from 'typeorm';

export const ScheduleSchema = new EntitySchema({
    name: "schedule",  // Nombre del modelo en la base de datos
    tableName: "schedules",  // Nombre de la tabla en la base de datos
    columns: {  // Definición de las columnas de la tabla
        id: {  // Columna id, identificador único del horario
            type: "uuid",  // Tipo de datos UUID
            primary: true,  // Es clave primaria
            generated: "uuid"  // Se genera automáticamente como UUID
        },
        date: {  // Columna que almacena la fecha del horario
            type: "date",  // Tipo de datos fecha
        },
        start_time: {  // Columna que almacena la hora de inicio del horario
            type: "time",  // Tipo de datos hora
            default: "10:00:00"  // Valor predeterminado es "10:00:00"
        },
        end_time: {  // Columna que almacena la hora de fin del horario
            type: "time",  // Tipo de datos hora
            default: "19:00:00"  // Valor predeterminado es "19:00:00"
        }
    },
    relations: {  // Definición de las relaciones con otras entidades
        work_schedule: {  // Relación con la entidad WorkSchedule
            type: 'many-to-one',  // Muchos registros de horarios pueden estar asociados a un solo cuadrante de trabajo
            target: 'work_schedule',  // Relaciona con la entidad WorkSchedule
            joinColumn: true,  // Especifica que se realiza el JOIN en esta columna
            onDelete: 'CASCADE'  // Si se elimina un cuadrante de trabajo, se eliminan también los horarios asociados
        },
        facility: {  // Relación con la entidad Facility (instalación)
            type: 'many-to-one',  // Muchos registros de horarios pueden estar asociados a una sola instalación
            target: 'facility',  // Relaciona con la entidad Facility
            joinColumn: true,  // Especifica que se realiza el JOIN en esta columna
            onDelete: 'CASCADE'  // Si se elimina una instalación, se eliminan también los horarios asociados
        }
    }
});
