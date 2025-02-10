import express from 'express';
import { dataSource } from './postgresql/data-source.js';
import { EmployeeSchema } from './postgresql/schemas/employee-schema.js';
import { FacilitySchema } from './postgresql/schemas/facility-schema.js';
import { WorkScheduleSchema } from './postgresql/schemas/work-schedule.js';  // Ajusta la ruta según tu proyecto
import { ScheduleSchema } from './postgresql/schemas/schedule-schema.js';  // Ajusta la ruta según tu proyecto

//import bcrypt from 'bcrypt';
//import jwt from 'jsonwebtoken';  // Para generar un token JWT
const app = express()
const port = 4000

/*app.get('/', (req, res) => {
    res.send('<html><head></head><body><h1>Hello!</h1></body></html>');
})*/

app.use(express.json());

dataSource.initialize()
    .then(() => {
        console.log("Conexión a la base de datos establecida.");
    })
    .catch((err) => {
        console.error("Error al conectar con la base de datos:", err);
    });

app.get('/employees', async (req, res) => {
    try {
        const employees = await dataSource.getRepository(EmployeeSchema)
            .createQueryBuilder("employee")
            .leftJoinAndSelect("employee.work_schedule", "work_schedule")
            .leftJoinAndSelect("work_schedule.schedules", "schedule") // Unir con schedules
            .leftJoinAndSelect("schedule.facility", "facility") // Unir con facility
            .orderBy("schedule.date", "ASC") // Ordenar los schedules por fecha (de más antiguo a más nuevo)
            .getMany();

        if (employees.length === 0) {
            return res.status(404).json({ message: 'No employees found' });
        }

        // Mapeamos los empleados para asegurarnos de que se muestren los campos de work_schedule y facility
        const employeesWithSchedules = employees.map(employee => ({
            ...employee,
            work_schedule: employee.work_schedule.map(workSchedule => ({
                ...workSchedule,
                schedules: workSchedule.schedules.map(schedule => ({
                    ...schedule,
                    //workScheduleId: workSchedule.id, // Aseguramos que usemos el ID del work_schedule
                    //facilityId: schedule.facility ? schedule.facility.id : null, // Aseguramos que usemos el ID del facility
                    //facilityName: schedule.facility ? schedule.facility.name : null // Puedes incluir más detalles si lo deseas
                }))
            }))
        }));

        res.json(employeesWithSchedules);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving employees', error: error.message });
    }
});







// Ruta para crear un nuevo empleado
app.post('/employee', async (req, res) => {
    let employees = req.body;

    // Si solo se envía un solo objeto (no un arreglo), lo convertimos en un arreglo de un solo elemento
    if (!Array.isArray(employees)) {
        employees = [employees];  // Convertir el objeto en un array
    }

    // Verificar que los datos no estén vacíos
    if (!employees || employees.length === 0) {
        return res.status(400).send("Se requiere una lista de empleados.");
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);

        for (const employee of employees) {
            const { id, name, role, email, password, birthdate, phone_number, facilityId } = employee;

            // Validar que todos los campos estén presentes
            if (!id || !name || !role || !email || !password || !birthdate || !phone_number) {
                return res.status(400).send("Todos los campos son requeridos.");
            }

            // Verificar si ya existe un empleado con el mismo dni
            const existingEmployee = await employeeRepository.findOneBy({ id });
            if (existingEmployee) {
                return res.status(409).send(`El empleado con el DNI "${id}" ya existe.`);
            }

            // Verificar si el facilityId existe en la base de datos (si se proporcionó)
            let facility = null;
            if (facilityId) {
                const facilityRepository = dataSource.getRepository(FacilitySchema);
                facility = await facilityRepository.findOne({ where: { id: facilityId } });

                // Si no existe el facilityId, retornar error
                if (!facility) {
                    return res.status(404).send("El facility con el ID proporcionado no existe.");
                }
            }

            // Crear el nuevo empleado
            const newEmployee = employeeRepository.create({
                id,
                name,
                role,
                email,
                password,
                birthdate,
                phone_number,
                facility: facility || null,  // Asignamos la instalación si existe
            });

            // Guardar el nuevo empleado en la base de datos
            await employeeRepository.save(newEmployee);
        }

        res.status(201).send("Empleados guardados correctamente.");

    } catch (error) {
        console.error("Error al guardar el empleado:", error);
        res.status(500).send("Error al guardar el empleado.");
    }
});




app.put('/employee/:id', async (req, res) => {
    const { id } = req.params;
    const { facilityId } = req.body;

    console.log("ID recibido en los parámetros:", id);  // Para verificar que estamos recibiendo el id correctamente

    if (!id || id.trim() === "") {
        return res.status(400).json({ message: "ID inválido proporcionado." });
    }

    try {
        // 1. Verificar si el empleado existe
        const employeeRepository = dataSource.getRepository(EmployeeSchema);
        const employee = await employeeRepository.findOne({ where: { id } });

        if (!employee) {
            return res.status(404).json({ message: "Empleado no encontrado." });
        }

        // 2. Verificar si el facilityId existe en la base de datos
        const facilityRepository = dataSource.getRepository(FacilitySchema);
        const facility = await facilityRepository.findOne({ where: { id: facilityId } });

        if (!facility) {
            return res.status(404).json({ message: "Facility no encontrado." });
        }

        // 3. Asignar el facility al empleado
        employee.facility = facility;

        // 4. Guardar los cambios
        await employeeRepository.save(employee);

        // 5. Devolver la respuesta
        res.status(200).json(employee);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al asignar el facility al empleado.', error: error.message });
    }
});





app.post('/facility', async (req, res) => {
    let facilities = req.body;

    // Si solo se envía un solo objeto (no un arreglo), lo convertimos en un arreglo de un solo elemento
    if (!Array.isArray(facilities)) {
        facilities = [facilities];  // Convertir el objeto en un array
    }

    // Verificar que los datos no estén vacíos
    if (!facilities || facilities.length === 0) {
        return res.status(400).send("Se requiere una lista de instalaciones.");
    }

    try {
        const facilityRepository = dataSource.getRepository(FacilitySchema);

        for (const facility of facilities) {
            const { name, location, facility_type } = facility;

            // Verificar que todos los campos estén presentes
            if (!name || !location || !facility_type) {
                return res.status(400).send("Todos los campos son obligatorios.");
            }

            // Verificar si ya existe una instalación con el mismo nombre y ubicación
            const existingFacility = await facilityRepository.findOneBy({
                name,
                location
            });

            if (existingFacility) {
                return res.status(409).send(`Ya existe una instalación con el nombre "${name}" y ubicación "${location}".`);
            }

            // Crear el nuevo facility
            await facilityRepository.save(facility);  // Guardar la instalación
        }

        res.status(201).send("Instalaciones guardadas correctamente.");

    } catch (error) {
        console.error("Error al guardar el facility:", error);
        res.status(500).send("Error al guardar el facility.");
    }
});



// Ruta para obtener todos los facilities
app.get('/facility', async (request, response) => {
    const facilitiesRepository = dataSource.getRepository(FacilitySchema);
    const facilities = await facilitiesRepository.find()
    response.json(facilities)
});

// horarios de un empleado en un día específico
app.get('/employee/:id/schedule', async (req, res) => {
    const { id } = req.params;

    try {
        const scheduleRepository = dataSource.getRepository(ScheduleSchema);
        // Buscar el schedule para el empleado con el id proporcionado
        const employeeSchedule = await scheduleRepository.find({
            where: { employee: { id } },
            relations: ['work_schedule', 'facility']  // También puedes obtener las relaciones con WorkSchedule y Facility
        });

        if (employeeSchedule.length === 0) {
            return res.status(404).send("No hay horarios para este empleado.");
        }

        res.status(200).json(employeeSchedule);
    } catch (error) {
        console.error("Error al obtener los horarios:", error);
        res.status(500).send("Error al obtener los horarios.");
    }
});




app.post('/work-schedule/:workScheduleId/schedules', async (req, res) => {
    const { workScheduleId } = req.params;
    const { schedules } = req.body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({ message: "Debes enviar al menos un horario válido." });
    }

    try {
        const workScheduleRepository = dataSource.getRepository(WorkScheduleSchema);
        const scheduleRepository = dataSource.getRepository(ScheduleSchema);
        const facilityRepository = dataSource.getRepository(FacilitySchema); // Repositorio para Facility

        // Verificar si el cuadrante mensual existe
        const workSchedule = await workScheduleRepository.findOne({ where: { id: workScheduleId } });

        if (!workSchedule) {
            return res.status(404).json({ message: "Cuadrante mensual no encontrado." });
        }

        // Validar que todos los horarios coincidan con el mes y año del work_schedule
        const invalidSchedules = schedules.filter(schedule => {
            const scheduleMonth = new Date(schedule.date).getMonth() + 1; // El mes de la fecha del horario (getMonth devuelve 0-11)
            return scheduleMonth !== workSchedule.month;  // Compara el mes con el mes del work_schedule
        });

        if (invalidSchedules.length > 0) {
            return res.status(400).json({
                message: "Algunos horarios no coinciden con el mes del cuadrante mensual.",
                invalidSchedules
            });
        }

        // Crear los horarios con los valores proporcionados en la petición
        const schedulesToSave = await Promise.all(schedules.map(async schedule => {
            // Buscar la instalación correspondiente (facility)
            const facility = await facilityRepository.findOne({ where: { id: schedule.facilityId } });

            if (!facility) {
                throw new Error(`Instalación con ID ${schedule.facilityId} no encontrada.`);
            }

            // Devolver el objeto horario con las relaciones completas
            return {
                id: crypto.randomUUID(),
                date: schedule.date,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                work_schedule: workSchedule,  // Relación completa con WorkSchedule
                facility: facility  // Relación completa con Facility
            };
        }));

        console.log("Horarios a guardar:", schedulesToSave); // Agrega esto para depurar

        // Guardar los horarios en la base de datos
        await scheduleRepository.save(schedulesToSave);

        res.status(201).json({ message: "Horarios creados exitosamente", schedules: schedulesToSave });
    } catch (error) {
        console.error("Error al crear los horarios:", error);
        res.status(500).json({ message: "Error al crear los horarios.", error: error.message });
    }
});







 app.get('/employee/:id/work-schedule', async (req, res) => {
     const { id } = req.params;

     try {
         const workScheduleRepository = dataSource.getRepository(WorkScheduleSchema);
         // Buscar los work schedules del empleado
         const workSchedules = await workScheduleRepository.find({
             where: { employee: { id } },
             relations: ['schedules']  // También puedes obtener los schedules relacionados
         });

         if (workSchedules.length === 0) {
             return res.status(404).send("No hay cuadrante mensual para este empleado.");
         }

         res.status(200).json(workSchedules);
     } catch (error) {
         console.error("Error al obtener el cuadrante mensual:", error);
         res.status(500).send("Error al obtener el cuadrante mensual.");
     }
 });



app.post('/employee/:id/work-schedule', async (req, res) => {
    const { id } = req.params;
    const { month, year, schedules } = req.body;

    // Validar que todos los campos estén presentes
    if (!month || !year || !schedules) {
        return res.status(400).send("Todos los campos son requeridos.");
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);
        const employee = await employeeRepository.findOne({ where: { id } });

        if (!employee) {
            return res.status(404).send("Empleado no encontrado.");
        }

        const workScheduleRepository = dataSource.getRepository(WorkScheduleSchema);

        // Verificar si ya existe el cuadrante mensual para el mes y año proporcionado
        const existingWorkSchedule = await workScheduleRepository.findOne({
            where: { month, year, employee: { id } }
        });

        if (existingWorkSchedule) {
            return res.status(409).send("Ya existe un cuadrante mensual para este empleado en ese mes y año.");
        }

        // Crear el nuevo cuadrante mensual
        const newWorkSchedule = workScheduleRepository.create({
            month,
            year,
            employee,
            schedules // Los horarios diarios asociados
        });

        // Guardar el nuevo cuadrante mensual
        await workScheduleRepository.save(newWorkSchedule);
        res.status(201).json(newWorkSchedule);
    } catch (error) {
        console.error("Error al crear el cuadrante mensual:", error);
        res.status(500).send("Error al crear el cuadrante mensual.");
    }
});




// Ruta para modificar el facility asignado a un horario específico
app.put('/schedule/:id/facility', async (req, res) => {
    const { id } = req.params;
    const { facilityId } = req.body;

    try {
        const scheduleRepository = dataSource.getRepository(ScheduleSchema);
        const facilityRepository = dataSource.getRepository(FacilitySchema);

        // Verificar si el horario existe
        const schedule = await scheduleRepository.findOne({ where: { id } });
        if (!schedule) {
            return res.status(404).send("Horario no encontrado.");
        }

        // Verificar si la instalación existe
        const facility = await facilityRepository.findOne({ where: { id: facilityId } });
        if (!facility) {
            return res.status(404).send("Facility no encontrado.");
        }

        // Actualizar el facility asignado al horario
        schedule.facility = facility;
        await scheduleRepository.save(schedule);
        res.status(200).json(schedule);
    } catch (error) {
        console.error("Error al modificar el facility del horario:", error);
        res.status(500).send("Error interno del servidor.");
    }
});

// Ruta para modificar el horario de un empleado en un día específico
app.put('/schedule/:id/time', async (req, res) => {
    const { id } = req.params;
    const { start_time, end_time } = req.body;

    try {
        const scheduleRepository = dataSource.getRepository(ScheduleSchema);

        // Verificar si el horario existe
        const schedule = await scheduleRepository.findOne({ where: { id } });
        if (!schedule) {
            return res.status(404).send("Horario no encontrado.");
        }

        // Actualizar el horario
        schedule.start_time = start_time;
        schedule.end_time = end_time;
        await scheduleRepository.save(schedule);

        res.status(200).json(schedule);
    } catch (error) {
        console.error("Error al modificar el horario:", error);
        res.status(500).send("Error interno del servidor.");
    }
});

















//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//LOGIN/////////////////
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validar que se haya enviado email y password
    if (!email || !password) {
        return res.status(400).send("Email y contraseña son requeridos.");
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);

        // Buscar al empleado por email
        const employee = await employeeRepository.findOne({ where: { email } });

        if (!employee) {
            return res.status(404).send("Empleado no encontrado.");
        }

        // Verificar que la contraseña sea correcta (asegúrate de usar alguna librería de encriptación como bcrypt)
        if (employee.password !== password) {
            return res.status(401).send("Contraseña incorrecta.");
        }

        // Verificar el rol del empleado
        if (employee.role !== "Boss") {
            return res.status(403).send("No tienes acceso al sistema.");
        }

        // Aquí puedes crear un token de sesión o JWT si usas autenticación basada en token
        res.status(200).send("Login exitoso.");
    } catch (error) {
        console.error("Error al autenticar al empleado:", error);
        res.status(500).send("Error al autenticar al empleado.");
    }
});






app.post('/login', async (req, res) => {
    const { dni, password } = req.body;

    // Validar que ambos campos (DNI y contraseña) estén presentes
    if (!dni || !password) {
        return res.status(400).send("El DNI y la contraseña son requeridos.");
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);

        // Buscar al empleado con el DNI proporcionado
        const employee = await employeeRepository.findOne({ where: { id: dni } });
        if (!employee) {
            return res.status(404).send("Empleado no encontrado.");
        }

        // Verificar la contraseña con bcrypt
        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            return res.status(401).send("Contraseña incorrecta.");
        }

        // Verificar si el empleado es el Jefe
        if (employee.role !== "Jefe") {
            return res.status(403).send("Acceso denegado. Solo el Jefe puede acceder al sistema.");
        }

        // Si la contraseña es válida y el rol es Jefe, generar un token JWT para la sesión
        const token = jwt.sign(
            { id: employee.id, role: employee.role },
            'tu_clave_secreta', // La clave secreta para firmar el token
            { expiresIn: '1h' }  // El token expirará en 1 hora
        );

        // Enviar el token como respuesta
        res.status(200).json({ message: 'Inicio de sesión exitoso', token });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).send("Error en el servidor.");
    }
});





app.listen(port, async () => {
    console.log(`Listening port: ${port}`)
})