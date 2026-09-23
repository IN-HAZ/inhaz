module.exports = ({ config }) => {
    const googleMapsApiKey =
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY ||
        "";

    return {
        ...config,
        android: {
            ...config.android,
            permissions: Array.from(
                new Set([
                    ...(config.android?.permissions || []),
                    "ACCESS_COARSE_LOCATION",
                    "ACCESS_FINE_LOCATION",
                ]),
            ),
            config: {
                ...config.android?.config,
                googleMaps: {
                    apiKey: googleMapsApiKey,
                },
            },
        },
        plugins: [
            ...(config.plugins || []),
            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission:
                        "Autoriser inHaz à accéder à votre position pour afficher la carte et les livraisons à proximité.",
                },
            ],
        ],
    };
};
