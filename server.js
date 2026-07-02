require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const apiRoutes = require("./src/routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`LaserTec corriendo en http://localhost:${PORT}`);
});
