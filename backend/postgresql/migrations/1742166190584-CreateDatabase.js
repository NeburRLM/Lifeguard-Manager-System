//const { MigrationInterface, QueryRunner } = require("typeorm");

export class CreateDatabase1742166190584 {
    name = 'CreateDatabase1742166190584'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "work_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "month" integer NOT NULL, "year" integer NOT NULL, "employeeId" character varying(9), CONSTRAINT "PK_f5251879700e5ca0d2e353fa34f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "start_time" TIME NOT NULL DEFAULT '10:00:00', "end_time" TIME NOT NULL DEFAULT '19:00:00', "workScheduleId" uuid, "facilityId" uuid, CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payrolls" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "month" integer NOT NULL, "year" integer NOT NULL, "total_hours" numeric(5,2) NOT NULL DEFAULT '0', "amount" numeric(10,2) NOT NULL, "employee_id" character varying NOT NULL, CONSTRAINT "PK_4fc19dcf3522661435565b5ecf3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_payroll_employee" ON "payrolls" ("employee_id") `);
        await queryRunner.query(`CREATE TYPE "public"."incidents_type_enum" AS ENUM('Heridas en la piel y cortes', 'Picaduras de medusa', 'Picaduras de pez araña', 'Picadura desconocida', 'Quemaduras solares', 'Golpes de calor', 'Ahogamiento en la playa', 'Atragantamiento', 'Insolación')`);
        await queryRunner.query(`CREATE TABLE "incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."incidents_type_enum" NOT NULL, "description" text NOT NULL, "date" TIMESTAMP NOT NULL DEFAULT now(), "facilityId" uuid, "reportedById" character varying(9), CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."facilities_facility_type_enum" AS ENUM('Pool', 'Beach')`);
        await queryRunner.query(`CREATE TABLE "facilities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "location" character varying(255) NOT NULL, "facility_type" "public"."facilities_facility_type_enum" NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, CONSTRAINT "PK_2e6c685b2e1195e6d6394a22bc7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."employees_role_enum" AS ENUM('Boss', 'Lifeguard', 'Coordinator')`);
        await queryRunner.query(`CREATE TABLE "employees" ("id" character varying(9) NOT NULL, "name" character varying(100) NOT NULL, "role" "public"."employees_role_enum" NOT NULL, "email" character varying(100) NOT NULL, "password" character varying(255) NOT NULL, "birthdate" date, "phone_number" character varying(15), "hourlyRate" numeric(10,2) NOT NULL, "image" character varying, CONSTRAINT "UQ_b9535a98350d5b26e7eb0c26af4" UNIQUE ("id"), CONSTRAINT "UQ_765bc1ac8967533a04c74a9f6af" UNIQUE ("email"), CONSTRAINT "UQ_027a331b2053bb37f39fb2704fb" UNIQUE ("phone_number"), CONSTRAINT "UQ_9920edfb66899c3062b046749c2" UNIQUE ("image"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attendances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "check_in" TIME NOT NULL, "check_out" TIME, "employee_id" character varying NOT NULL, "facility_id" uuid NOT NULL, CONSTRAINT "PK_483ed97cd4cd43ab4a117516b69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_attendance_employee" ON "attendances" ("employee_id") `);
        await queryRunner.query(`CREATE INDEX "idx_attendance_facility" ON "attendances" ("facility_id") `);
        await queryRunner.query(`ALTER TABLE "work_schedules" ADD CONSTRAINT "FK_a87dbb92dd7ca854dffdede9710" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_5c07b8ac670ef9a30b5d40edc66" FOREIGN KEY ("workScheduleId") REFERENCES "work_schedules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedules" ADD CONSTRAINT "FK_96272a08a82207200a0795f1c4f" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payrolls" ADD CONSTRAINT "FK_5145d894f823722a43ec3e1955e" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_4a086804fc22500d7f51d48f1bf" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_9f2e530317309ad9b7dccbff578" FOREIGN KEY ("reportedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendances" ADD CONSTRAINT "FK_43dca8b4751d7449a38b583991c" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendances" ADD CONSTRAINT "FK_7a17ef197e3091fb00b5ae31b7d" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_7a17ef197e3091fb00b5ae31b7d"`);
        await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_43dca8b4751d7449a38b583991c"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_9f2e530317309ad9b7dccbff578"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_4a086804fc22500d7f51d48f1bf"`);
        await queryRunner.query(`ALTER TABLE "payrolls" DROP CONSTRAINT "FK_5145d894f823722a43ec3e1955e"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_96272a08a82207200a0795f1c4f"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_5c07b8ac670ef9a30b5d40edc66"`);
        await queryRunner.query(`ALTER TABLE "work_schedules" DROP CONSTRAINT "FK_a87dbb92dd7ca854dffdede9710"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attendance_facility"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attendance_employee"`);
        await queryRunner.query(`DROP TABLE "attendances"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TYPE "public"."employees_role_enum"`);
        await queryRunner.query(`DROP TABLE "facilities"`);
        await queryRunner.query(`DROP TYPE "public"."facilities_facility_type_enum"`);
        await queryRunner.query(`DROP TABLE "incidents"`);
        await queryRunner.query(`DROP TYPE "public"."incidents_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payroll_employee"`);
        await queryRunner.query(`DROP TABLE "payrolls"`);
        await queryRunner.query(`DROP TABLE "schedules"`);
        await queryRunner.query(`DROP TABLE "work_schedules"`);
    }
}
