import express from 'express';
import { dataSource } from './postgresql/data-source.js';
import { EmployeeSchema } from './postgresql/schemas/employee-schema.js';
import { FacilitySchema } from './postgresql/schemas/facility-schema.js';
import { WorkScheduleSchema } from './postgresql/schemas/work-schedule.js';
import { ScheduleSchema } from './postgresql/schemas/schedule-schema.js';
import { IncidentSchema } from './postgresql/schemas/incident-schema.js';
import { PayrollSchema } from './postgresql/schemas/payroll-schema.js';
import { AttendanceSchema } from './postgresql/schemas/attendance-schema.js';
import { Between } from 'typeorm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url'
const app = express()
const port = 4000

app.use(cookieParser())     // Configura el middleware para parsear cookies
dotenv.config();    // Configura dotenv para cargar variables de entorno desde un archivo '.env' (token)

// Asignación de las variables __filename y __dirname necesarias para trabajar con rutas absolutas en módulos ECMAScript
const __filename = fileURLToPath(import.meta.url);  // Convierte la URL del módulo actual a un path de archivo
const __dirname = path.dirname(__filename); // Obtiene el directorio de trabajo desde __filename

// Configuración para servir archivos estáticos desde la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());    // Middleware para analizar solicitudes con cuerpo en formato JSON

// Middleware para configurar cabeceras de CORS (Cross-Origin Resource Sharing)
// Esto permite que las solicitudes de un dominio diferente, como 'http://localhost:3000', accedan a la API
app.use((request, response, next) => {
    response.header('Access-Control-Allow-Origin', 'http://localhost:3000');    // Permite solicitudes desde localhost:3000
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');  // Permite los encabezados Content-Type y Authorization
    response.header('Access-Control-Allow-Credentials', 'true');    // Permite el envío de cookies con las solicitudes
    response.header('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE');  // Permite los métodos HTTP especificados

    // Configuración Content-Security-Policy
    //response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self'; script-src 'self';");
    next(); // Pasa el control al siguiente middleware
});

// Inicializa la conexión a la base de datos usando un 'dataSource' previamente configurado
dataSource.initialize()
    .then(() => {
        console.log("Conexión a la base de datos establecida.");    // Conexión exitosa
    })
    .catch((err) => {
        console.error("Error al conectar con la base de datos:", err);  // Conexión invalidada
    });


// Middleware de autenticación para verificar el token JWT (JSON Web Tokens)
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Obtener el token desde el encabezado 'Authorization'
    // Si no hay token, responde con un error 401
    if (!token) {
        return res.status(401).send("Token no proporcionado.");
    }

    // Verifica la validez del token usando la clave secreta definida en las variables de entorno
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            // Si el token es inválido o expiró, responde con un error 401
            return res.status(401).json({ message: "Token inválido o expirado." });
        }
        // Si el token es válido, decodifica el token y guarda la información en 'req.user'
        req.user = decoded;
        next();  // Continuar con la solicitud si el token es válido
    });
};


// Configuración de multer para guardar imágenes en la carpeta "uploads"
const storage = multer.diskStorage({
    destination: "uploads/", // Carpeta donde se guardarán las imágenes subidas
    filename: (req, file, cb) => {
        // Renombra el archivo usando un timestamp (para evitar nombres de archivo duplicados)
        cb(null, Date.now() + path.extname(file.originalname)); // 'Date.now()' genera un nombre único basado en la hora actual
    }
});
// Crea el objeto 'upload' utilizando la configuración definida para Multer
const upload = multer({ storage }); // 'storage' especifica cómo se guardarán los archivos


// Ruta para subir la imagen de un empleado
app.post('/employee/upload/:id', authenticateToken, upload.single("image"), async (req, res) => {
    try {
        const employeeId = req.params.id;   // Obtiene el 'id' del empleado desde los parámetros de la ruta
        const employeeRepository = dataSource.getRepository(EmployeeSchema);    // Obtiene el repositorio de la entidad 'EmployeeSchema' para interactuar con la base de datos

        // Verificar si el empleado existe en la base de datos
        const employee = await employeeRepository.findOneBy({ id: employeeId });
        if (!employee) {
             // Si el empleado no existe, responde con un error 404 (no encontrado)
            return res.status(404).send(`No se encontró ningún empleado con el ID "${employeeId}".`);
        }
        // Verificar si se subió una imagen en la solicitud
        if (!req.file) {
            return res.status(400).send("No se ha subido ninguna imagen."); // Si no se subió ningún archivo, responde con un error 400 (solicitud incorrecta)
        }

        // Crear la URL pública de la imagen. Asume que las imágenes se sirven desde '/uploads/'
        const imageUrl = `http://localhost:4000/uploads/${req.file.filename}`;

        // Actualizar el campo 'image' del empleado con la URL de la imagen
        employee.image = imageUrl;
        await employeeRepository.save(employee);    // Guardar los cambios en la base de datos
        // Responder con un mensaje exitoso y los datos del empleado actualizado
        res.status(200).json({ message: "Imagen subida correctamente", employee });

    } catch (error) {
        // Si ocurre algún error durante el proceso, captura el error y responde con un mensaje de error
        console.error("Error al subir la imagen:", error);
        res.status(500).send("Error interno al subir la imagen.");
    }
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


app.get('/employee/:id', async (req, res) => {
    const { id } = req.params; // Obtenemos el ID del empleado de la URL

    try {
        // Buscar solo el empleado con el ID proporcionado
        const employee = await dataSource.getRepository(EmployeeSchema)
            .createQueryBuilder("employee")
            .leftJoinAndSelect("employee.work_schedule", "work_schedule")
            .leftJoinAndSelect("work_schedule.schedules", "schedule") // Unir con schedules
            .leftJoinAndSelect("schedule.facility", "facility") // Unir con facility
            .where("employee.id = :id", { id }) // Filtrar por el ID del empleado
            .orderBy("schedule.date", "ASC") // Ordenar los schedules por fecha (de más antiguo a más nuevo)
            .getOne(); // Usamos getOne() para obtener solo un registro

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Mapeamos los detalles del empleado para asegurarnos de que se muestren los campos necesarios
        const employeeWithSchedules = {
            ...employee,
            work_schedule: employee.work_schedule.map(workSchedule => ({
                ...workSchedule,
                schedules: workSchedule.schedules.map(schedule => ({
                    ...schedule,
                    facilityId: schedule.facility ? schedule.facility.id : null, // ID de la instalación
                    facilityName: schedule.facility ? schedule.facility.name : null, // Nombre de la instalación
                    facilityLocation: schedule.facility ? schedule.facility.location : null, // Ubicación de la instalación
                    // Puedes incluir más detalles según lo que necesites
                }))
            }))
        };

        res.json(employeeWithSchedules); // Enviar la información del empleado con sus horarios y detalles asociados
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving employee', error: error.message });
    }
});





// Ruta para obtener el número total de empleados con los roles "Lifeguard" y "Coordinator"
app.get('/employeeCount', async (req, res) => {
    try {
        // Contamos los empleados que tienen el rol "Lifeguard" o "Coordinator"
        const employeeCount = await dataSource.getRepository(EmployeeSchema)
            .createQueryBuilder("employee")
            .where("employee.role IN (:...roles)", { roles: ["Lifeguard", "Coordinator"] })
            .getCount(); // Contamos el número de registros que coinciden con los roles

        // Responder con el conteo de empleados
        res.json({ employee: employeeCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving employee count', error: error.message });
    }
});

// Ruta para obtener el número total de empleados con el rol "Boss"
app.get('/bossCount', async (req, res) => {
    try {
        // Contamos los empleados que tienen el rol "Boss"
        const bossCount = await dataSource.getRepository(EmployeeSchema)
            .createQueryBuilder("employee")
            .where("employee.role = :role", { role: "Boss" })
            .getCount(); // Contamos el número de registros que coinciden con el rol

        // Responder con el conteo de jefes
        res.json({ boss: bossCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving boss count', error: error.message });
    }
});













function calculateAmount(role) {
    switch (role) {
        case "Boss":
            return 30.00; // Ejemplo: sueldo por hora del jefe
        case "Coordinator":
            return 20.00; // Ejemplo: sueldo por hora de un coordinador
        case "Lifeguard":
            return 15.00; // Ejemplo: sueldo por hora de un socorrista
        default:
            return 10.00; // Sueldo por hora por defecto
    }
}



// Ruta para crear un nuevo empleado
app.post('/employee', authenticateToken, async (req, res) => {
    let employees = req.body;

    // Si solo se envía un solo objeto (no un arreglo), lo convertimos en un arreglo de un solo elemento
    if (!Array.isArray(employees)) {
        employees = [employees];  // Convertir el objeto en un array
    }

    // Verificar que los datos no estén vacíos
    if (!employees || employees.length === 0) {
        return res.status(400).json({
            status: "Error",
            message: "Se requiere una lista de empleados."
        });
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);

        for (const employee of employees) {
            const { id, name, role, email, password, birthdate, phone_number, facilityId, image } = employee;

            // Usamos el id (DNI) como la contraseña en texto plano
            const rawPassword = id;  // El DNI es la contraseña

            // Encriptar la contraseña antes de guardarla en la base de datos
            const hashedPassword = await bcrypt.hash(rawPassword, 10);

            // Validar que todos los campos estén presentes
            if (!id || !name || !role || !email || !birthdate || !phone_number) {
                return res.status(400).json({
                    status: "Error",
                    message: "Todos los campos son requeridos."
                });
            }

            // Verificar si ya existe un empleado con el mismo dni
            const existingEmployee = await employeeRepository.findOneBy({ id });
            if (existingEmployee) {
                return res.status(409).json({
                    status: "Error",
                    message: `El empleado con el DNI "${id}" ya existe.`
                });
            }

            // Verificar si ya existe un empleado con el mismo correo electrónico
                        const existingEmail = await employeeRepository.findOneBy({ email });
                        if (existingEmail) {
                            return res.status(409).json({
                                status: "Error",
                                message: `El empleado con el correo "${email}" ya existe.`
                            });
                        }

            // Verificar si el facilityId existe en la base de datos (si se proporcionó)
            let facility = null;
            if (facilityId) {
                const facilityRepository = dataSource.getRepository(FacilitySchema);
                facility = await facilityRepository.findOne({ where: { id: facilityId } });

                // Si no existe el facilityId, retornar error
                if (!facility) {
                    return res.status(404).json({
                        status: "Error",
                        message: "El facility con el ID proporcionado no existe."
                    });
                }
            }

            // Crear el nuevo empleado
            const newEmployee = employeeRepository.create({
                id,
                name,
                role,
                email,
                password: hashedPassword,
                birthdate,
                phone_number,
                hourlyRate: calculateAmount(role),
                //facility: facility || null,  // Asignamos la instalación si existe
            });

            // Guardar el nuevo empleado en la base de datos
            await employeeRepository.save(newEmployee);
        }

        res.status(201).json({
            status: "Success",
            message: "Empleados guardados correctamente."
        });

    } catch (error) {
        console.error("Error al guardar el empleado:", error);
        res.status(500).json({
            status: "Error",
            message: "Error al guardar el empleado."
        });
    }
});



app.delete('/employee/:id', authenticateToken, async (req, res) => {
  const { id } = req.params; // Obtenemos el id del empleado desde los parámetros de la URL

  try {
    const employeeRepository = dataSource.getRepository(EmployeeSchema);

    // Verificar si el empleado existe
    const employee = await employeeRepository.findOne({ where: { id } });

    if (!employee) {
      return res.status(404).send(`Empleado con ID ${id} no encontrado.`);
    }

    // Eliminar el empleado
    await employeeRepository.remove(employee);

    // Respuesta exitosa
    res.status(200).send(`Empleado con ID ${id} eliminado correctamente.`);
  } catch (error) {
    console.error("Error al eliminar el empleado:", error);
    res.status(500).send("Error al eliminar el empleado.");
  }
});


/*app.put('/employee/:id', async (req, res) => {
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
*/



// Ruta para actualizar los datos de un empleado (incluyendo la imagen)
app.put('/employee/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, birthdate, phone_number, hourlyRate } = req.body;

  try {
    const employeeRepository = dataSource.getRepository(EmployeeSchema);
    const scheduleRepository = dataSource.getRepository(WorkScheduleSchema);

    const employee = await employeeRepository.findOneBy({ id });
    if (!employee) {
      return res.status(404).send(`No se encontró ningún empleado con el ID "${id}".`);
    }

    // Actualizar los campos de texto
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (role) employee.role = role;
    if (birthdate) employee.birthdate = birthdate;
    if (phone_number) employee.phone_number = phone_number;
    if (hourlyRate) employee.hourlyRate = hourlyRate;

    // Aquí podrías agregar más lógica si necesitas manejar imágenes de otra manera
    // Si tienes un campo 'image', también podrías actualizarlo aquí
    if (req.body.image) {
      const imagePath = req.body.image;  // Aquí puedes recibir la URL de la imagen directamente
      employee.image = imagePath;
    }
    else
    {
        employee.image = null;
    }

    // Guardar los datos del empleado
    await employeeRepository.save(employee);

    res.status(200).json({
      message: "Empleado actualizado correctamente",
      employee,
    });
  } catch (error) {
    console.error("Error al actualizar los datos del empleado:", error);
    res.status(500).send("Error interno al actualizar los datos del empleado.");
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
        return res.status(400).json({ message: "Se requiere una lista de instalaciones." });
    }

    try {
        const facilityRepository = dataSource.getRepository(FacilitySchema);

        for (const facility of facilities) {
            const { name, location, facility_type, latitude, longitude } = facility;

            // Verificar que todos los campos esenciales estén presentes
            if (!name || !location || !facility_type || !latitude || !longitude) {
                return res.status(400).json({
                    status: "Error",
                    message: "Todos los campos son obligatorios."
                });
            }

            // Verificar si ya existe una instalación con el mismo nombre y ubicación
            const existingFacilityN = await facilityRepository.findOneBy({
                name,
                location
            });
            const existingFacilityLL = await facilityRepository.findOneBy({
                latitude,
                longitude
            });

            if (existingFacilityN) {
                return res.status(409).json({
                    status: "Error",
                    message: `Ya existe una instalación con el nombre "${name}" y ubicación "${location}".`
                });
            }

            // Verificar que las coordenadas sean correctas si están presentes
            if (latitude && longitude) {
                // Verificar que las coordenadas sean números
                if (isNaN(latitude) || isNaN(longitude)) {
                    return res.status(400).json({ // Código 400 porque es error de datos de entrada
                        status: "Error",
                        message: "Las coordenadas de latitud y longitud deben ser números."
                    });
                }
            }

            if (existingFacilityLL) {
                return res.status(409).json({
                    status: "Error",
                    message: `Ya existe una instalación en las coordenadas "${latitude}", "${longitude}".`
                });
            }



            // Crear el nuevo facility con las coordenadas si están presentes
            const newFacility = {
                name,
                location,
                facility_type,
                latitude,
                longitude
            };

            // Guardar la instalación
            await facilityRepository.save(newFacility);
        }

        res.status(201).json({
            status: "Success",
            message: "Instalaciones guardadas correctamente."
        });

    } catch (error) {
        console.error("Error al guardar el facility:", error);
        res.status(500).json({
            status: "Error",
            message: "Error al guardar el facility."
        });
    }
});





// Ruta para obtener todos los facilities
app.get('/facility', async (request, response) => {
    const facilitiesRepository = dataSource.getRepository(FacilitySchema);
    const facilities = await facilitiesRepository.find()
    response.json(facilities)
});


app.get('/facility/:id', async (request, response) => {
    const { id } = request.params;  // Obtén el id de la URL
    const facilitiesRepository = dataSource.getRepository(FacilitySchema);

    try {
        // Buscar la facility con el id especificado
        const facility = await facilitiesRepository.findOne({ where: { id } });

        if (!facility) {
            return response.status(404).json({ message: 'Facility not found' });
        }

        response.json(facility);
    } catch (error) {
        response.status(500).json({ message: 'Error retrieving the facility', error: error.message });
    }
});


app.delete('/facility/:id', async (request, response) => {
    const { id } = request.params;

    try {
        const facilitiesRepository = dataSource.getRepository(FacilitySchema);

        // Buscar la facility en la base de datos
        const facility = await facilitiesRepository.findOne({ where: { id } });

        if (!facility) {
            return response.status(404).json({ message: "Facility not found" });
        }

        // Eliminar la facility
        await facilitiesRepository.remove(facility);

        return response.json({ message: "Facility eliminada correctamente" });
    } catch (error) {
        console.error("Error deleting facility:", error);
        return response.status(500).json({ message: "Error deleting facility" });
    }
});





app.put('/facility/:id', async (req, res) => {
    const { id } = req.params;
    const { name, location, facility_type, latitude, longitude } = req.body;

    // Verificar que el ID es válido
    if (!id) {
        return res.status(400).json({ message: "Se requiere un ID de instalación válido." });
    }

    // Verificar que todos los campos esenciales están presentes
    if (!name || !location || !facility_type || !latitude || !longitude) {
        return res.status(400).json({
            status: "Error",
            message: "Todos los campos son obligatorios."
        });
    }

    try {
        const facilityRepository = dataSource.getRepository(FacilitySchema);

        // Buscar la instalación a actualizar
        const existingFacility = await facilityRepository.findOneBy({ id });

        if (!existingFacility) {
            return res.status(404).json({
                status: "Error",
                message: `No se encontró ninguna instalación con el ID ${id}.`
            });
        }

        // Verificar que las coordenadas sean números válidos
        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                status: "Error",
                message: "Las coordenadas de latitud y longitud deben ser números."
            });
        }

        // Actualizar los valores
        existingFacility.name = name;
        existingFacility.location = location;
        existingFacility.facility_type = facility_type;
        existingFacility.latitude = latitude;
        existingFacility.longitude = longitude;

        // Guardar los cambios
        await facilityRepository.save(existingFacility);

        res.status(200).json({
            status: "Success",
            message: "Instalación actualizada correctamente."
        });

    } catch (error) {
        console.error("Error al actualizar la instalación:", error);
        res.status(500).json({
            status: "Error",
            message: "Error al actualizar la instalación."
        });
    }
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

// Backend - Ruta para obtener el número total de facilities

app.get('/facilityCount', async (req, res) => {
    try {
        const facilityCount = await dataSource.getRepository(FacilitySchema)
            .createQueryBuilder("facility")
            .getCount();

        res.json({ facility: facilityCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving facilities count', error: error.message });
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

        // Verificar si el mes y año son del pasado
        const currentDate = new Date();
        const selectedDate = new Date(year, month - 1); // Los meses en JS empiezan en 0

        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        // Verificar si el mes y año seleccionado son en el pasado
        if (year < currentYear || (year === currentYear && month < currentMonth + 1)) {
            return res.status(400).send("No se puede crear un cuadrante para un mes/año pasado.");
        }

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


app.put('/employee/:employeeId/work_schedule/:workScheduleId/schedule/:scheduleId', async (req, res) => {
    const { employeeId, workScheduleId, scheduleId } = req.params;
    const { start_time, end_time, facilityId } = req.body;

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);
        const scheduleRepository = dataSource.getRepository(ScheduleSchema);
        const facilityRepository = dataSource.getRepository(FacilitySchema);

        // Cargar el empleado con su work_schedule y schedules
        const employee = await employeeRepository.findOne({
            where: { id: employeeId },
            relations: ['work_schedule', 'work_schedule.schedules']  // Cargar las schedules dentro del work_schedule
        });

        if (!employee) {
            return res.status(404).send("Empleado no encontrado.");
        }

        // Buscar el work_schedule por su ID
        const workSchedule = employee.work_schedule.find(ws => ws.id === workScheduleId);

        if (!workSchedule) {
            return res.status(404).send("Work schedule no encontrado.");
        }

        // Buscar el horario dentro del work_schedule usando el scheduleId
        const schedule = workSchedule.schedules.find(s => s.id === scheduleId);

        if (!schedule) {
            return res.status(404).send("Horario no encontrado dentro del work schedule.");
        }

        // Actualizar los valores del horario
        if (start_time) schedule.start_time = start_time;
        if (end_time) schedule.end_time = end_time;

        // Buscar la instalación por el ID y actualizarla
        if (facilityId) {
            const facility = await facilityRepository.findOne({ where: { id: facilityId } });
            if (!facility) {
                return res.status(404).send("Facility no encontrado.");
            }
            schedule.facility = facility;  // Actualizamos la instalación del evento
        }

        // Guardar el horario actualizado
        await scheduleRepository.save(schedule);

        // Devolver el horario actualizado
        res.status(200).json(schedule);

    } catch (error) {
        console.error("Error al modificar el horario:", error);
        res.status(500).send("Error interno del servidor.");
    }
});




app.delete('/employee/:employeeId/work_schedule/:workScheduleId', async (req, res) => {
  const { employeeId, workScheduleId } = req.params;

  try {
    // Paso 1: Buscar al empleado y su relación con el cuadrante de trabajo (con sus schedules)
    const employee = await dataSource.getRepository(EmployeeSchema)
      .createQueryBuilder("employee")
      .leftJoinAndSelect("employee.work_schedule", "work_schedule")
      .leftJoinAndSelect("work_schedule.schedules", "schedule") // Traemos los schedules asociados
      .where("employee.id = :employeeId", { employeeId })
      .andWhere("work_schedule.id = :workScheduleId", { workScheduleId })
      .getOne();

    if (!employee) {
      return res.status(404).json({ message: 'Empleado o cuadrante de trabajo no encontrado' });
    }

    // Paso 2: Eliminar el work_schedule (esto eliminará automáticamente los schedules debido al 'cascade' configurado)
    await dataSource.getRepository(WorkScheduleSchema)
      .createQueryBuilder()
      .delete()
      .where("id = :workScheduleId", { workScheduleId })
      .execute();

    return res.status(200).json({ message: 'Cuadrante de trabajo y sus schedules eliminados exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el cuadrante de trabajo', error: error.message });
  }
});













app.post('/incident', async (req, res) => {
    const { type, description, facilityId, reportedById } = req.body;

    // Validar los datos requeridos
    if (!type || !description || !facilityId || !reportedById) {
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }

    // Validar que el tipo de incidente sea uno de los valores permitidos
    const validIncidentTypes = [
        "Heridas en la piel y cortes",
        "Picaduras de medusa",
        "Picaduras de pez araña",
        "Picadura desconocida",
        "Quemaduras solares",
        "Golpes de calor",
        "Ahogamiento en la playa",
        "Atragantamiento",
        "Insolación"
    ];

    if (!validIncidentTypes.includes(type)) {
        return res.status(400).json({ message: "Tipo de incidente no válido." });
    }

    try {
        const facilityRepository = dataSource.getRepository(FacilitySchema);
        const employeeRepository = dataSource.getRepository(EmployeeSchema);

        // Buscar la instalación y el empleado
        const facility = await facilityRepository.findOne({ where: { id: facilityId } });
        const employee = await employeeRepository.findOne({ where: { id: reportedById } });

        if (!facility) {
            return res.status(404).json({ message: "Instalación no encontrada." });
        }
        if (!employee) {
            return res.status(404).json({ message: "Empleado no encontrado." });
        }

        // Crear el incidente
        const incidentRepository = dataSource.getRepository(IncidentSchema);

        const newIncident = incidentRepository.create({
            type,
            description,
            facility,  // Asociamos la instalación
            reported_by: employee  // Asociamos al empleado que reporta
        });

        // Guardar el incidente en la base de datos
        await incidentRepository.save(newIncident);

        res.status(201).json(newIncident);
    } catch (error) {
        console.error("Error al crear el incidente:", error);
        res.status(500).json({ message: "Error al crear el incidente.", error: error.message });
    }
});





// GET para obtener todos los incidentes
app.get('/incidents', async (req, res) => {
    try {
        const incidentRepository = dataSource.getRepository(IncidentSchema);

        // Obtener todos los incidentes, con sus relaciones
        const incidents = await incidentRepository.find({
            relations: ['facility', 'reported_by']  // Incluir las relaciones de facility y reported_by
        });

        if (incidents.length === 0) {
            return res.status(404).json({ message: 'No incidents found' });
        }

        res.status(200).json(incidents);
    } catch (error) {
        console.error("Error al obtener los incidentes:", error);
        res.status(500).json({ message: "Error al obtener los incidentes.", error: error.message });
    }
});


app.get('/facility/:facilityId/incidents', async (req, res) => {
    const { facilityId } = req.params;

    try {
        const incidentRepository = dataSource.getRepository(IncidentSchema);

        const incidents = await incidentRepository.find({
            where: { facility: { id: facilityId } },
            relations: ['facility', 'reported_by'],
        });

        if (incidents.length === 0) {
            return res.status(404).json({ message: "No se encontraron incidencias para esta instalación." });
        }

        res.status(200).json(incidents);
    } catch (error) {
        console.error("Error al obtener las incidencias:", error);
        res.status(500).json({ message: "Error al obtener las incidencias.", error: error.message });
    }
});




app.get('/incidents/type/:type', async (req, res) => {
    const { type } = req.params;  // Obtenemos el tipo de incidente desde la URL

    // Lista de tipos de incidentes válidos
    const validIncidentTypes = [
        "Heridas en la piel y cortes",
        "Picaduras de medusa",
        "Picaduras de pez araña",
        "Picadura desconocida",
        "Quemaduras solares",
        "Golpes de calor",
        "Ahogamiento en la playa",
        "Atragantamiento",
        "Insolación"
    ];

    // Verificamos si el tipo de incidente es válido
    if (!validIncidentTypes.includes(type)) {
        return res.status(400).json({ message: "Tipo de incidente no válido." });
    }

    try {
        const incidentRepository = dataSource.getRepository(IncidentSchema);

        // Buscamos los incidentes filtrados por el tipo
        const incidents = await incidentRepository.find({
            where: { type },  // Filtramos por el tipo de incidente
            relations: ['facility', 'reported_by'], // Incluimos las relaciones de facility y reported_by
            order: { date: "DESC" } // Ordenamos por fecha descendente (más recientes primero)
        });

        // Si no se encuentran incidentes de ese tipo
        if (incidents.length === 0) {
            return res.status(404).json({ message: "No se encontraron incidentes de este tipo." });
        }

        // Devolvemos los incidentes encontrados
        res.status(200).json(incidents);
    } catch (error) {
        console.error("Error al obtener los incidentes por tipo:", error);
        res.status(500).json({ message: "Error al obtener los incidentes.", error: error.message });
    }
});






app.post('/attendance', async (req, res) => {
    const { employeeId, check_in, check_out, date, facilityId } = req.body;

    // Comprobar si falta algún dato importante
    if (!employeeId || !check_in || !check_out || !date || !facilityId) {
        return res.status(400).json({ error: "Se requiere el ID del empleado, hora de entrada, hora de salida, fecha y el ID de la instalación." });
    }

    try {
        // Buscar al empleado en la base de datos
        const employeeRepository = dataSource.getRepository(EmployeeSchema);
        const employee = await employeeRepository.findOne({ where: { id: employeeId } });

        if (!employee) {
            return res.status(404).json({ error: `Empleado con ID ${employeeId} no encontrado.` });
        }

        // Buscar la instalación (facility) en la base de datos
        const facilityRepository = dataSource.getRepository(FacilitySchema);
        const facility = await facilityRepository.findOne({ where: { id: facilityId } });

        if (!facility) {
            return res.status(404).json({ error: `Instalación con ID ${facilityId} no encontrada.` });
        }

        // Crear el nuevo registro de asistencia
        const attendanceRepository = dataSource.getRepository(AttendanceSchema);
        const newAttendance = attendanceRepository.create({
            employee,
            check_in,
            check_out,
            date,
            facility // Asegúrate de asociar la instalación (facility)
        });

        // Guardar la nueva asistencia en la base de datos
        await attendanceRepository.save(newAttendance);

        // Responder con la asistencia creada
        res.status(201).json(newAttendance);
    } catch (error) {
        console.error("Error al crear la asistencia:", error);
        res.status(500).json({ error: "Error interno del servidor al crear la asistencia." });
    }
});


const getLastDayOfMonth = (year, month) => {
  return new Date(year, month, 0).getDate(); // Devuelve el último día del mes correctamente
};

app.post('/payroll/generate-monthly', async (req, res) => {
    const { month, year } = req.body;

    if (!month || !year) {
        return res.status(400).json({ error: "Se requiere el mes y el año para generar las nóminas." });
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);
        const payrollRepository = dataSource.getRepository(PayrollSchema);
        const attendanceRepository = dataSource.getRepository(AttendanceSchema);

        // Obtener todos los empleados activos
        const employees = await employeeRepository.find();

        if (!employees.length) {
            return res.status(404).json({ error: "No hay empleados registrados." });
        }

        const generatedPayrolls = [];

        // Obtener el último día del mes
        const lastDay = getLastDayOfMonth(year, month);
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        for (const employee of employees) {
            // Buscar fichajes del mes y año para cada empleado
            const attendances = await attendanceRepository.find({
                where: {
                    employee: { id: employee.id },
                    date: Between(startDate, endDate) // 🔥 Aquí usamos la fecha correcta
                }
            });

            if (!attendances.length) {
                console.log(`No hay registros de asistencia para ${employee.name} en ${month}/${year}.`);
                continue;
            }

            let totalHours = 0;

            attendances.forEach(attendance => {
                if (attendance.check_out) {  // ✅ Verifica que haya un check_out
                    // Aquí usamos la fecha de asistencia junto con la hora de check_in y check_out
                    const date = attendance.date; // Por ejemplo, '2025-04-02'
                    const checkInTime = `${date}T${attendance.check_in}`;  // Formato correcto: '2025-04-02T08:00:00'
                    const checkOutTime = `${date}T${attendance.check_out}`; // Formato correcto: '2025-04-02T16:00:00'

                    const start = new Date(checkInTime);  // Crear un objeto Date con check_in
                    const end = new Date(checkOutTime);  // Crear un objeto Date con check_out

                    // Verificar que las fechas sean válidas
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        console.warn(`Atención: fechas inválidas para ${employee.name} en ${attendance.date}`);
                        return;  // Si las fechas no son válidas, salimos
                    }

                    const workedHours = (end - start) / (1000 * 60 * 60); // Cálculo de horas trabajadas
                    totalHours += workedHours;
                } else {
                    console.warn(`Atención: Registro de asistencia sin check_out para el empleado ${employee.id} en ${attendance.date}`);
                }
            });

            // Verificar que totalHours sea un número válido
            if (isNaN(totalHours)) {
                console.warn(`Atención: total_hours no es un número válido para el empleado ${employee.id}`);
                totalHours = 0; // Asignar un valor por defecto
            }

            const hourlyRate = employee.hourlyRate || calculateAmount(employee.role);

            // Verificar que hourlyRate sea un número válido
            if (isNaN(hourlyRate)) {
                console.warn(`Atención: hourlyRate no es un número válido para el empleado ${employee.id}`);
                hourlyRate = 0; // Asignar un valor por defecto
            }

            const amount = totalHours * hourlyRate;

            // Verificar que amount sea un número válido
            if (isNaN(amount)) {
                console.warn(`Atención: amount no es un número válido para el empleado ${employee.id}`);
                amount = 0; // Asignar un valor por defecto
            }

            // Crear la nómina
            const newPayroll = payrollRepository.create({
                month,
                year,
                total_hours: totalHours,
                amount,
                employee
            });

            await payrollRepository.save(newPayroll);
            generatedPayrolls.push(newPayroll);
        }

        res.status(201).json({ message: "Nóminas generadas correctamente.", payrolls: generatedPayrolls });
    } catch (error) {
        console.error("Error al generar nóminas:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});




app.get('/attendance/:id', async (req, res) => {
    const { id } = req.params; // Obtener el ID del empleado desde la URL
    const { year, month } = req.query; // Obtener el año y mes desde los parámetros de la query

    // Verificar si se han recibido los datos requeridos
    if (!year || !month) {
        return res.status(400).json({
            status: "error",
            message: "Se requiere el año y el mes como parámetros de consulta (query params)."
        });
    }

    try {
        // Buscar al empleado por su ID
        const employeeRepository = dataSource.getRepository(EmployeeSchema);
        const employee = await employeeRepository.findOne({ where: { id } });

        if (!employee) {
            return res.status(404).json({
                status: "error",
                message: `Empleado con ID ${id} no encontrado.`
            });
        }

        // Convertir el año y mes a un rango de fechas
        const startDate = new Date(year, month - 1, 1); // Primer día del mes
        const endDate = new Date(year, month, 0); // Último día del mes

        // Buscar las asistencias para el empleado en ese rango de fechas
        const attendanceRepository = dataSource.getRepository(AttendanceSchema);
        const attendances = await attendanceRepository.find({
            where: {
                employee: { id: employee.id }, // Aseguramos que la relación con el employee sea correcta
                date: Between(startDate, endDate), // Filtrar por fechas dentro del mes
            },
            relations: ["facility", "employee"], // Aseguramos que la relación "employee" también esté cargada
        });

        // Si no se encuentran asistencias
        if (attendances.length === 0) {
            return res.status(404).json({
                status: "error",
                message: `No se encontraron asistencias para el mes ${month} de ${year}.`
            });
        }

        // Formatear la respuesta
        const formattedAttendances = attendances.map((attendance) => {
            const attendanceDate = new Date(attendance.date);
            const checkInTime = attendance.check_in; // '8:00:00'
            const checkOutTime = attendance.check_out; // '16:00:00'

            // Extraemos las horas, minutos y segundos de check_in y check_out
            const [checkInHour, checkInMinute] = checkInTime.split(':');
            const [checkOutHour, checkOutMinute] = checkOutTime.split(':');

            // Crear una nueva fecha combinando la fecha y la hora de check_in y check_out
            const checkInDateTime = new Date(attendanceDate);
            checkInDateTime.setHours(checkInHour, checkInMinute, 0); // Los segundos siempre en 0

            const checkOutDateTime = new Date(attendanceDate);
            checkOutDateTime.setHours(checkOutHour, checkOutMinute, 0); // Los segundos siempre en 0

            // Formatear la hora a 'HH:mm:ss' para incluir segundos
            const checkInFormatted = `${checkInDateTime.getHours()}:${checkInDateTime.getMinutes() < 10 ? '0' + checkInDateTime.getMinutes() : checkInDateTime.getMinutes()}:00`;
            const checkOutFormatted = `${checkOutDateTime.getHours()}:${checkOutDateTime.getMinutes() < 10 ? '0' + checkOutDateTime.getMinutes() : checkOutDateTime.getMinutes()}:00`;

            return {
                id: attendance.id,
                employee: {
                    id: employee.id,
                    name: employee.name,
                    image: employee.image || "/default-avatar.jpg", // Imagen predeterminada
                },
                facility: {
                    id: attendance.facility.id,
                    name: attendance.facility.name
                },
                check_in: checkInFormatted, // Hora en formato 'HH:mm:ss'
                check_out: checkOutFormatted, // Hora en formato 'HH:mm:ss'
                date: attendanceDate.toISOString().split('T')[0] // Solo la fecha (YYYY-MM-DD)
            };
        });

        // Responder con los datos encontrados
        res.status(200).json({
            status: "success",
            data: formattedAttendances
        });
    } catch (error) {
        console.error("Error al obtener las asistencias:", error);
        res.status(500).json({
            status: "error",
            message: "Error interno del servidor al obtener las asistencias."
        });
    }
});




app.delete('/attendance/:id', async (req, res) => {
    const { id } = req.params; // ID del empleado
    const { year, month } = req.query; // Año y mes desde los parámetros de la query

    // Verificar si se han recibido los datos requeridos
    if (!year || !month) {
        return res.status(400).json({
            status: "error",
            message: "Se requiere el año y el mes como parámetros de consulta (query params)."
        });
    }

    try {
        // Buscar al empleado por su ID
        const employeeRepository = dataSource.getRepository(EmployeeSchema);
        const employee = await employeeRepository.findOne({ where: { id } });

        if (!employee) {
            return res.status(404).json({
                status: "error",
                message: `Empleado con ID ${id} no encontrado.`
            });
        }

        // Convertir el año y mes a un rango de fechas
        const startDate = new Date(year, month - 1, 1); // Primer día del mes
        const endDate = new Date(year, month, 0); // Último día del mes

        // Buscar asistencias dentro del rango de fechas
        const attendanceRepository = dataSource.getRepository(AttendanceSchema);
        const attendances = await attendanceRepository.find({
            where: {
                employee: { id: employee.id },
                date: Between(startDate, endDate),
            }
        });

        // Si no se encuentran asistencias
        if (attendances.length === 0) {
            return res.status(404).json({
                status: "error",
                message: `No se encontraron asistencias para el mes ${month} de ${year}.`
            });
        }

        // Eliminar todas las asistencias encontradas
        await attendanceRepository.remove(attendances);

        res.status(200).json({
            status: "success",
            message: `${attendances.length} registros de asistencia eliminados correctamente.`
        });
    } catch (error) {
        console.error("Error al eliminar las asistencias:", error);
        res.status(500).json({
            status: "error",
            message: "Error interno del servidor al eliminar las asistencias."
        });
    }
});



app.post('/payroll/generate', async (req, res) => {
    const { employeeId, month, year } = req.body;

    if (!employeeId || !month || !year) {
        return res.status(400).json({ error: "Se requiere el ID del empleado, mes y año para generar la nómina." });
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);
        const employee = await employeeRepository.findOne({ where: { id: employeeId } });

        if (!employee) {
            return res.status(404).json({ error: `Empleado con ID ${employeeId} no encontrado.` });
        }

        // Buscar los fichajes del empleado en ese mes y año
        const attendanceRepository = dataSource.getRepository(AttendanceSchema);
        const attendances = await attendanceRepository.find({
            where: {
                employee: { id: employeeId },
                date: Between(`${year}-${month}-01`, `${year}-${month}-31`)
            }
        });

        if (!attendances.length) {
            return res.status(404).json({ error: `No hay registros de asistencia para el mes ${month} y año ${year} para el empleado ${employeeId}.` });
        }

        // Calcular las horas trabajadas
        let totalHours = 0;
        attendances.forEach(attendance => {
            if (attendance.check_out) {
                const start = new Date(attendance.check_in);
                const end = new Date(attendance.check_out);
                const workedHours = (end - start) / (1000 * 60 * 60);
                totalHours += workedHours;
            }
        });

        // Calcular el monto de la nómina
        const hourlyRate = employee.hourlyRate || calculateAmount(employee.role);
        const amount = totalHours * hourlyRate;

        // Crear la nómina
        const payrollRepository = dataSource.getRepository(PayrollSchema);
        const newPayroll = payrollRepository.create({
            month,
            year,
            total_hours: totalHours,
            amount,
            employee
        });

        await payrollRepository.save(newPayroll);

        res.status(201).json(newPayroll);
    } catch (error) {
        console.error("Error al crear la nómina:", error);
        res.status(500).json({ error: "Error interno del servidor al generar la nómina." });
    }
});



app.get('/payroll/:employeeId', async (req, res) => {
    const { employeeId } = req.params;

    try {
        const payrollRepository = dataSource.getRepository(PayrollSchema);
        const payrolls = await payrollRepository.find({
            where: { employee: { id: employeeId } },
            order: { year: "DESC", month: "DESC" }
        });

        // Si no hay nóminas, devolvemos un arreglo vacío en lugar de un error 404
        if (!payrolls || payrolls.length === 0) {
            return res.status(200).json([]); // Respuesta con un arreglo vacío
        }

        res.status(200).json(payrolls);
    } catch (error) {
        console.error("Error al obtener nóminas:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});



app.delete('/payroll/:payrollId', async (req, res) => {
    const { payrollId } = req.params;

    try {
        const payrollRepository = dataSource.getRepository(PayrollSchema);
        const payroll = await payrollRepository.findOne({ where: { id: payrollId } });

        if (!payroll) {
            return res.status(404).json({ error: `No se encontró la nómina con ID ${payrollId}.` });
        }

        await payrollRepository.remove(payroll);
        res.status(200).json({ message: "Nómina eliminada exitosamente." });
    } catch (error) {
        console.error("Error al eliminar la nómina:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});





app.post('/employee/:id/work_schedule/:scheduleId/add_schedule', async (req, res) => {
    const { id, scheduleId } = req.params;  // Obtenemos el ID del empleado y el scheduleId
    const { date, start_time, end_time, facilityId } = req.body; // Datos del nuevo horario

    // Validación de datos: Aseguramos que se reciban los campos obligatorios
    if (!date || !start_time || !end_time || !facilityId) {
        return res.status(400).json({ message: "Faltan datos necesarios (date, start_time, end_time, facilityId)." });
    }

    try {
        const workScheduleRepository = dataSource.getRepository(WorkScheduleSchema);
        const scheduleRepository = dataSource.getRepository(ScheduleSchema);
        const facilityRepository = dataSource.getRepository(FacilitySchema); // Repositorio para Facility

        // Buscar el work schedule correspondiente
        const workSchedule = await workScheduleRepository.findOne({
            where: { id: scheduleId },
            relations: ['employee', 'schedules', 'employee.work_schedule', 'schedules.facility'],  // Traemos relaciones necesarias
        });

        if (!workSchedule) {
            return res.status(404).json({ message: "Work schedule no encontrado." });
        }

        // Verificar que el work schedule corresponde al empleado que estamos pasando
        if (workSchedule.employee.id !== id) {
            return res.status(400).json({ message: "El work schedule no pertenece al empleado especificado." });
        }

        // Buscar la instalación correspondiente
        const facility = await facilityRepository.findOne({ where: { id: facilityId } });

        if (!facility) {
            return res.status(404).json({ message: "Instalación no encontrada." });
        }

        // Crear el nuevo horario
        const newSchedule = scheduleRepository.create({
            date,
            start_time,
            end_time,
            work_schedule: workSchedule,  // Relacionar con el work schedule encontrado
            facility: facility,  // Relacionar con la instalación encontrada
        });

        // Guardar el nuevo horario en la base de datos
        await scheduleRepository.save(newSchedule);

        // Agregar el nuevo horario al array de schedules del workSchedule
        workSchedule.schedules.push(newSchedule);

        // Guardar los cambios en el workSchedule
        await workScheduleRepository.save(workSchedule);

        // Devolver el nuevo horario creado como respuesta
        res.status(201).json({
            message: "Horario agregado exitosamente.",
            schedule: newSchedule
        });
    } catch (error) {
        console.error("Error al agregar el horario:", error);
        res.status(500).json({ message: "Error al agregar el horario.", error: error.message });
    }
});


app.delete('/employee/:employeeId/work_schedule/:scheduleId/schedule/:scheduleSpecificId', async (req, res) => {
    const { employeeId, scheduleId, scheduleSpecificId } = req.params;

    try {
        //console.log(`Empleado ID: ${employeeId}, Work Schedule ID: ${scheduleId}, Schedule Specific ID: ${scheduleSpecificId}`);

        const employeeRepository = dataSource.getRepository(EmployeeSchema);
        const scheduleRepository = dataSource.getRepository(ScheduleSchema);

        // Cargar el empleado con su work_schedule y schedules
        const employee = await employeeRepository.findOne({
            where: { id: employeeId },
            relations: ['work_schedule', 'work_schedule.schedules']
        });

        if (!employee) {
            console.log("Empleado no encontrado.");
            return res.status(404).send("Empleado no encontrado.");
        }

        // Buscar el work_schedule correspondiente
        const workSchedule = employee.work_schedule.find(work => work.id === scheduleId);
        if (!workSchedule) {
            console.log("Work schedule no encontrado.");
            return res.status(404).send("Work schedule no encontrado.");
        }

        // Buscar el horario específico dentro del work_schedule
        const scheduleIndex = workSchedule.schedules.findIndex(s => s.id === scheduleSpecificId);
        if (scheduleIndex === -1) {
            console.log("Horario específico no encontrado.");
            return res.status(404).send("Horario no encontrado dentro del work schedule.");
        }

        // Eliminar el horario
        workSchedule.schedules.splice(scheduleIndex, 1);

        // Guardar los cambios en el work_schedule
        await employeeRepository.save(employee);

        // Enviar una respuesta de éxito
        res.status(200).send("Horario eliminado con éxito.");
    } catch (error) {
        console.error("Error al eliminar el horario:", error);
        res.status(500).send("Error interno del servidor.");
    }
});



















//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//LOGIN/////////////////
app.post('/login', async (req, res) => {
    const { id, password } = req.body;

    // Validar que se haya enviado id y password
    if (!id || !password) {
        return res.status(400).send("Id y contraseña son requeridos.");
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);

        // Buscar al empleado por el DNI (id)
        const employee = await employeeRepository.findOne({ where: { id } });

        if (!employee) {
            return res.status(404).send("Empleado no encontrado.");
        }

        // Verificar que la contraseña (DNI) proporcionada coincida con la almacenada (encriptada) usando bcrypt
        const isPasswordValid = await bcrypt.compare(password, employee.password);

        if (!isPasswordValid) {
            return res.status(401).send("Contraseña incorrecta.");
        }

        // Verificar que el rol del empleado sea "Boss"
        if (employee.role !== "Boss") {
            return res.status(403).send("No tienes acceso al sistema.");
        }

        // Verificar si la clave secreta está definida
        if (!process.env.JWT_SECRET_KEY) {
            return res.status(500).send("Se requiere una clave secreta para generar el token.");
        }

        // Crear un token de sesión o JWT con el rol
        const token = jwt.sign({ role: "Boss" }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

        return res.json({ Status: "Success", Token: token });

    } catch (error) {
        console.error("Error al autenticar al empleado:", error);
        res.status(500).send("Error al autenticar al empleado.");
    }
});


// Usar el middleware en rutas protegidas
app.get("/dashboard", authenticateToken, (req, res) => {
    res.json({ message: "Bienvenido al Dashboard", user: req.user });
});


app.listen(port, async () => {
    console.log(`Listening port: ${port}`)
})