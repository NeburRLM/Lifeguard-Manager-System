import express from 'express';
import { dataSource } from './postgresql/data-source.js';
import { EmployeeSchema } from './postgresql/schemas/employee-schema.js';
import { FacilitySchema } from './postgresql/schemas/facility-schema.js';
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

// Ruta para obtener todos los empleados
// Ruta para obtener todos los empleados
app.get('/employees', async (req, res) => {
    try {
        // Obtener todos los empleados y cargar la relación 'facility'
        const employees = await dataSource.getRepository(EmployeeSchema)
            .createQueryBuilder("employee")
            .leftJoinAndSelect("employee.facility", "facility")  // Aquí se incluye la relación
            .getMany();

        // Si no hay empleados, devuelve un mensaje
        if (employees.length === 0) {
            return res.status(404).json({ message: 'No employees found' });
        }

        // Devuelve los empleados con su relación 'facility' en formato JSON
        res.json(employees);
    } catch (error) {
        // Manejo de errores
        console.error(error);
        res.status(500).json({ message: 'Error retrieving employees', error: error.message });
    }
});



// Ruta para crear un nuevo empleado
// Ruta para crear un nuevo empleado
app.post('/employee', async (req, res) => {
    const { name, role, email, password, facilityId } = req.body;

    // Validar que todos los campos estén presentes
    if (!name || !role || !email || !password) {
        return res.status(400).send("Todos los campos son requeridos.");
    }

    try {
        const employeeRepository = dataSource.getRepository(EmployeeSchema);

        // Verificar si ya existe un empleado con el mismo email
        const existingEmployee = await employeeRepository.findOneBy({ email });
        if (existingEmployee) {
            return res.status(409).send("El empleado con este correo ya existe.");
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
            name,
            role,
            email,
            password,
            facility: facility || null,  // Asignamos la instalación si existe
        });

        // Guardar el nuevo empleado en la base de datos
        await employeeRepository.save(newEmployee);

        res.status(201).json(newEmployee); // Devolvemos el empleado creado
    } catch (error) {
        console.error("Error al guardar el empleado:", error);
        res.status(500).send("Error al guardar el empleado.");
    }
});



app.put('/employee/:id', async (req, res) => {
    const { id } = req.params;
    const { facilityId } = req.body;  // Esperamos que nos pase el `facilityId` en el cuerpo de la solicitud

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
        employee.facility = facility;  // Asignamos la instalación al empleado

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
    const { name, location, facility_type } = req.body;

    // Verificar que los datos no estén vacíos
    if (!name || !location || !facility_type) {
        return res.status(400).send("Todos los campos son obligatorios.");
    }

    try {
        const facilityRepository = dataSource.getRepository(FacilitySchema);

        // Verificar si ya existe una instalación con el mismo nombre y ubicación
        const existingFacility = await facilityRepository.findOneBy({
            name,
            location
        });

        if (existingFacility) {
            return res.status(409).send("Ya existe una instalación con este nombre y ubicación.");
        }

        // Crear el nuevo facility
        const facility = await facilityRepository.save(req.body);
        res.json(facility);

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


app.listen(port, async () => {
    console.log(`Listening port: ${port}`)
})