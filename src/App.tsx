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
import { BrowserMultiFormatReader } from "@zxing/browser";
import toast, { Toaster } from "react-hot-toast";
import dayjs from "dayjs";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const codeReader = useRef(new BrowserMultiFormatReader());
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
          (result) => {
            if (result && !escaneando) {
              setEscaneando(true);

              // eslint-disable-next-line react-hooks/immutability
              registrarQR(result.getText());
              setTimeout(() => {
                setEscaneando(false);
              }, 2000);
            }
          }
        );
      } catch (e) {
        console.error(e);
        toast.error("No fue posible abrir la cámara.");
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


  const descargarPDF = () => {
    const hoy = dayjs().format("YYYY-MM-DD");

    const registrosHoy = asistencias.filter(
      a => a.fecha === hoy
    );

    if (registrosHoy.length === 0) {
      toast.error("No existen asistencias registradas el día de hoy.");
      return;
    }

    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text(
      "REGISTRO DE ASISTENCIA",
      105,
      18,
      {
        align: "center"
      }
    );

    pdf.setFontSize(11);
    pdf.text(
      "Fecha: " + dayjs().format("DD/MM/YYYY"),
      14,
      30
    );

    autoTable(pdf, {
      startY: 40,
      head: [[
        "Empleado",
        "Nombre",
        "Hora Entrada"
      ]],
      body: registrosHoy.map(r => [
        r.idEmpleado,
        r.nombre,
        r.hora
      ]),

      styles: {
        fontSize: 10
      },

      headStyles: {
        fillColor: [41, 98, 255]
      }
    });

    pdf.text(
      "Total de registros: " + registrosHoy.length,
      14,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pdf as any).lastAutoTable.finalY + 12
    );

    pdf.save(
      "Asistencia_" + hoy + ".pdf"
    );
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
                onClick={descargarPDF}
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