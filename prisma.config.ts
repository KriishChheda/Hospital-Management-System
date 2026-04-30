import "dotenv/config"; // ive done import dotenv and dotenv.config() at the same time
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma", // location of the schema file
  datasource: {
    url: env("DATABASE_URL"),
  }, // location of my data source which is to be connected to
});





// we create a config file here, where we pass the database connectivity details, like the database url to connect to, the model location etc to prisma. 
// this confif files basically connects the prisma to postygres sql. 