import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  Typography
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { BrowserQRCodeReader } from "@zxing/browser";
import toast, { Toaster } from "react-hot-toast";
import dayjs from "dayjs";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import ExcelJS from "exceljs";
import JsBarcode from "jsbarcode";

interface EmpleadoQR {
  proyecto: string;
  idEmpleado: string;
  nombre: string;
}

interface Asistencia {
  idEmpleado: string;
  nombre: string;
  fecha: string;
  hora: string;
}

export default function App() {

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef(new BrowserQRCodeReader());
  const [escaneando, setEscaneando] = useState(false);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [camaraActiva, setCamaraActiva] = useState(false);

  useEffect(() => {
    const datos = localStorage.getItem("asistencias");
    if (datos) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAsistencias(JSON.parse(datos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "asistencias",
      JSON.stringify(asistencias)
    );
  }, [asistencias]);


  useEffect(() => {

    if (!camaraActiva) {
      return;
    }

    const abrir = async () => {
      if (!videoRef.current) {
        return;
      }
      try {
        await codeReader.current.decodeFromConstraints(
          {
            video: {
              facingMode: {
                ideal: "environment"
              }
            }
          },
          videoRef.current,
          (result, error) => {
            if (result && !escaneando) {
              setEscaneando(true);

              // eslint-disable-next-line react-hooks/immutability
              registrarQR(result.getText());
              setTimeout(() => {
                setEscaneando(false);
              }, 2000);
            }
            if (
              error &&
              error.name !== "NotFoundException"
            ) {
              console.error(
                "Error del lector QR:",
                error
              );
            }
          }
        );
      } catch (e) {
        console.error(
          "Error al abrir la cámara:",
          e
        );

        toast.error(
          "No fue posible abrir la cámara."
        );
      }
    };
    abrir();
    return () => {
      //codeReader.current.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camaraActiva]);

  const iniciarCamara = () => {
    setCamaraActiva(true);
  };

  const detenerCamara = () => {
    //codeReader.current.reset();
    setCamaraActiva(false);
  };


  const descargarExcel = async () => {

    const hoy = dayjs().format("YYYY-MM-DD");

    const registrosHoy = asistencias.filter(
      a => a.fecha === hoy
    );

    if (registrosHoy.length === 0) {
      toast.error(
        "No existen asistencias registradas el día de hoy."
      );
      return;
    }

    try {

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        "Asistencia"
      );
      worksheet.columns = [

        {
          header: "ID Empleado",
          key: "idEmpleado",
          width: 24
        },

        {
          header: "Nombre",
          key: "nombre",
          width: 30
        },

        {
          header: "Fecha",
          key: "fecha",
          width: 16
        },

        {
          header: "Hora Entrada",
          key: "hora",
          width: 18
        },

        {
          header: "Firma",
          key: "firma",
          width: 30
        }

      ];
      worksheet.mergeCells(
        "A1:E1"
      );
      const titulo = worksheet.getCell("A1");
      titulo.value = "REGISTRO DE ASISTENCIA";
      titulo.font = {
        bold: true,
        size: 18
      };

      titulo.alignment = {
        horizontal: "center",
        vertical: "middle"
      };
      worksheet.getRow(1).height = 30;
      worksheet.mergeCells(
        "A2:E2"
      );

      const fechaReporte =
        worksheet.getCell("A2");

      fechaReporte.value =
        `Fecha del reporte: ${dayjs().format("DD/MM/YYYY")}`;

      fechaReporte.font = {
        bold: true,
        size: 11
      };

      fechaReporte.alignment = {
        horizontal: "center",
        vertical: "middle"
      };

      const headerRow =
        worksheet.getRow(4);

      headerRow.values = [
        "ID Empleado",
        "Nombre",
        "Fecha",
        "Hora Entrada",
        "Firma"
      ];

      headerRow.height = 25;

      headerRow.eachCell(cell => {

        cell.font = {
          bold: true,
          color: {
            argb: "FFFFFFFF"
          }
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FF2962FF"
          }
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle"
        };

        cell.border = {
          top: {
            style: "thin"
          },
          bottom: {
            style: "thin"
          },
          left: {
            style: "thin"
          },
          right: {
            style: "thin"
          }
        };

      });

      for (
        let i = 0;
        i < registrosHoy.length;
        i++
      ) {

        const registro =
          registrosHoy[i];

        const fila = 5 + i;

        const row =
          worksheet.getRow(fila);

        row.height = 55;

        row.getCell(1).value =
          registro.idEmpleado;

        row.getCell(2).value =
          registro.nombre;

        row.getCell(3).value =
          dayjs(registro.fecha).format(
            "DD/MM/YYYY"
          );

        row.getCell(4).value =
          registro.hora;
        row.getCell(5).value = "";

        const canvas =
          document.createElement("canvas");

        JsBarcode(
          canvas,
          registro.idEmpleado,
          {
            format: "CODE128",
            displayValue: true,
            fontSize: 14,
            height: 40,
            margin: 5
          }
        );

        const imagen =
          canvas.toDataURL(
            "image/png"
          );

        const imageId =
          workbook.addImage({
            base64: imagen,
            extension: "png"
          });

        worksheet.addImage(
          imageId,
          {
            tl: {
              col: 0.1,
              row: fila - 0.85
            },
            ext: {
              width: 150,
              height: 45
            }
          }
        );

        for (
          let columna = 1;
          columna <= 5;
          columna++
        ) {

          const cell =
            row.getCell(columna);

          cell.alignment = {
            horizontal: "center",
            vertical: "middle"
          };

          cell.border = {

            top: {
              style: "thin",
              color: {
                argb: "FFD0D0D0"
              }
            },

            bottom: {
              style: "thin",
              color: {
                argb: "FFD0D0D0"
              }
            },

            left: {
              style: "thin",
              color: {
                argb: "FFD0D0D0"
              }
            },

            right: {
              style: "thin",
              color: {
                argb: "FFD0D0D0"
              }
            }

          };

        }

      }

      const filaTotal =
        5 + registrosHoy.length + 1;

      worksheet.mergeCells(
        `A${filaTotal}:D${filaTotal}`
      );

      const total =
        worksheet.getCell(
          `A${filaTotal}`
        );

      total.value =
        `Total de registros: ${registrosHoy.length}`;

      total.font = {
        bold: true
      };

      total.alignment = {
        horizontal: "right",
        vertical: "middle"
      };

      const buffer =
        await workbook.xlsx.writeBuffer();

      const blob = new Blob(
        [buffer],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `Asistencia_${hoy}.xlsx`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success(
        "Excel generado correctamente."
      );

    } catch (error) {

      console.error(
        "Error generando Excel:",
        error
      );

      toast.error(
        "No fue posible generar el archivo Excel."
      );
    }
  };

  const registrarQR = (texto: string) => {
    try {
      const empleado: EmpleadoQR = JSON.parse(texto);

      if (empleado.proyecto !== "proyecto_prueba") {
        toast.error("Proyecto incorrecto.");
        return;
      }

      const fecha = dayjs().format("YYYY-MM-DD");
      const hora = dayjs().format("HH:mm:ss");

      const yaExiste = asistencias.some(a =>
        a.idEmpleado === empleado.idEmpleado &&
        a.fecha === fecha
      );

      console.log(asistencias)

      if (yaExiste) {
        toast.error("El empleado ya registró entrada.");
        return;
      }

      const nuevaAsistencia: Asistencia = {
        idEmpleado: empleado.idEmpleado,
        nombre: empleado.nombre,
        fecha,
        hora
      };

      setAsistencias(prev => [
        nuevaAsistencia,
        ...prev
      ]);

      console.log(nuevaAsistencia)
      toast.success("Entrada registrada correctamente.");
    }
    catch {
      toast.error("QR inválido.");
    }
  };
  return (
    <>

      <Toaster position="top-right" />

      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,#eef2ff,#ffffff)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 4
        }}
      >

        <Card
          sx={{
            width: "100%",
            maxWidth: 900,
            borderRadius: 4,
            boxShadow: "0px 10px 35px rgba(0,0,0,.15)"
          }}
        >

          <CardContent>

            <Typography>
              Registro de Asistencia
            </Typography>

            <br />
            <Box>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={descargarExcel}
              >
                Descargar
              </Button>

              <br />
              <br />
              <Box
                sx={{
                  width: 220,
                  height: 220,
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "2px solid #ddd",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  background: "#fafafa"
                }}
                onClick={() => {
                  if (camaraActiva)
                    detenerCamara();
                  else
                    iniciarCamara();
                }}
              >

                {
                  camaraActiva ?

                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />

                    :

                    <CameraAltIcon
                      sx={{
                        fontSize: 90,
                        color: "#999"
                      }}
                    />

                }
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />
            <List>
              {
                asistencias.map((a, index) => (
                  <Card
                    key={index}
                    sx={{
                      mb: 2,
                      borderRadius: 3
                    }}
                  >

                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2
                          }}
                        >
                          <Avatar>
                            {a.nombre.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography
                            >
                              {a.nombre}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {a.idEmpleado}
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Chip
                            label="Entrada"
                            color="success"
                          />
                          <Typography
                          >
                            {a.fecha}
                          </Typography>
                          <Typography
                          >
                            {a.hora}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              }
            </List>
          </CardContent>
        </Card>
      </Box>
    </>
  );

}