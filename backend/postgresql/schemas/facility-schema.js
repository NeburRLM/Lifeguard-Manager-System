import { EntitySchema } from "typeorm";

export const FacilitySchema = new EntitySchema({
    name: "facility",
    tableName: "facilities",
    columns: {
        id: {
            type: "uuid",
            primary: true,
            generated: "uuid"
        },
        name: {
            type: "varchar",
            length: 100
        },
        location: {
            type: "varchar",
            length: 255
        },
        facility_type: {
            type: "enum",
            enum: ["Pool", "Beach"]
        },
        latitude: {
            type: "float",
            nullable: true
        },
        longitude: {
            type: "float",
            nullable: true
        }
    },

    uniqueConstraints: [
            {
                name: "facility_name_location_unique",
                columns: ["name", "location"]
            }
        ],

    relations: {
        employees: {
            type: 'one-to-many',
            target: 'employee',
            inverseSide: 'facility',
            cascade: true
        },
        incidents: {
            type: 'one-to-many',
            target: 'incident',
            inverseSide: 'facility',
            cascade: true
        }
    }
});
