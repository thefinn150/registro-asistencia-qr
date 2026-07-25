import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({

  plugins: [

    react(),

    basicSsl(),

    VitePWA({

      registerType: "autoUpdate",

      includeAssets: [
        "favicon.ico"
      ],

      manifest: {

        name: "Registro de Asistencia",

        short_name: "Asistencia",

        description: "Sistema de registro de asistencia mediante QR.",

        theme_color: "#2962ff",

        background_color: "#ffffff",

        display: "standalone",

        orientation: "portrait",

        start_url: "/",

        icons: [

          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },

          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }

        ]

      }

    })

  ],

  server: {
    host: true,
  }

});