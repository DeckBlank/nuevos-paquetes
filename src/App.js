import React, { useState } from "react";
import "./App.css";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";

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
      const indexVerion = arrayPaquetes.findIndex(
        (paquete) => paquete.split("?")[0] === nombre
      );
      return [
        "",
        recurso,
        nombre,
        version,
        `https://www.npmjs.com/package/${nombre}/v/${version}`,
        "",
        indexVerion !== -1
          ? arrayPaquetes[indexVerion].split("?")[1] < version
            ? "Version Superior"
            : "Version Inferior"
          : "Nuevo",
      ];
    });
    const sortData = data.sort((a, b) => {
      if (a[6] === b[6]) {
        return a[2] > b[2] ? 1 : -1;
      }
      return a[6] > b[6] ? 1 : -1;
    });
    handleDownloadExcel(sortData.map((item,index) => {
      item[0] = index + 1;
      return item;
    }));
  };

  const handleDownloadExcel = async (data) => {
   
    const workbook = new ExcelJS.Workbook();
    
    const response = await fetch("/plantilla.txt");
    const base64Template = await response.text(); 
    const binaryString = atob(base64Template); 
    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uintArray = new Uint8Array(arrayBuffer);
  
    for (let i = 0; i < binaryString.length; i++) {
      uintArray[i] = binaryString.charCodeAt(i);
    }
  
    
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet("Hoja1"); 
    worksheet.name = recurso; 
    
    let rowIndex = 3;

    data.forEach((row) => {
      const newRow = worksheet.getRow(rowIndex); 
      newRow.values = row; 

      const estadoCell = newRow.getCell(7); 
      if (estadoCell.value === "Nuevo") {
        estadoCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF008000" }, 
        };
      } else if (estadoCell.value === "Version Superior") {
        estadoCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0000FF" }, 
        };
      } else if (estadoCell.value === "Version Inferior") {
        estadoCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0000" }, 
        };
      }

      
      rowIndex++;
    });

    
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      saveAs(blob, `${recurso}.xlsx`);
    });
  };

  return (
    <div className="App min-h-screen bg-gray-300">
      <h1 className="text-3xl font-bold text-center p-4">Nuevos Paquetes</h1>
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
