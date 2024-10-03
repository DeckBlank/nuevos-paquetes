import React, { useState } from "react";
import "./App.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function App() {
  const [approvedPackages, setApprovedPackages] = useState("");
  const [packageInput, setPackageInput] = useState("");
  const [recurso, setRecurso] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!approvedPackages) {
      setErrors({ approvedPackages: "Campo requerido" });
      return;
    }
    if (!packageInput) {
      setErrors({ packageInput: "Campo requerido" });
      return;
    }
    try {
      JSON.parse(packageInput);
    } catch (error) {
      setErrors({ packageInput: "Formato Package inválido" });
      return;
    }
    if (!recurso) {
      setErrors({ recurso: "Campo requerido" });
      return;
    }
    const arrayPaquetes = approvedPackages.split("\n");
    const objetoPaquete = JSON.parse(packageInput);
    const dependencies = [];
    for (const key in objetoPaquete.dependencies) {
      dependencies.push(
        `${key}?${objetoPaquete.dependencies[key].replace("^", "")}`
      );
    }
    for (const key in objetoPaquete.devDependencies) {
      dependencies.push(
        `${key}?${objetoPaquete.devDependencies[key].replace("^", "")}`
      );
    }
    const nuevosPaquetes = dependencies.filter(
      (dependencia) => !arrayPaquetes.includes(dependencia)
    );
    const data = nuevosPaquetes.map((item) => {
      const [nombre, version] = item.split("?");
      return [
        recurso,
        nombre,
        version,
        `https://www.npmjs.com/package/${nombre}/v/${version}`,
        arrayPaquetes.find((paquete) => paquete.includes(nombre))
          ? "Version"
          : "Nuevo",
        "",
      ];
    });
    handleDownloadExcel(data);
  };

  const handleDownloadExcel = (data) => {
    const headers = [
      "RECURSO",
      "NOMBRE PAQUETE",
      "VERSIÒN",
      "URL",
      "ESTADO",
      "SUSTENTO",
    ];

    const worksheetData = [headers, ...data];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Paquetes");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "paquetes.xlsx");
  };

  return (
    <div className="App min-h-screen bg-gray-300">
      <h1 className="text-3xl font-bold text-center mb-4">
        Nuevos Paquetes
      </h1>
      <form
        onSubmit={handleSubmit}
        className="p-6 max-w-md mx-auto bg-white shadow-md rounded-md"
      >
        <div className="mb-4">
          <label
            htmlFor="approvedPackages"
            className="block text-gray-700 font-bold mb-2"
          >
            Paquetes Aprobados
          </label>
          <div className="text-gray-600 text-sm mt-2">
            Escribe los paquetes aprobados separados por salto de línea
            "nombrePaquete?version".
          </div>
          <textarea
            id="approvedPackages"
            value={approvedPackages}
            onChange={(e) => setApprovedPackages(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Escribe los paquetes aprobados aquí..."
          ></textarea>

          <div className="text-red-600 text-sm mt-2">
            {errors.approvedPackages}
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="packageInput"
            className="block text-gray-700 font-bold mb-2"
          >
            Package
          </label>
          <div className="text-gray-600 text-sm mt-2">
            Copia y pega el contenido del package.json aquí.
          </div>
          <textarea
            id="packageInput"
            value={packageInput}
            onChange={(e) => setPackageInput(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Escribe el package aquí..."
          ></textarea>

          <div className="text-red-600 text-sm mt-2">{errors.packageInput}</div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="recurso"
            className="block text-gray-700 font-bold mb-2"
          >
            Recurso
          </label>
          <div className="text-red-600 text-sm mt-2">{errors.recurso}</div>
          <input
            type="text"
            id="recurso"
            value={recurso}
            onChange={(e) => setRecurso(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Escribe el recurso aquí..."
          />
        </div>

        <button
          type="submit"
          className="blue text-white font-bold py-2 px-4 rounded-md bg-blue-600"
        >
          Descargar Excel
        </button>
      </form>
    </div>
  );
}

export default App;
