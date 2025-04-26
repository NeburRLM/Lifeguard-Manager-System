import 'dotenv/config'; // importante cargar .env

export default {
  expo: {
    name: "lifeguardApp",
    slug: "lifeguardApp",
    scheme: "lifeguardapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.rulomatfg.lifeguardApp"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      API_URL: process.env.API_URL, // 👈 Aquí cargas la variable
      eas: {
        projectId: "e41cf7ed-9775-4cee-8c9a-f1ef6fea00ac"
      }
    }
  }
};
