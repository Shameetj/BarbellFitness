# BarbellFitness
mini app development project for my college 
# BarbellFitness

This project uses Expo prebuild/CNG: `app.json` is the source of truth for native
configuration, and `android/` is the checked-in generated output used for local Android work.
After changing native config, regenerate it with `npx expo prebuild --platform android`
and review the native diff before committing. EAS does not automatically sync `app.json`
into an already checked-in native folder.

## Production setup

Use `eas build --platform android --profile production` and configure the Android
keystore in EAS credentials. Never commit a release keystore or its passwords. A local
`assembleRelease` is intentionally unsigned unless an untracked release signing setup is
provided. Set the three `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` values (Android, iOS, and web)
to the OAuth client IDs registered for this app before enabling Google sign-in.
