import Keycloak from "keycloak-js";

// Single Keycloak instance, in its own module so both the auth provider and the API
// layer can import it without creating an import cycle.
export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENTID,
});
