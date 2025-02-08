import { DataSource } from "typeorm";

export const dataSource = new DataSource({

    database: "tfg",
    entities: ["postgresql/schemas/*.js"],
    host: "localhost",
    password: "tfg",
    migrations: ["postgresql/migrations/*.js"],
    port: 5432,
    type: "postgres",
    username: "postgres"
})