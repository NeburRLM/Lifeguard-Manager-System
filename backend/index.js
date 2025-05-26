import express from 'express';
import { dataSource } from './postgresql/data-source.js';
import { EmployeeSchema } from './postgresql/schemas/employee-schema.js';
import { FacilitySchema } from './postgresql/schemas/facility-schema.js';
import { WorkScheduleSchema } from './postgresql/schemas/work-schedule.js';
import { ScheduleSchema } from './postgresql/schemas/schedule-schema.js';
import { IncidentSchema } from './postgresql/schemas/incident-schema.js';
import { PayrollSchema } from './postgresql/schemas/payroll-schema.js';
import { AttendanceSchema } from './postgresql/schemas/attendance-schema.js';
import { RoleSalarySchema } from "./postgresql/schemas/roleSalary-schema.js";
import { IncidentTypesSchema } from "./postgresql/schemas/incidentTypes-schema.js";
import { RoleTypesSchema } from "./postgresql/schemas/rolesType-schema.js";
import { FacilityTypesSchema } from "./postgresql/schemas/facilitiesType-schema.js";
import moment from 'moment-timezone';
import { Between } from 'typeorm';
import { In } from 'typeorm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url'
import { DateTime } from 'luxon';
const app = express()
const port = 4000

app.use(cookieParser())     // Configura el middleware para parsear cookies
dotenv.config();    // Configura dotenv para cargar variables de entorno desde un archivo '.env' (token)
app.use(express.urlencoded({ extended: true }));
// Asignación de las variables __filename y __dirname necesarias para trabajar con rutas absolutas en módulos ECMAScript
const __filename = fileURLToPath(import.meta.url);  // Convierte la URL del módulo actual a un path de archivo
const __dirname = path.dirname(__filename); // Obtiene el directorio de trabajo desde __filename

// Configuración para servir archivos estáticos desde la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/reports', express.static(path.join(__dirname, 'reports')));

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
        seedRoleSalaries();
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



// Configurar almacenamiento en la carpeta "reports"
const storageReports = multer.diskStorage({
    destination: "reports/", // Carpeta donde se guardarán los justificantes
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Middleware para subir un archivo llamado "justification"
const uploadReport = multer({ storage: storageReports });


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


app.put('/employee/change-password/:id', async (req, res) => {
    const lang = req.headers['accept-language'] || 'en';
    const messages = {
      'employeeNotFound': {
        en: 'Employee not found',
        es: 'Empleado no encontrado',
        ca: 'Empleat no trobat',
      },
      'currentPasswordIncorrect': {
        en: 'Current password is incorrect',
        es: 'La contraseña actual es incorrecta',
        ca: 'La contrasenya actual és incorrecta',
      },
      'newPasswordSame': {
        en: 'The new password must be different from the current password.',
        es: 'La nueva contraseña debe ser diferente de la actual.',
        ca: 'La nova contrasenya ha de ser diferent de l\'actual.',
      },
      'passwordUpdated': {
        en: 'Password updated successfully',
        es: 'Contraseña actualizada correctamente',
        ca: 'Contrasenya actualitzada correctament',
      },
      'errorUpdating': {
        en: 'Error updating password',
        es: 'Error al actualizar la contraseña',
        ca: 'Error en actualitzar la contrasenya',
      }
    };


    const { id } = req.params; // Obtener el ID del empleado de la URL
    const { currentPassword, newPassword } = req.body; // Obtener la contraseña actual y nueva del cuerpo de la solicitud
    //console.log(currentPassword)
    //console.log(newPassword)
    try {
        // Buscar al empleado por su ID
        const employee = await dataSource.getRepository(EmployeeSchema)
            .createQueryBuilder("employee")
            .where("employee.id = :id", { id })
            .getOne();

        if (!employee) {
            return res.status(404).json({ message: messages.employeeNotFound[lang] });
        }

        // Comparar la contraseña actual proporcionada con la contraseña almacenada
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: messages.currentPasswordIncorrect[lang] });
        }

        // Verificar que la nueva contraseña no sea igual a la actual
        const isNewPasswordSameAsCurrent = await bcrypt.compare(newPassword, employee.password);

        if (isNewPasswordSameAsCurrent) {
            return res.status(400).json({ message: messages.newPasswordSame[lang] });
        }

        // Si la contraseña actual es válida y la nueva es diferente, proceder con la actualización
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar la contraseña en la base de datos
        employee.password = hashedPassword;
        await dataSource.getRepository(EmployeeSchema).save(employee); // Guardamos la actualización

        res.json({ message: messages.passwordUpdated[lang] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: messages.errorUpdating[lang], error: error.message });
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



const seedRoleSalaries = async () => {
    const roleSalaryRepository = dataSource.getRepository(RoleSalarySchema);


    const roles = [
        {
            role: "Boss",
            base_salary: 1600.00,
            earnings: [
                { name: "Salario Base", amount: 1600.00 },
                { name: "Plus Transporte", amount: 81.00 },
                { name: "Paga Extra X", amount: 117.29 },
                { name: "Paga Extra Navidad", amount: 117.29 }
            ],
            deductions: [
                { name: "C. Comunes", percentage: 4.70, amount: 0 },
                { name: "Cotización MEI", percentage: 0.12, amount: 0 },
                { name: "Desempleo", percentage: 1.55, amount: 0 },
                { name: "F. Profesional", percentage: 0.10, amount: 0 },
                { name: "Retención IRPF", percentage: 6.47, amount: 0 }
            ]
        },
        {
            role: "Coordinator",
            base_salary: 1278.00,
            earnings: [
                { name: "Salario Base", amount: 1278.00 },
                { name: "Plus Transporte", amount: 65.00 },
                { name: "Paga Extra X", amount: 101.18 },
                { name: "Paga Extra Navidad", amount: 101.18 }
            ],
            deductions: [
                { name: "C. Comunes", percentage: 4.70, amount: 0 },
                { name: "Cotización MEI", percentage: 0.12, amount: 0 },
                { name: "Desempleo", percentage: 1.55, amount: 0 },
                { name: "F. Profesional", percentage: 0.10, amount: 0 },
                { name: "Retención IRPF", percentage: 6.47, amount: 0 }
            ]
        },
        {
            role: "Lifeguard",
            base_salary: 1118.00,
            earnings: [
                { name: "Salario Base", amount: 1118.00 },
                { name: "Plus Transporte", amount: 50.00 },
                { name: "Paga Extra X", amount: 93.18 },
                { name: "Paga Extra Navidad", amount: 93.18 }
            ],
            deductions: [
                { name: "C. Comunes", percentage: 4.70, amount: 0 },
                { name: "Cotización MEI", percentage: 0.12, amount: 0 },
                { name: "Desempleo", percentage: 1.55, amount: 0 },
                { name: "F. Profesional", percentage: 0.10, amount: 0 },
                { name: "Retención IRPF", percentage: 6.47, amount: 0 }
            ]
        }
    ];

    for (const role of roles) {
        const existingRole = await roleSalaryRepository.findOne({ where: { role: role.role } });
        if (!existingRole) {
            await roleSalaryRepository.save({
                role: role.role,
                base_salary: role.base_salary,
                earnings: JSON.stringify(role.earnings),
                deductions: JSON.stringify(role.deductions)
            });
        }
    }

    console.log("Valores de salarios base insertados correctamente");
};


app.get("/role_salary", async (req, res) => {
    const allowedRoles = ['Boss', 'Coordinator', 'Lifeguard'];

    try {
        const roleSalaryRepository = dataSource.getRepository(RoleSalarySchema);

        // Obtener los datos de los tres roles específicos
        const roleSalaries = await roleSalaryRepository.find({
            where: {
                role: In(allowedRoles) // Aquí se usa 'In' correctamente
            }
        });

        if (!roleSalaries || roleSalaries.length === 0) {
            return res.status(404).json({ message: "Roles no encontrados" });
        }

        // Mapeamos los resultados para devolver solo la información relevante
        const response = roleSalaries.map(roleSalary => ({
            role: roleSalary.role,
            base_salary: roleSalary.base_salary,
            earnings: JSON.parse(roleSalary.earnings),  // Parseamos el JSON
            deductions: JSON.parse(roleSalary.deductions) // Parseamos el JSON
        }));

        // Devolvemos los salarios de los tres roles
        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching role salary:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});



app.get("/role_salary/:id", async (req, res) => {
  const { id } = req.params;

      try {
          const payrollRepository = dataSource.getRepository(PayrollSchema);
          const payroll = await payrollRepository.findOne({ where: { id } });

          if (!payroll) {
              return res.status(404).json({ message: "Nómina no encontrada" });
          }

          // Devolver los datos de la nómina
          res.status(200).json({
              base_salary: parseFloat(payroll.base_salary),
              earnings: JSON.parse(payroll.earnings),
              deductions: JSON.parse(payroll.deductions),
              total_hours: parseFloat(payroll.total_hours),
              amount_hours: parseFloat(payroll.amount_hours),
              total_amount: parseFloat(payroll.total_amount),
              month: payroll.month,
              year: payroll.year,
              employee_id: payroll.employee_id
          });
      } catch (error) {
          console.error("Error fetching payroll data:", error);
          res.status(500).json({ message: "Error interno del servidor" });
      }
 });



app.put("/role_salary/:role", async (req, res) => {
    const { role } = req.params;
    const { base_salary, earnings, deductions } = req.body;

    const roleSalaryRepository = dataSource.getRepository(RoleSalarySchema);

    try {
        const existingRole = await roleSalaryRepository.findOne({ where: { role } });

        if (!existingRole) {
            return res.status(404).json({ message: "Role not found" });
        }

        // Asegurarse de que earnings y deductions sean objetos
        existingRole.earnings = JSON.parse(existingRole.earnings);
        existingRole.deductions = JSON.parse(existingRole.deductions);

        // Actualizar el salario base en el registro de la tabla
        existingRole.base_salary = base_salary;

        // Si se proporciona earnings, actualizamos el "Salario Base" dentro de earnings
        if (earnings) {
            existingRole.earnings = earnings.map(earning => {
                if (earning.name === "Salario Base") {
                    earning.amount = base_salary; // Actualizamos el salario base dentro de earnings
                }
                return earning;
            });
        }

        // Actualizar solo el porcentaje de las deducciones
        if (deductions) {
            existingRole.deductions = existingRole.deductions.map(existingDeduction => {
                const updatedDeduction = deductions.find(d => d.name === existingDeduction.name);
                if (updatedDeduction) {
                    existingDeduction.percentage = updatedDeduction.percentage;
                }
                return existingDeduction;
            });
        }

        // Convertimos a JSON los datos actualizados de earnings y deductions
        existingRole.earnings = JSON.stringify(existingRole.earnings);
        existingRole.deductions = JSON.stringify(existingRole.deductions);

        // Guardamos los cambios en la base de datos
        await roleSalaryRepository.save(existingRole);

        res.status(200).json({ message: "Role updated successfully" });
    } catch (error) {
        console.error("Error updating role salary:", error);
        res.status(500).json({ message: "Error updating role salary" });
    }
});



app.delete("/role_salary", async (req, res) => {
  const allowedRoles = ['Boss', 'Coordinator', 'Lifeguard']; // Los roles a eliminar

  try {
    const roleSalaryRepository = dataSource.getRepository(RoleSalarySchema);

    // Eliminar todos los registros que tengan alguno de los roles definidos
    const result = await roleSalaryRepository.delete({
      role: In(allowedRoles) // Usamos 'In' para filtrar los roles que queremos eliminar
    });

    if (result.affected === 0) {
      return res.status(404).json({ message: "No roles found to delete" }); // Si no hay registros afectados
    }

    // Respondemos con un mensaje de éxito
    res.status(200).json({ message: "Roles deleted successfully" });

  } catch (error) {
    console.error("Error deleting role salaries:", error);
    res.status(500).json({ message: "Error deleting role salaries" }); // En caso de error, devolvemos un error 500
  }
});


// Cambiar para calcularlo por las horas realizadas
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




app.post('/role-type', async (req, res) => {
    let rolesTypes = Array.isArray(req.body) ? req.body : [req.body]; // Convertir en array si no lo es

    try {
        const roleTypeRepository = dataSource.getRepository(RoleTypesSchema);

        let createdRoleTypes = [];

        for (let roleType of rolesTypes) {
            const { type } = roleType;

            // Validar el tipo de incidente
            if (!type) {
                return res.status(400).json({ message: "El campo 'type' es obligatorio." });
            }

            // Verificar que no exista ya un tipo de incidente con el mismo nombre
            const existingType = await roleTypeRepository.findOne({ where: { type } });
            if (existingType) {
                return res.status(400).json({ message: `El tipo de rol '${type}' ya existe.` });
            }

            // Crear el nuevo tipo de incidente
            const newRoleType = roleTypeRepository.create({
                type,
            });

            await roleTypeRepository.save(newRoleType);
            createdRoleTypes.push(newRoleType);
        }

        res.status(201).json(createdRoleTypes.length === 1 ? createdRoleTypes[0] : createdRoleTypes);
    } catch (error) {
        console.error("Error al crear el tipo de rol:", error);
        res.status(500).json({ message: "Error al crear el tipo de rol.", error: error.message });
    }
});




app.get('/roles-types', async (req, res) => {
    try {
        const roleTypeRepository = dataSource.getRepository(RoleTypesSchema);

        // Obtener todos los tipos de incidentes
        const rolesTypes = await roleTypeRepository.find();

        if (rolesTypes.length === 0) {
            return res.status(404).json({ message: "No se encontraron tipos de roles." });
        }

        res.status(200).json(rolesTypes);
    } catch (error) {
        console.error("Error al obtener los tipos de roles:", error);
        res.status(500).json({ message: "Error al obtener los tipos de roles.", error: error.message });
    }
});



app.post('/facility-type', async (req, res) => {
    let facilitiesTypes = Array.isArray(req.body) ? req.body : [req.body]; // Convertir en array si no lo es

    try {
        const facilityTypeRepository = dataSource.getRepository(FacilityTypesSchema);

        let createdFacilityTypes = [];

        for (let facilityType of facilitiesTypes) {
            const { type } = facilityType;

            // Validar el tipo de incidente
            if (!type) {
                return res.status(400).json({ message: "El campo 'type' es obligatorio." });
            }

            // Verificar que no exista ya un tipo de incidente con el mismo nombre
            const existingType = await facilityTypeRepository.findOne({ where: { type } });
            if (existingType) {
                return res.status(400).json({ message: `El tipo de instalación '${type}' ya existe.` });
            }

            // Crear el nuevo tipo de incidente
            const newFacilityType = facilityTypeRepository.create({
                type,
            });

            await facilityTypeRepository.save(newFacilityType);
            createdFacilityTypes.push(newFacilityType);
        }

        res.status(201).json(createdFacilityTypes.length === 1 ? createdFacilityTypes[0] : createdFacilityTypes);
    } catch (error) {
        console.error("Error al crear el tipo de instalación:", error);
        res.status(500).json({ message: "Error al crear el tipo de instalación.", error: error.message });
    }
});



app.get('/facilities-types', async (req, res) => {
    try {
        const facilityTypeRepository = dataSource.getRepository(FacilityTypesSchema);

        // Obtener todos los tipos de incidentes
        const facilitiesTypes = await facilityTypeRepository.find();

        if (facilitiesTypes.length === 0) {
            return res.status(404).json({ message: "No se encontraron tipos de instalaciones." });
        }

        res.status(200).json(facilitiesTypes);
    } catch (error) {
        console.error("Error al obtener los tipos de instalaciones:", error);
        res.status(500).json({ message: "Error al obtener los tipos de instalaciones.", error: error.message });
    }
});


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







app.post('/incident-type', async (req, res) => {
    let incidentTypes = Array.isArray(req.body) ? req.body : [req.body]; // Convertir en array si no lo es

    try {
        const incidentTypeRepository = dataSource.getRepository(IncidentTypesSchema);

        let createdIncidentTypes = [];

        for (let incidentType of incidentTypes) {
            const { type } = incidentType;

            // Validar el tipo de incidente
            if (!type) {
                return res.status(400).json({ message: "El campo 'type' es obligatorio." });
            }

            // Verificar que no exista ya un tipo de incidente con el mismo nombre
            const existingType = await incidentTypeRepository.findOne({ where: { type } });
            if (existingType) {
                return res.status(400).json({ message: `El tipo de incidente '${type}' ya existe.` });
            }

            // Crear el nuevo tipo de incidente
            const newIncidentType = incidentTypeRepository.create({
                type,
            });

            await incidentTypeRepository.save(newIncidentType);
            createdIncidentTypes.push(newIncidentType);
        }

        res.status(201).json(createdIncidentTypes.length === 1 ? createdIncidentTypes[0] : createdIncidentTypes);
    } catch (error) {
        console.error("Error al crear el tipo de incidente:", error);
        res.status(500).json({ message: "Error al crear el tipo de incidente.", error: error.message });
    }
});




app.get('/incident-types', async (req, res) => {
    try {
        const incidentTypeRepository = dataSource.getRepository(IncidentTypesSchema);

        // Obtener todos los tipos de incidentes
        const incidentTypes = await incidentTypeRepository.find();

        if (incidentTypes.length === 0) {
            return res.status(404).json({ message: "No se encontraron tipos de incidentes." });
        }

        res.status(200).json(incidentTypes);
    } catch (error) {
        console.error("Error al obtener los tipos de incidente:", error);
        res.status(500).json({ message: "Error al obtener los tipos de incidente.", error: error.message });
    }
});




app.post('/incident', async (req, res) => {
    let incidents = Array.isArray(req.body) ? req.body : [req.body]; // Convertir en array si no lo es

    try {
        const incidentTypeRepository = dataSource.getRepository(IncidentTypesSchema);
        const incidentRepository = dataSource.getRepository(IncidentSchema);
        const facilityRepository = dataSource.getRepository(FacilitySchema);
        const employeeRepository = dataSource.getRepository(EmployeeSchema);

        let createdIncidents = [];
        let failedIncidents = []; // Para almacenar las incidencias que fallan

        for (let incident of incidents) {
            const {
                            type, description, facilityId, reportedById, latitude, longitude,
                            firstName, lastName, dni, age, cityOfOrigin, countryOfOrigin, gender, language
                        } = incident;


            // Validar los datos requeridos
            if (!type || !description || !facilityId || !reportedById || !latitude || !longitude) {
                failedIncidents.push({ message: "Todos los campos son requeridos en cada incidente." });
                continue; // Saltamos a la siguiente incidencia
            }

            // Validar los nuevos campos de la persona atendida
                        if (!firstName || !lastName || !dni || !age || !cityOfOrigin || !countryOfOrigin || !gender || !language) {
                            failedIncidents.push({ message: "Todos los campos de la persona atendida son requeridos." });
                            continue;
                        }

            // Buscar el tipo de incidente en la base de datos
            const incidentType = await incidentTypeRepository.findOne({ where: { type } });

            // Si no existe el tipo de incidente, se registra el error
            if (!incidentType) {
                failedIncidents.push({ message: `Tipo de incidente no válido: ${type}` });
                continue; // Saltamos a la siguiente incidencia
            }

            // Buscar la instalación y el empleado
            const facility = await facilityRepository.findOne({ where: { id: facilityId } });
            const employee = await employeeRepository.findOne({ where: { id: reportedById } });

            if (!facility) {
                failedIncidents.push({ message: `Instalación no encontrada: ${facilityId}` });
                continue; // Saltamos a la siguiente incidencia
            }

            if (!employee) {
                failedIncidents.push({ message: `Empleado no encontrado: ${reportedById}` });
                continue; // Saltamos a la siguiente incidencia
            }

            // Crear la incidencia
            const newIncident = incidentRepository.create({
                type: incidentType.type,  // Usamos el valor de 'type' de la tabla 'incident_types'
                description,
                facility,
                reported_by: employee,
                latitude,
                longitude,
                firstName,
                lastName,
                dni,
                age,
                cityOfOrigin,
                countryOfOrigin,
                gender,
                language,
                //date: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
                //date: new Date(new Date().setDate(new Date().getDate() - 1))
                //date: new Date(2024, 5, 10)
            });

            await incidentRepository.save(newIncident);
            createdIncidents.push(newIncident);
        }

        // Si se crearon incidencias, las retornamos
        if (createdIncidents.length > 0) {
            return res.status(201).json(createdIncidents);
        }

        // Si no se crearon incidencias válidas, devolvemos un mensaje con los errores
        res.status(400).json({ failedIncidents });
    } catch (error) {
        console.error("Error al crear los incidentes:", error);
        res.status(500).json({ message: "Error al crear los incidentes.", error: error.message });
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

app.get("/incidents/today", async (req, res) => {
  // Obtener la fecha actual en zona horaria de Madrid
  const nowInMadrid = DateTime.now().setZone('Europe/Madrid');
  //console.log("nowInMadrid:", nowInMadrid.toISO());

  const startOfDay = nowInMadrid.startOf('day');
  const endOfDay = nowInMadrid.endOf('day');

  //console.log("startOfDay Madrid:", startOfDay.toISO());
  //console.log("endOfDay Madrid:", endOfDay.toISO());

  try {
    const incidentRepository = dataSource.getRepository(IncidentSchema);
    const incidents = await incidentRepository.find({
      where: {
        date: Between(startOfDay.toJSDate(), endOfDay.toJSDate()) // convertimos a Date nativo para TypeORM
      },
      relations: ['facility', 'reported_by']
    });
    res.json(incidents);
  } catch (err) {
    console.error("Error al obtener incidencias de hoy:", err);
    res.status(500).json({ message: "Error interno" });
  }
});





// DELETE para eliminar un incidente a partire de su id
app.delete('/incidents/:id', async (req, res) => {
    try {
        const { id } = req.params; // Obtener el id del incidente de los parámetros de la URL
        const incidentRepository = dataSource.getRepository(IncidentSchema);

        // Buscar el incidente por id
        const incident = await incidentRepository.findOne({ where: { id } });

        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        // Eliminar el incidente
        await incidentRepository.remove(incident);

        res.status(200).json({ message: 'Incident deleted successfully' });
    } catch (error) {
        console.error("Error al eliminar el incidente:", error);
        res.status(500).json({ message: "Error al eliminar el incidente.", error: error.message });
    }
});


// DELETE para eliminar todas las incidencias
app.delete('/incidents', async (req, res) => {
    try {
        const incidentRepository = dataSource.getRepository(IncidentSchema);

        // Eliminar todos los incidentes
        const deleteResult = await incidentRepository.clear(); // Elimina todos los registros de la tabla

        res.status(200).json({ message: 'All incidents have been deleted successfully' });
    } catch (error) {
        console.error("Error al eliminar los incidentes:", error);
        res.status(500).json({ message: "Error al eliminar los incidentes.", error: error.message });
    }
});



// GET para obtener una incidencia segun su id
app.get('/incidents/:id', async (req, res) => {
    try {
        const { id } = req.params;  // Obtener el id de los parámetros de la URL
        const incidentRepository = dataSource.getRepository(IncidentSchema);

        // Buscar el incidente por su ID, incluyendo las relaciones con 'facility' y 'reported_by'
        const incident = await incidentRepository.findOne({
            where: { id },  // Buscar el incidente por ID
            relations: ['facility', 'reported_by']  // Incluir las relaciones
        });

        // Si no se encuentra el incidente
        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        // Si el incidente se encuentra, devolverlo
        res.status(200).json(incident);
    } catch (error) {
        console.error("Error al obtener la incidencia:", error);
        res.status(500).json({ message: "Error al obtener la incidencia.", error: error.message });
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

    try {
        const incidentTypeRepository = dataSource.getRepository(IncidentTypesSchema);

        // Verificamos si el tipo de incidente existe en la base de datos
        const incidentType = await incidentTypeRepository.findOne({ where: { type } });

        if (!incidentType) {
            return res.status(400).json({ message: "Tipo de incidente no válido." });
        }

        // Ahora que sabemos que el tipo es válido, buscamos los incidentes
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



// GET para obtener incidentes por rango de fechas
app.get('/incidents/date-range', async (req, res) => {
    const { startDate, endDate } = req.query; // Obtén las fechas de inicio y fin de los parámetros de consulta

    try {
        const incidentRepository = dataSource.getRepository(IncidentSchema);

        const incidents = await incidentRepository.find({
            where: {
                date: Between(new Date(startDate), new Date(endDate)) // Filtra por el rango de fechas
            },
            relations: ['facility', 'reported_by'],
            order: { date: "DESC" }
        });

        if (incidents.length === 0) {
            return res.status(404).json({ message: "No se encontraron incidentes en este rango de fechas." });
        }

        res.status(200).json(incidents);
    } catch (error) {
        console.error("Error al obtener los incidentes por rango de fechas:", error);
        res.status(500).json({ message: "Error al obtener los incidentes.", error: error.message });
    }
});



app.post('/attendance', uploadReport.single('justification'), async (req, res) => {
    console.log("POST /attendance -> Body recibido:", req.body);
    if (req.file) {
        console.log('📎 Archivo recibido:');
        console.log(' - Nombre original:', req.file.originalname);
        console.log(' - Guardado como:', req.file.filename);
        console.log(' - Ruta completa:', req.file.path);
      } else {
        console.log('⚠️ No se recibió archivo');
      }
    const { employeeId, check_in, date, facilityId, note_in, status, absence_reason, justified, note_out } = req.body;

    // Comprobar si falta algún dato importante
    if (!employeeId || !date || !facilityId) {
        return res.status(400).json({ error: "Faltan datos requeridos: employeeId, date, facilityId." });
    }

    if (!check_in && status !== 'absent' && !check_in && status !== 'missing') {
        return res.status(400).json({ error: "Si no se proporciona check_in, el estado debe ser 'absent o missing'." });
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

        // Verifica si ya existe un registro de asistencia o ausencia para ese día
        const existing = await attendanceRepository.findOne({
            where: {
                employee: { id: employeeId },
                date: date
            },
            relations: ['employee']
        });

        if (existing) {
            return res.status(409).json({ error: "Ya existe un registro de asistencia o ausencia para esta fecha." });
        }

        let justification_url = null;
                if (req.file) {
                    justification_url = `http://localhost:4000/reports/${req.file.filename}`;
                }

        const newAttendance = attendanceRepository.create({
            employee,
            check_in: check_in || null,
            check_out: null,
            date,
            facility, // Asegúrate de asociar la instalación (facility)
            note_in: note_in || "",
            note_out: note_out || "",
            status: status || "present",
            absence_reason: absence_reason || null,
            justified: justified ?? null,
            justification_url
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


app.put('/attendance/checkout', async (req, res) => {
    console.log("PUT /attendance/checkout -> Body recibido:", req.body);
    const { employeeId, date, check_out, status, note_out } = req.body;

    // Validación básica
    if (!employeeId || !date || !check_out) {
        return res.status(400).json({ error: "Faltan datos requeridos: employeeId, date o check_out." });
    }

    try {
        const attendanceRepository = dataSource.getRepository(AttendanceSchema);

        // Buscar la asistencia del día con check_out aún en null
        const attendance = await attendanceRepository.findOne({
            where: {
                employee: { id: employeeId },
                date: date,
                check_out: null
            },
            relations: ['employee'] // importante para que el repositorio reconozca la relación
        });

        if (!attendance) {
            return res.status(404).json({ error: "No se encontró una asistencia pendiente de check-out para este empleado y fecha." });
        }

        attendance.check_out = check_out;

        if (status) {
            attendance.status = status;
        }
        if (note_out) {
            attendance.note_out = note_out;
        }

        await attendanceRepository.save(attendance);

        res.status(200).json({ message: "Check-out registrado con éxito.", attendance });
    } catch (error) {
        console.error("Error al registrar el check-out:", error);
        res.status(500).json({ error: "Error interno del servidor al registrar el check-out." });
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
        const roleSalaryRepository = dataSource.getRepository(RoleSalarySchema);

        const employees = await employeeRepository.find({
                    relations: ['work_schedule', 'work_schedule.schedules']
                });

        // Obtener todos los empleados activos
        //const employees = await employeeRepository.find();

        if (!employees.length) {
          return res.status(404).json({ error: "No hay empleados registrados." });
        }

        const generatedPayrolls = [];
        const errors = [];

        // Obtener el último día del mes
        const lastDay = getLastDayOfMonth(year, month);
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        for (const employee of employees) {
          // Verificar si ya existe una nómina para este empleado en el mes y año
          const existingPayroll = await payrollRepository.findOne({
            where: {
                employee: { id: employee.id },
                month: month,
                year: year
            }
          });
          if (existingPayroll) {
            // Si ya existe una nómina para este empleado en esas fechas, no la creamos
            errors.push(`Ya existe una nómina para ${employee.name} en ${month}/${year}.`);
            continue;
          }

          const workSchedule = employee.work_schedule.find(ws =>
              Number(ws.month) === Number(month) && Number(ws.year) === Number(year)
          );

                      if (!workSchedule) {
                          errors.push(`El empleado ${employee.name} no tiene un horario de trabajo para ${month}/${year}.`);
                          continue;
                      }

          // Obtener el salario base, earnings y deductions del rol del empleado
          const roleSalary = await roleSalaryRepository.findOne({ where: { role: employee.role } });

          if (!roleSalary) {
            console.log(`No se encontró salario para el rol ${employee.role}`);
            continue;
          }

          // Parsear earnings y deductions como arrays
          let earnings = JSON.parse(roleSalary.earnings);
          const deductions = JSON.parse(roleSalary.deductions);

          // Buscar fichajes del mes y año para cada empleado
          const attendances = await attendanceRepository.find({
            where: {
              employee: { id: employee.id },
              date: Between(startDate, endDate)
            }
          });

          /*if (!attendances.length) {
            console.log(`No hay registros de asistencia para ${employee.name} en ${month}/${year}.`);
            continue;
          }*/

          let totalHours = 0;

          attendances.forEach(attendance => {
            if (attendance.check_out) {
              const date = attendance.date;
              const checkInTime = `${date}T${attendance.check_in}`;
              const checkOutTime = `${date}T${attendance.check_out}`;

              const start = new Date(checkInTime);
              const end = new Date(checkOutTime);

              if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.warn(`Atención: fechas inválidas para ${employee.name} en ${attendance.date}`);
                return;
              }

              const workedHours = (end - start) / (1000 * 60 * 60);
              totalHours += workedHours;
            } else {
              console.warn(`Atención: Registro de asistencia sin check_out para el empleado ${employee.id} en ${attendance.date}`);
            }
          });

          if (isNaN(totalHours)) {
            console.warn(`Atención: total_hours no es un número válido para el empleado ${employee.id}`);
            totalHours = 0;
          }

          const hourlyRate = employee.hourlyRate || calculateAmount(employee.role);

          if (isNaN(hourlyRate)) {
            console.warn(`Atención: hourlyRate no es un número válido para el empleado ${employee.id}`);
            hourlyRate = 0;
          }

          const amount_hours = totalHours * hourlyRate;

          if (isNaN(amount_hours)) {
            console.warn(`Atención: amount_hours no es un número válido para el empleado ${employee.id}`);
            amount_hours = 0;
          }

          const adjustedBaseSalary = (parseFloat(roleSalary.base_salary) / 160) * totalHours;
          const baseSalary = parseFloat(roleSalary.base_salary);  // Asegurarse de que baseSalary está definido

          // Modificar earnings para reflejar el salario base ajustado y otros conceptos
           earnings = earnings.map((earning) => {
                  let adjustedAmount = parseFloat(earning.amount);
                  if (earning.name === "Salario Base") {
                    adjustedAmount = adjustedBaseSalary;
                  } else if (earning.name === "Plus Transporte") {
                    if (totalHours > 160)
                    {
                        adjustedAmount = (parseFloat(earning.amount) / 160 ) * 160;
                    }
                    else
                    {
                        adjustedAmount = (parseFloat(earning.amount) / 160 ) * totalHours;
                    }

                  } else if (["Paga Extra X", "Paga Extra Navidad"].includes(earning.name)) {
                    adjustedAmount = (parseFloat(earning.amount) * adjustedBaseSalary) / baseSalary;
                  }
                  return {
                    name: earning.name,
                    amount: adjustedAmount.toFixed(2)
                  };
                });

          const totalEarnings = earnings.reduce((acc, earning) => acc + parseFloat(earning.amount), 0);

          // Calcular deducciones basadas en el total devengado
          const adjustedDeductions = deductions.map((deduction) => {
            const adjustedAmount = (parseFloat(deduction.percentage) / 100) * totalEarnings;
            return {
              name: deduction.name,
              percentage: deduction.percentage,
              amount: adjustedAmount.toFixed(2)
            };
          });

          const totalDeductions = adjustedDeductions.reduce((acc, deduction) => acc + parseFloat(deduction.amount), 0);

          const newPayroll = payrollRepository.create({
            month,
            year,
            total_hours: totalHours.toFixed(2),
            base_salary: adjustedBaseSalary.toFixed(2),
            amount_hours: amount_hours.toFixed(2),
            employee,
            earnings: JSON.stringify(earnings),
            deductions: JSON.stringify(adjustedDeductions),
            total_amount: (totalEarnings - totalDeductions).toFixed(2),
          });

          await payrollRepository.save(newPayroll);
          generatedPayrolls.push(newPayroll);
        }

        if (errors.length > 0) {
            return res.status(207).json({ message: "Algunas nóminas no se generaron.", errors, payrolls: generatedPayrolls });
        }

        res.status(201).json({ message: "Nóminas generadas correctamente.", payrolls: generatedPayrolls });
    } catch (error) {
        console.error("Error al generar nóminas:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});



app.put('/payroll/recalculate/:id', async (req, res) => {
    const { month, year, employee_id, total_hours_from_user } = req.body;  // Recibir el ID del empleado y las horas totales

        if (!month || !year || !employee_id || total_hours_from_user === undefined) {
            return res.status(400).json({ error: "Se requiere el mes, el año, el ID del empleado y las horas totales para actualizar la nómina." });
        }

        try {
            const payrollRepository = dataSource.getRepository(PayrollSchema);
            const employeeRepository = dataSource.getRepository(EmployeeSchema);
            const roleSalaryRepository = dataSource.getRepository(RoleSalarySchema);

            // Buscar la nómina existente para el empleado, mes y año proporcionado
            const existingPayroll = await payrollRepository.findOne({
                where: {
                    employee: { id: employee_id },
                    month: month,
                    year: year
                }
            });

            if (!existingPayroll) {
                return res.status(404).json({ error: `No se encontró una nómina para el empleado con ID ${employee_id} en ${month}/${year}.` });
            }

            const employee = await employeeRepository.findOne({ where: { id: employee_id } });

            if (!employee) {
                return res.status(404).json({ error: `Empleado con ID ${employee_id} no encontrado.` });
            }

            const roleSalary = await roleSalaryRepository.findOne({ where: { role: employee.role } });

            if (!roleSalary) {
                console.log(`No se encontró salario para el rol ${employee.role}`);
                return res.status(404).json({ error: `No se encontró salario para el rol ${employee.role}.` });
            }

            // Parsear earnings y deductions como arrays
            let earnings = JSON.parse(roleSalary.earnings);
            const deductions = JSON.parse(roleSalary.deductions);

            let totalHours = total_hours_from_user;  // Usamos las horas proporcionadas por el usuario

            if (isNaN(totalHours)) {
                console.warn(`Atención: total_hours_from_user no es un número válido para el empleado ${employee.id}`);
                totalHours = 0;
            }

            const hourlyRate = employee.hourlyRate || calculateAmount(employee.role);

            if (isNaN(hourlyRate)) {
                console.warn(`Atención: hourlyRate no es un número válido para el empleado ${employee.id}`);
                hourlyRate = 0;
            }

            const amount_hours = totalHours * hourlyRate;

            if (isNaN(amount_hours)) {
                console.warn(`Atención: amount_hours no es un número válido para el empleado ${employee.id}`);
                amount_hours = 0;
            }

            const adjustedBaseSalary = (parseFloat(roleSalary.base_salary) / 160) * totalHours;
            const baseSalary = parseFloat(roleSalary.base_salary);  // Asegurarse de que baseSalary está definido

            // Modificar earnings para reflejar el salario base ajustado y otros conceptos
            earnings = earnings.map((earning) => {
                let adjustedAmount = parseFloat(earning.amount);
                if (earning.name === "Salario Base") {
                    adjustedAmount = adjustedBaseSalary;
                } else if (earning.name === "Plus Transporte") {
                    if (totalHours > 160) {
                        adjustedAmount = (parseFloat(earning.amount) / 160 ) * 160;
                    } else {
                        adjustedAmount = (parseFloat(earning.amount) / 160 ) * totalHours;
                    }
                } else if (["Paga Extra X", "Paga Extra Navidad"].includes(earning.name)) {
                    adjustedAmount = (parseFloat(earning.amount) * adjustedBaseSalary) / baseSalary;
                }
                return {
                    name: earning.name,
                    amount: adjustedAmount.toFixed(2)
                };
            });

            const totalEarnings = earnings.reduce((acc, earning) => acc + parseFloat(earning.amount), 0);

            // Calcular deducciones basadas en el total devengado
            const adjustedDeductions = deductions.map((deduction) => {
                const adjustedAmount = (parseFloat(deduction.percentage) / 100) * totalEarnings;
                return {
                    name: deduction.name,
                    percentage: deduction.percentage,
                    amount: adjustedAmount.toFixed(2)
                };
            });

            const totalDeductions = adjustedDeductions.reduce((acc, deduction) => acc + parseFloat(deduction.amount), 0);

            // Actualizar la nómina existente con los nuevos valores
            existingPayroll.total_hours = totalHours.toFixed(2);
            existingPayroll.base_salary = adjustedBaseSalary.toFixed(2);
            existingPayroll.amount_hours = amount_hours.toFixed(2);
            existingPayroll.earnings = JSON.stringify(earnings);
            existingPayroll.deductions = JSON.stringify(adjustedDeductions);
            existingPayroll.total_amount = (totalEarnings - totalDeductions).toFixed(2);

            await payrollRepository.save(existingPayroll);  // Guardar los cambios

            res.status(200).json({ message: "Nómina actualizada correctamente.", payroll: existingPayroll });

        } catch (error) {
            console.error("Error al actualizar nómina:", error);
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
            return res.status(200).json({
                status: "success",
                data: [] // Retorna lista vacía en vez de 404
            });
        }

        // Formatear la respuesta
        const formattedAttendances = attendances.map((attendance) => {
            const attendanceDate = new Date(attendance.date);
            const checkInTime = attendance.check_in; // '8:00:00'
            let checkOutTime = attendance.check_out; // Puede ser null o vacío

            // Si check_in es válido, separamos en horas y minutos
            const [checkInHour, checkInMinute] = checkInTime ? checkInTime.split(':') : [null, null];

            // Si check_out es válido, separamos en horas y minutos, si no, asignamos valores por defecto
            let [checkOutHour, checkOutMinute] = checkOutTime ? checkOutTime.split(':') : [null, null];



            // Para check_out, si no existe, podemos manejarlo de manera flexible:
            if (!checkOutHour || !checkOutMinute) {
                // Aquí puedes asignar un valor predeterminado o dejarlo como nulo
                // Por ejemplo, podríamos dejarlo como "00:00:00" si no se hizo check-out
                checkOutHour = '00';
                checkOutMinute = '00';
            }

            // Crear una nueva fecha combinando la fecha y la hora de check_in y check_out
            const checkInDateTime = new Date(attendanceDate);
            checkInDateTime.setHours(checkInHour, checkInMinute, 0); // Los segundos siempre en 0

            const checkOutDateTime = new Date(attendanceDate);
            checkOutDateTime.setHours(checkOutHour, checkOutMinute, 0); // Los segundos siempre en 0

            // Formatear la hora a 'HH:mm:ss' para incluir segundos
            const checkInFormatted = `${checkInDateTime.getHours()}:${checkInDateTime.getMinutes() < 10 ? '0' + checkInDateTime.getMinutes() : checkInDateTime.getMinutes()}:00`;
            const checkOutFormatted = `${checkOutDateTime.getHours()}:${checkOutDateTime.getMinutes() < 10 ? '0' + checkOutDateTime.getMinutes() : checkOutDateTime.getMinutes()}:00`;

            const status = attendance.status;
            const absence_reason = attendance.absence_reason;
            const justified = attendance.justified;
            const justification_url = attendance.justification_url;
            const note_in = attendance.note_in;
            const note_out = attendance.note_out;

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
                date: attendanceDate.toISOString().split('T')[0], // Solo la fecha (YYYY-MM-DD)
                status: status,
                absence_reason: absence_reason,
                justified: justified,
                justification_url: justification_url,
                note_in: note_in,
                note_out: note_out
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




////////////////////////////////////////////////////////////////////////////////////////////////



sgMail.setApiKey('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');






function generateResetToken(userId) {
  const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, { expiresIn: '30m' });
  return resetToken;
}

app.post('/employee/forgot-password', async (req, res) => {
  const messages = {
          noUserFound: {
            es: 'Ningún usuario encontrado con este correo electrónico.',
            ca: 'No ha sigut trobat cap usuari amb aquest correu electrònic.',
            en: 'No user found with this email.'
          }
        };

  const lang = req.headers['accept-language'] || 'en'; // Obtener el idioma de la cabecera
  const msgContent = messages;
  const { email } = req.body;
  const employee = await dataSource.getRepository(EmployeeSchema).findOne({ where: { email } });

  if (!employee) {
    return res.status(404).json({ message: msgContent.noUserFound[lang] });
  }

  const resetToken = generateResetToken(employee.id);
  employee.resetToken = resetToken; // Almacenar el token en la base de datos
  await dataSource.getRepository(EmployeeSchema).save(employee);
  await sendPasswordResetEmail(employee.email, resetToken, lang);

  res.json({ message: 'An email with password reset instructions has been sent.' });
});

async function sendPasswordResetEmail(email, resetToken, lang) {
  const resetUrl = `http://localhost:4000/reset-password?token=${resetToken}&lang=${lang}`;
  console.log("FUNCTION-> ", lang);

      const messages = {
          es: {
            subject: 'Restablecer tu contraseña',
            greeting: 'Hola,',
            receivedRequest: 'Hemos recibido una solicitud para restablecer tu contraseña.',
            clickLink: 'Para continuar con el proceso, haz clic en el siguiente enlace:',
            ignoreMessage: 'Si no has solicitado este cambio, puedes ignorar este mensaje.',
            expires: 'Este enlace expirará en 30 minutos.',
            regards: 'Saludos,',
            team: 'El equipo de Lifeguard S.L.',
            buttonText: 'Restablecer contraseña'
          },
          ca: {
            subject: 'Restablir la teva contrasenya',
            greeting: 'Hola,',
            receivedRequest: 'Hem rebut una sol·licitud per restablir la teva contrasenya.',
            clickLink: 'Per continuar amb el procés, fes clic al següent enllaç:',
            ignoreMessage: 'Si no has sol·licitat aquest canvi, pots ignorar aquest missatge.',
            expires: 'Aquest enllaç caducarà en 30 minuts.',
            regards: 'Salutacions,',
            team: "L'equip de Lifeguard S.L.",
            buttonText: 'Restablir contrasenya'
          },
          en: {
            subject: 'Reset your password',
            greeting: 'Hello,',
            receivedRequest: 'We received a request to reset your password.',
            clickLink: 'To continue, click the following link:',
            ignoreMessage: 'If you did not request this, you can ignore this message.',
            expires: 'This link will expire in 30 minutes.',
            regards: 'Regards,',
            team: 'The Lifeguard S.L. Team',
            buttonText: 'Reset Password'
          }
        };

      const msgContent = messages[lang] || messages['es'];

  const msg = {
    to: email,
    from: 'lifeguardtfg@gmail.com',
    subject: msgContent.subject,
    text: `
        ${msgContent.greeting}

        ${msgContent.receivedRequest}

        ${msgContent.clickLink}

        ${resetUrl}

        ${msgContent.ignoreMessage}

        ${msgContent.expires}

        ${msgContent.regards}
        ${msgContent.team}
      `,
    html: `
        <p>${msgContent.greeting}</p>
        <p>${msgContent.receivedRequest}</p>
        <p>${msgContent.clickLink}</p>
        <p><a href="${resetUrl}" style="color: #007bff; text-decoration: none; font-weight: bold;">${msgContent.buttonText}</a></p>
        <p>${msgContent.ignoreMessage}</p>
        <p><strong>${msgContent.expires}</strong></p>
        <br>
        <p>${msgContent.regards}</p>
        <p><strong>${msgContent.team}</strong></p>
      `,
  };

  try {
    await sgMail.send(msg);
    console.log('Correo enviado con éxito');
  } catch (error) {
    console.error('Error al enviar el correo:', error.response.body);
  }
}

app.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  console.log("Body recibido:", req.body);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await dataSource.getRepository(EmployeeSchema).findOne({ where: { id: decoded.userId, resetToken: token } });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    await dataSource.getRepository(EmployeeSchema).save(user);

    res.json({ message: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    return res.status(400).json({ message: 'Token inválido o expirado.' });
  }
});

app.get('/reset-password', (req, res) => {
  const token = req.query.token;
  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
  res.redirect(resetUrl);
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function generateResetTokenApp(userId) {
  const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, { expiresIn: '30m' });
  return resetToken;
}

app.post('/employee/forgot-passwordApp', async (req, res) => {
  const lang = req.headers['accept-language'] || 'en';
    console.log("forgot-passwordApp POST-> ", lang);
  const { email } = req.body;
  const employeeRepository = dataSource.getRepository(EmployeeSchema);
  const employee = await employeeRepository.findOne({ where: { email } });

  if (!employee) {
    return res.status(404).json({ message: 'No user found with this email.' });
  }

  employee.resetToken = null;
  await employeeRepository.save(employee);
  const resetToken = generateResetTokenApp(employee.id);
  employee.resetToken = resetToken; // Almacenar el token en la base de datos
  await employeeRepository.save(employee);
  await sendPasswordResetEmailApp(employee.email, resetToken, lang);

  res.json({ message: 'An email with password reset instructions has been sent.' });
});

async function sendPasswordResetEmailApp(email, resetToken, lang) {
  const resetUrl = `http://192.168.1.34:4000/reset-passwordApp?token=${resetToken}&lang=${lang}`;
  console.log("FUNCTION-> ", lang);

  const messages = {
        es: {
          subject: 'Restablecer tu contraseña',
          greeting: 'Hola,',
          receivedRequest: 'Hemos recibido una solicitud para restablecer tu contraseña.',
          clickLink: 'Para continuar con el proceso, haz clic en el siguiente enlace:',
          ignoreMessage: 'Si no has solicitado este cambio, puedes ignorar este mensaje.',
          expires: 'Este enlace expirará en 30 minutos.',
          regards: 'Saludos,',
          team: 'El equipo de Lifeguard S.L.',
          buttonText: 'Restablecer contraseña'
        },
        ca: {
          subject: 'Restablir la teva contrasenya',
          greeting: 'Hola,',
          receivedRequest: 'Hem rebut una sol·licitud per restablir la teva contrasenya.',
          clickLink: 'Per continuar amb el procés, fes clic al següent enllaç:',
          ignoreMessage: 'Si no has sol·licitat aquest canvi, pots ignorar aquest missatge.',
          expires: 'Aquest enllaç caducarà en 30 minuts.',
          regards: 'Salutacions,',
          team: "L'equip de Lifeguard S.L.",
          buttonText: 'Restablir contrasenya'
        },
        en: {
          subject: 'Reset your password',
          greeting: 'Hello,',
          receivedRequest: 'We received a request to reset your password.',
          clickLink: 'To continue, click the following link:',
          ignoreMessage: 'If you did not request this, you can ignore this message.',
          expires: 'This link will expire in 30 minutes.',
          regards: 'Regards,',
          team: 'The Lifeguard S.L. Team',
          buttonText: 'Reset Password'
        }
      };

      const msgContent = messages[lang] || messages['es'];

  const msg = {
    to: email,
    from: 'lifeguardtfg@gmail.com',
    subject: msgContent.subject,
    text: `
        ${msgContent.greeting}

        ${msgContent.receivedRequest}

        ${msgContent.clickLink}

        ${resetUrl}

        ${msgContent.ignoreMessage}

        ${msgContent.expires}

        ${msgContent.regards}
        ${msgContent.team}
      `,
    html: `
        <p>${msgContent.greeting}</p>
        <p>${msgContent.receivedRequest}</p>
        <p>${msgContent.clickLink}</p>
        <p><a href="${resetUrl}" style="color: #007bff; text-decoration: none; font-weight: bold;">${msgContent.buttonText}</a></p>
        <p>${msgContent.ignoreMessage}</p>
        <p><strong>${msgContent.expires}</strong></p>
        <br>
        <p>${msgContent.regards}</p>
        <p><strong>${msgContent.team}</strong></p>
      `,
  };

  try {
    await sgMail.send(msg);
    console.log('Correo enviado con éxito');
  } catch (error) {
    console.error('Error al enviar el correo:', error.response.body);
  }
}

app.post('/reset-passwordApp', async (req, res) => {
  const { token, password, lang } = req.body;

  const messages = {
        invalidOrExpiredToken: {
          es: 'Token inválido o expirado.',
          ca: 'Testimoni invàlid o caducat.',
          en: 'Invalid or expired token.'
        },
        tokenUsedOrInvalid: {
          es: 'Token inválido o ya ha sido usado.',
          ca: 'Testimoni invàlid o ja s\'ha utilitzat.',
          en: 'Invalid or already used token.'
        },
        passwordUpdated: {
          es: 'Contraseña actualizada con éxito.',
          ca: 'Contrasenya actualitzada amb èxit.',
          en: 'Password successfully updated.'
        }
      };

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return res.status(400).send(messages.invalidOrExpiredToken[lang]);
  }

  const employeeRepository = dataSource.getRepository(EmployeeSchema);
  const user = await employeeRepository.findOne({ where: { id: decoded.userId } });

  if (!user || user.resetToken !== token) {
    return res.status(400).send(messages.tokenUsedOrInvalid[lang]);
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = null; // Invalida el token tras uso
  await employeeRepository.save(user);

  res.send(messages.passwordUpdated[lang]);
});




app.get('/reset-passwordApp', (req, res) => {
  const token = req.query.token;
  const lang = req.query.lang || req.headers['accept-language']?.split(',')[0].split('-')[0].trim() || 'en';
  console.log("Reset-passwordApp GET-> ", lang);

  const messages = {
        'resetPassword': {
          es: 'Restablecer tu contraseña',
          ca: 'Restablir la teva contrasenya',
          en: 'Reset your password'
        },
        'newPassword': {
          es: 'Nueva contraseña',
          ca: 'Nova contrasenya',
          en: 'New password'
        },
        'confirmPassword': {
          es: 'Repite la contraseña',
          ca: 'Repeteix la contrasenya',
          en: 'Confirm password'
        },
        'changePassword': {
          es: 'Cambiar contraseña',
          ca: 'Canviar contrasenya',
          en: 'Change password'
        },
        'passwordRules': {
          es: '• Mínimo 6 caracteres<br/>• Al menos 1 letra<br/>• Al menos 1 número',
          ca: '• Mínim 6 caràcters<br/>• Almenys 1 lletra<br/>• Almenys 1 número',
          en: '• Minimum 6 characters<br/>• At least 1 letter<br/>• At least 1 number'
        },
        'characters': {
          es: 'Debe tener al menos 6 caracteres.',
          ca: 'Ha de tenir almenys 6 caràcters.',
          en: 'It must have at least 6 characters.'
        },
        'letter': {
          es: 'Debe incluir al menos una letra.',
          ca: 'Ha d\'incloure almenys una lletra.',
          en: 'It must include at least one letter.'
        },
        'num': {
          es: 'Debe incluir al menos un número.',
          ca: 'Ha d\'incloure almenys un número.',
          en: 'It must include at least one number.'
        },
        'errorSendingRequest': {
          es: 'Error al enviar la solicitud.',
          ca: 'Error a l\'enviar la sol·licitud.',
          en: 'Error sending the request.'
        },
        'errorPassword': {
          es: 'Las contraseñas no coinciden.',
          ca: 'Les contrasenyes no coincideixen.',
          en: 'The passwords do not match.'
        }
      };

  res.send(`
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${messages.resetPassword[lang]}</title>
      <style>
        * {
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: #f0f4f8;
        }
        .container {
          background: #fff;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 400px;
        }
        h2 {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .input-group {
          position: relative;
          margin-top: 1rem;
        }
        .input-group input {
          width: 100%;
          padding: 12px 42px 12px 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 16px;
        }
        .toggle-password {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }
        .toggle-password svg {
          width: 20px;
          height: 20px;
          color: #666;
        }
        button[type="submit"] {
          width: 100%;
          padding: 12px;
          background-color: #007bff;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          margin-top: 20px;
          cursor: pointer;
        }
        .error {
          color: red;
          font-size: 14px;
          margin-top: 5px;
        }
        .rules {
          margin-top: 15px;
          font-size: 14px;
          color: #555;
        }
        .success {
          color: green;
          text-align: center;
          margin-top: 15px;
        }
        .loader {
          margin: 20px auto;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          display: none;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${messages.resetPassword[lang]}</h2>
        <form id="resetForm">
          <input type="hidden" name="token" value="${token}" />

          <div class="input-group">
            <input type="password" name="password" id="password" placeholder="${messages.newPassword[lang]}" required />
            <button type="button" class="toggle-password" onclick="togglePassword('password', this)">
              <svg id="eye-password" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          <div class="error" id="passwordError"></div>

          <div class="input-group">
            <input type="password" name="confirmPassword" id="confirmPassword" placeholder="${messages.confirmPassword[lang]}" required />
            <button type="button" class="toggle-password" onclick="togglePassword('confirmPassword', this)">
              <svg id="eye-confirmPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          <div class="error" id="confirmError"></div>

          <button type="submit">${messages.changePassword[lang]}</button>
        </form>

        <div class="rules">
            ${messages.passwordRules[lang]}
        </div>
        <div class="success" id="successMsg"></div>
        <div class="loader" id="loader"></div>
      </div>

      <script>
        const lang = "${lang}";
        const messages = ${JSON.stringify(messages)};
        const form = document.getElementById('resetForm');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const passwordError = document.getElementById('passwordError');
        const confirmError = document.getElementById('confirmError');
        const successMsg = document.getElementById('successMsg');
        const loader = document.getElementById('loader');

        function togglePassword(inputId, btn) {
          const input = document.getElementById(inputId);
          const svg = btn.querySelector('svg');
          const isVisible = input.type === 'text';
          input.type = isVisible ? 'password' : 'text';

          svg.innerHTML = isVisible
            ? \`
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />\`
            : \`
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.957 9.957 0 012.457-3.568M6.177 6.177A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.106 5.107M3 3l18 18" />\`;
        }

        const validate = () => {
          let errors = 0;
          passwordError.textContent = '';
          confirmError.textContent = '';

          const pwd = password.value;
          const confirm = confirmPassword.value;

          if (pwd.length < 6) {
            passwordError.textContent = messages.characters[lang];
            errors++;
          } else if (!/[a-zA-Z]/.test(pwd)) {
            passwordError.textContent = messages.letter[lang];
            errors++;
          } else if (!/[0-9]/.test(pwd)) {
            passwordError.textContent = messages.num[lang];
            errors++;
          }

          if (pwd !== confirm) {
            confirmError.textContent = messages.errorPassword[lang];
            errors++;
          }

          return errors === 0;
        };

        password.addEventListener('input', validate);
        confirmPassword.addEventListener('input', validate);

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (!validate()) return;

          const token = form.token.value;
          const newPassword = password.value;

          try {
            const res = await fetch('/reset-passwordApp', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept-Language': lang
              },
              body: JSON.stringify({ token, password: newPassword, lang })
            });

            const text = await res.text();
            if (res.ok) {
              successMsg.textContent = text;
              form.style.display = 'none';
              loader.style.display = 'block';
              setTimeout(() => {
                window.location.href = 'exp://192.168.1.34:8081';
              }, 3000);
            } else {
              successMsg.style.color = 'red';
              successMsg.textContent = text;
            }
          } catch (err) {
            successMsg.style.color = 'red';
            successMsg.textContent = 'Error al enviar la solicitud.';
          }
        });
      </script>
    </body>
    </html>
  `);
});








//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//LOGIN/////////////////
app.post('/login', async (req, res) => {
    const { id, password } = req.body;

    // Validar que se haya enviado id y password
    if (!id || !password) {
        return res.status(400).json({ message: "Id y contraseña son requeridos." });
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);

        // Buscar al empleado por el DNI (id)
        const employee = await employeeRepository.findOne({ where: { id } });

        if (!employee) {
            return res.status(404).json({ message: "Empleado no encontrado." });
        }

        // Verificar que la contraseña (DNI) proporcionada coincida con la almacenada (encriptada) usando bcrypt
        const isPasswordValid = await bcrypt.compare(password, employee.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Error, la contraseña no es correcta." });
        }

        // Verificar que el rol del empleado sea "Boss"
        if (employee.role !== "Boss") {
            return res.status(403).json({ message: "No tienes acceso al sistema." });
        }

        // Verificar si la clave secreta está definida
        if (!process.env.JWT_SECRET_KEY) {
            return res.status(500).json({ message: "Se requiere una clave secreta para generar el token." });
        }

        // Crear un token de sesión o JWT con el rol
        const token = jwt.sign({ role: "Boss" }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

        return res.json({ Status: "Success", Token: token });

    } catch (error) {
        console.error("Error al autenticar al empleado:", error);
        res.status(500).json({ message: "Error al autenticar al empleado." });
    }
});



app.post('/login_app', async (req, res) => {
    const { id, password } = req.body;

    if (!id || !password) {
        return res.status(400).json({ message: "Id y contraseña son requeridos." });
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);
        const employee = await employeeRepository.findOne({ where: { id } });

        if (!employee) {
            return res.status(404).json({ message: "Empleado no encontrado." });
        }

        const isPasswordValid = await bcrypt.compare(password, employee.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Error, la contraseña no es correcta." });
        }

        if (!process.env.JWT_SECRET_KEY) {
            return res.status(500).json({ message: "Se requiere una clave secreta para generar el token." });
        }

        // Incluir el rol y el id en el token si quieres usarlo más adelante
        const token = jwt.sign(
            { role: employee.role, id: employee.id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1h' }
        );

        return res.json({ Status: "Success", Token: token });

    } catch (error) {
        console.error("Error al autenticar al empleado:", error);
         res.status(500).json({ message: "Error al autenticar al empleado." });
    }
});



// Usar el middleware en rutas protegidas
app.get("/dashboard", authenticateToken, (req, res) => {
    res.json({ message: "Bienvenido al Dashboard", user: req.user });
});


app.listen(port, async () => {
    console.log(`Listening port: ${port}`)
})